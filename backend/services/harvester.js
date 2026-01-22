import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { posts as postsCollection } from './db.js';
import { searchGlobal, harvestMessages, searchGlobalMessages } from './telegramService.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('sourceurl');
puppeteer.use(stealth);

const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 2 * 60 * 1000;
const USERDATADIR = path.join(process.cwd(), 'chromium_user_data');
const EVIDENCE_DIR = path.join(process.cwd(), 'public', 'evidence');

[USERDATADIR, EVIDENCE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const PLATFORM_CONFIGS = {
    'twitter': {
        baseUrl: (q) => `https://x.com/search?q=${encodeURIComponent(q)}`,
        selector: '[data-testid="tweet"]',
        extract: async (el) => {
            const userEl = await el.$('div[data-testid="User-Name"] span');
            const textEl = await el.$('div[data-testid="tweetText"]');
            const timeEl = await el.$('time');
            const linkEl = await el.$('a[href*="/status/"]');

            return {
                author: userEl ? await (await userEl.getProperty('innerText')).jsonValue() : 'Unknown',
                content: textEl ? await (await textEl.getProperty('innerText')).jsonValue() : '',
                timestamp: timeEl ? await (await timeEl.getProperty('datetime')).jsonValue() : new Date().toISOString(),
                url: linkEl ? await (await linkEl.getProperty('href')).jsonValue() : null
            };
        }
    },
    'telegram': {
        baseUrl: (q) => {
            if (q.includes('t.me')) return q.replace('t.me/', 't.me/s/');
            return `https://www.google.com/search?q=site:t.me/s/+${encodeURIComponent(q)}`;
        },
        selector: '.tgme_widget_message',
        extract: async (el, page) => {
            const authorEl = await el.$('.tgme_widget_message_owner_name');
            const textEl = await el.$('.tgme_widget_message_text');
            const timeEl = await el.$('.time');
            return {
                author: authorEl ? await page.evaluate(el => el.innerText, authorEl) : 'Unknown',
                content: textEl ? await page.evaluate(el => el.innerText, textEl) : '[Media Only]',
                timestamp: timeEl ? await page.evaluate(el => el.getAttribute('datetime'), timeEl) : new Date().toISOString(),
                url: null
            };
        }
    },
    'reddit': {
        baseUrl: (q) => `https://old.reddit.com/search?q=${encodeURIComponent(q)}&sort=new`,
        selector: 'div.search-result-link',
        extract: async (el, page) => {
            // console.log("[Reddit] Extracting element...");
            const titleEl = await el.$('a.search-title');
            const authorEl = await el.$('span.search-author a');
            const timeEl = await el.$('span.search-time time');

            return {
                author: authorEl ? await page.evaluate(el => el.innerText, authorEl) : 'Unknown',
                content: titleEl ? await page.evaluate(el => el.innerText, titleEl) : '',
                timestamp: timeEl ? await page.evaluate(el => el.getAttribute('datetime'), timeEl) : new Date().toISOString(),
                url: titleEl ? await page.evaluate(el => el.href, titleEl) : null
            };
        }
    },
    'facebook': {
        baseUrl: (q) => `https://www.facebook.com/search/posts/?q=${encodeURIComponent(q)}`,
        selector: 'div[role="article"], div[aria-posinset], div[role="feed"] > div',
        extract: async (el, page) => {
            // Enhanced selector for Facebook Author name
            const authorEl = await el.$('h3 strong, h4 strong, a[role="link"] strong, span > a[role="link"]');
            const textEl = await el.$('div[dir="auto"], span[dir="auto"]');
            const linkEl = await el.$('a[href*="/posts/"], a[href*="/photo"], a[href*="permalink"], a[href*="fbid="]');
            const timeEl = await el.$('a[aria-label] span, span[id*="jsc_c"]');

            const data = {
                author: authorEl ? await page.evaluate(el => el.innerText, authorEl) : 'Unknown',
                content: textEl ? await page.evaluate(el => el.innerText, textEl) : '',
                timestamp: timeEl ? await page.evaluate(el => el.innerText, timeEl) : new Date().toISOString(),
                url: linkEl ? await page.evaluate(el => el.href, linkEl) : null
            };

            if (data.content || data.url) {
                console.log(`[FB-DEBUG] Extracted: ${data.author} - ${data.content.slice(0, 30)}...`);
            }
            return data;
        }
    },
    'linkedin': {
        baseUrl: (q) => `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(q)}&sortBy=recent`,
        selector: '.feed-shared-update-v2, li.reusable-search__result-container, div[data-urn]',

        extract: async (el, page) => {
            // console.log("[LinkedIn] Attempting extraction...");
            const getTxt = async (sel) => {
                try {
                    const node = await el.$(sel);
                    return node ? await page.evaluate(n => n.innerText.trim(), node) : null;
                } catch (e) { return null; }
            };

            const author = await getTxt('.feed-shared-actor__name') ||
                await getTxt('.update-components-actor__name') ||
                await getTxt('.app-aware-link span[dir="ltr"] > span') || 'LinkedIn User';

            const content = await getTxt('.feed-shared-update-v2__description') ||
                await getTxt('.feed-shared-text') ||
                await getTxt('.break-words') || '';

            // Improved URL Extraction using URN
            let url = null;
            try {
                // Try to find the data-urn on the element itself or a parent/child
                const urn = await page.evaluate(e => {
                    // Check for urn on element or children
                    let u = e.getAttribute('data-urn') || e.querySelector('[data-urn]')?.getAttribute('data-urn');
                    // Backup: check for data-id which is sometimes the activity ID
                    if (!u) {
                        const dataId = e.getAttribute('data-id') || e.querySelector('[data-id]')?.getAttribute('data-id');
                        if (dataId && !isNaN(dataId)) u = `urn:li:activity:${dataId}`;
                    }
                    return u;
                }, el);

                if (urn) {
                    url = `https://www.linkedin.com/feed/update/${urn}`;
                } else {
                    // Fallback: Check for the '...' menu or any link containing '/activity/'
                    const linkEl = await el.$('a[href*="/activity/"], a.app-aware-link');
                    if (linkEl) {
                        const rawHref = await page.evaluate(n => n.href, linkEl);
                        // Clean up href to be just the activity part if possible
                        if (rawHref.includes('/activity/')) {
                            const match = rawHref.match(/activity-([0-9]+)/);
                            if (match) url = `https://www.linkedin.com/feed/update/urn:li:activity:${match[1]}`;
                            else url = rawHref.split('?')[0];
                        } else {
                            url = rawHref;
                        }
                    }
                }
            } catch (e) { console.error("[LinkedIn] URL extraction error:", e); }

            return {
                author: author,
                content: content,
                timestamp: new Date().toISOString(), // LinkedIn dates are hard to parse relative strings, keeping generic for now
                url: url
            };
        }
    },
    'instagram': {
        baseUrl: (q) => `https://www.instagram.com/explore/tags/${encodeURIComponent(q.replace(/\s+/g, ''))}/`,
        selector: 'article a, a[href^="/p/"]',
        extract: async (el, page) => {
            const imgEl = await el.$('img');
            const caption = imgEl ? await page.evaluate(el => el.alt, imgEl) : '';


            // Attempt to extract username from Alt Text "Photo by username..."
            let author = 'Instagram User';
            const userMatch = caption?.match(/Photo by ([^\s]+)|Image by ([^\s]+)/);
            if (userMatch) {
                author = userMatch[1] || userMatch[2];
            }

            return {
                author: author,
                content: caption || '[Instagram Post]',
                timestamp: new Date().toISOString(),
                url: await page.evaluate(el => el.href, el)
            };
        }
    }
};

const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
};

const waitForAbortable = (promise, signal) => {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(new Error('Job aborted by user.'));

    promise.catch(() => { });

    return Promise.race([
        promise,
        new Promise((_, reject) => {
            const listener = () => reject(new Error('Job aborted by user.'));
            signal.addEventListener('abort', listener);
            promise.finally(() => signal.removeEventListener('abort', listener));
        })
    ]);
};

export async function runUniversalScraper(platform, query, limit = 50, sourceTag, onBatchFound, abortSignal) {
    if (platform === 'x') platform = 'twitter';
    const config = PLATFORM_CONFIGS[platform];
    if (!config) throw new Error(`Platform '${platform}' not supported yet.`);

    const logPrefix = `[${platform.toUpperCase()}:${sourceTag}]`;
    console.log(`${logPrefix} Starting generic scrape for: ${query}`);

    let currentBatch = [];
    let totalCount = 0;
    let lastBatchSentTime = Date.now();

    const flushBatch = async (reason) => {
        if (currentBatch.length > 0) {
            console.log(`${logPrefix} Sending batch of ${currentBatch.length} (${reason})...`);
            if (onBatchFound) await onBatchFound(currentBatch);
            currentBatch = [];
            lastBatchSentTime = Date.now();
        }
    };

    // --- TELEGRAM API MODE ---
    if (platform === 'telegram' && process.env.TELEGRAM_SESSION) {
        try {
            let channelsToScrape = [];
            let directMessages = [];

            if (query.includes('t.me/')) {
                const username = query.split('/').pop().split('?')[0];
                channelsToScrape.push({ username: username, url: query });
            } else {
                console.log(`${logPrefix} API Searching Global CHANNELS for: ${query}`);
                try { channelsToScrape = await searchGlobal(query, 5); } catch (e) { }

                console.log(`${logPrefix} API Searching Global MESSAGES for: ${query}`);
                try { directMessages = await searchGlobalMessages(query, 50); } catch (e) { }

                console.log(`${logPrefix} Found ${channelsToScrape.length} Channels and ${directMessages.length} Direct Messages via API.`);
            }

            if (channelsToScrape.length === 0 && directMessages.length === 0) {
                throw new Error("No API results found. Switching to Web Discovery...");
            }

            // 1. Process Channels
            for (const channel of channelsToScrape) {
                if (totalCount >= limit) break;
                if (!channel.username) continue;

                console.log(`${logPrefix} API Harvesting Channel: ${channel.username}`);
                try {
                    const messages = await harvestMessages(channel.username, 20);
                    const normalized = messages.map(m => ({
                        ...m,
                        author: channel.title || channel.username,
                        username: channel.username
                    }));
                    directMessages.push(...normalized);
                } catch (err) {
                    console.error(`${logPrefix} Failed to harvest ${channel.username}: ${err.message}`);
                }
            }

            // 2. Process All Messages
            console.log(`${logPrefix} Processing ${directMessages.length} total messages...`);

            const uniqueMessages = [];
            const seenIds = new Set();
            for (const m of directMessages) {
                const uid = `${m.username}_${m.id}`;
                if (!seenIds.has(uid)) {
                    seenIds.add(uid);
                    uniqueMessages.push(m);
                }
            }

            for (const msg of uniqueMessages) {
                if (totalCount >= limit) break;

                const platformId = `tg_${msg.username || 'unknown'}_${msg.id}`;

                const postData = {
                    twitterPostId: platformId,
                    platform: platform,
                    sourceUrl: msg.url || `https://t.me/c/${msg.username || 'private'}/${msg.id}`,
                    author: msg.author || msg.username || 'Unknown',
                    content: msg.text || "[Media/Empty]",
                    timestamp: new Date(msg.date * 1000),
                    source: sourceTag,
                    sourceTag: sourceTag,
                    severity: 'New',
                    enrichmentData: { views: msg.views }
                };

                const result = await postsCollection.updateOne(
                    { twitterPostId: postData.twitterPostId },
                    { $set: postData },
                    { upsert: true }
                );

                if (result.upsertedId || result.modifiedCount > 0) {
                    currentBatch.push({ ...postData, _id: result.upsertedId });
                    totalCount++;
                }

                if (currentBatch.length >= BATCH_SIZE) await flushBatch("Batch Full");
            }

            await flushBatch("Job Complete");
            return totalCount;

        } catch (e) {
            console.error(`${logPrefix} API Mode Failed/Skipped: ${e.message}`);
            console.log(`${logPrefix} Falling back to Web Scraper...`);
        }
    } else if (platform === 'telegram') {
        console.log(`${logPrefix} No API Session. Defaulting to Web Scraper.`);
    }

    // --- WEB SCRAPER MODE ---
    let browser = null;

    try {
        const launchArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled', // Critical for FB
            '--disable-notifications'
        ];

        const profileDir = path.join(USERDATADIR, `${platform}_session`);

        browser = await puppeteer.launch({
            headless: (platform === 'facebook' || platform === 'instagram' || platform === 'linkedin' || platform === 'telegram' || platform === 'twitter' || platform === 'reddit') ? true : true,
            executablePath: executablePath(),
            userDataDir: profileDir,
            args: launchArgs,
            ignoreDefaultArgs: ['--enable-automation']
        });

        const page = await browser.newPage();

        // Anti-Detection Evasions
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        await page.setViewport({ width: 1280, height: 800 }); // Standard Desktop Res

        if (platform === 'twitter' || platform === 'facebook' || platform === 'instagram') {
            const homeUrl = platform === 'twitter' ? 'https://x.com/home' : (platform === 'facebook' ? 'https://www.facebook.com/' : 'https://www.instagram.com/');

            console.log(`${logPrefix} Warming up session at ${homeUrl}...`);
            await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

            try {
                // Extended wait to allow manual login if needed
                const title = await page.title();
                const url = await page.url();
                const needsLogin = title.toLowerCase().includes('log') || title.toLowerCase().includes('sign') || url.includes('login') || url.includes('welcome');

                if (needsLogin) {
                    console.log(`${logPrefix} 🛑 LOGIN REQUIRED! Please log in manually in the browser window.`);
                    console.log(`${logPrefix} Waiting 60 seconds for you to login...`);
                    await new Promise(r => setTimeout(r, 60000));
                } else {
                    console.log(`${logPrefix} ✅ Session appears valid (Title: "${title}").`);
                }
            } catch (e) { }
        }

        if (platform === 'twitter') {
            console.log(`${logPrefix} Checking Twitter specific selectors...`);

            try {
                await page.waitForSelector('[data-testid="primaryColumn"]', { timeout: 30000 });
            } catch (e) {
                console.error(`${logPrefix} Fatal error during login wait:`, e);
                // Proceed anyway to see if scraping works
            }
        }

        let targets = [config.baseUrl(query)];

        for (let tIdx = 0; tIdx < targets.length; tIdx++) {
            const url = targets[tIdx];
            if (totalCount >= limit) break;

            console.log(`${logPrefix} [Target ${tIdx + 1}/${targets.length}] Navigating to: ${url}`);
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
            } catch (e) {
                console.error(`${logPrefix} Navigation failed: ${e.message}`);
                continue;
            }
            console.log(`${logPrefix} Page Title: ${await page.title()}`);

            // Telegram Web Discovery (Google Fallback)
            if (platform === 'telegram' && url.includes('google.com')) {
                console.log(`${logPrefix} Performing Channel Discovery via Google...`);
                try {
                    await page.waitForSelector('a[href*="t.me"]', { timeout: 120000 });
                    const discoveredChannels = await page.evaluate(() => {
                        const anchors = Array.from(document.querySelectorAll('a[href*="t.me"]'));
                        return [...new Set(anchors
                            .map(a => a.href)
                            .filter(href => href.startsWith('https://t.me/') && !href.includes('google.com'))
                            .map(href => href.includes('/s/') ? href : href.replace('t.me/', 't.me/s/'))
                        )].slice(0, 5);
                    });

                    if (discoveredChannels.length > 0) {
                        console.log(`${logPrefix} Discovered:`, discoveredChannels);
                        targets.push(...discoveredChannels);
                    }
                    continue;
                } catch (e) {
                    console.error(`${logPrefix} Discovery failed:`, e.message);
                    continue;
                }
            }

            let postsFromCurrentTarget = 0;
            const maxPostsPerTarget = Math.max(10, Math.floor((limit - totalCount) / (targets.length - tIdx || 1)));

            console.log(`${logPrefix} Target Limit: ${maxPostsPerTarget}`);

            while (totalCount < limit && postsFromCurrentTarget < maxPostsPerTarget) {
                if (browser && !browser.isConnected()) break;
                if (abortSignal && abortSignal.aborted) {
                    console.log(`${logPrefix} Job aborted by user.`);
                    break;
                }

                try {
                    // Login / Popup Handling
                    if (platform === 'facebook' || platform === 'instagram' || platform === 'linkedin') {
                        try {
                            await page.click('body');
                            await page.keyboard.press('Escape');
                        } catch (e) { }
                        for (let i = 0; i < 3; i++) {
                            await page.evaluate(() => window.scrollBy(0, 800));
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }

                    const waitTimeout = (totalCount === 0) ? 60000 : 10000;
                    await waitForAbortable(page.waitForSelector(config.selector, { timeout: waitTimeout }), abortSignal);
                } catch (e) {
                    if (abortSignal && abortSignal.aborted) break;

                    const isTargetClosed = e.message.includes('Target closed') ||
                        e.message.includes('Protocol error') ||
                        e.message.includes('Session closed');

                    if (isTargetClosed) {
                        console.log(`${logPrefix} Browser session ended (Target Closed).`);
                        break;
                    }

                    try {
                        if (browser && !browser.isConnected()) break;
                        const title = await page.title();
                        const url = await page.url();
                        if (title.toLowerCase().includes('log') || url.includes('login')) {
                            console.error(`${logPrefix} [ATTENTION] LOGIN REQUIRED ("${title}").`);
                        } else {
                            console.error(`${logPrefix} Selector wait timeout.`);
                        }
                    } catch (err) {
                        break;
                    }
                    break;
                }

                const elements = await page.$$(config.selector);

                for (const el of elements) {
                    if (totalCount >= limit) break;
                    try {
                        const extracted = await config.extract(el, page);
                        if (!extracted.content && !extracted.url) continue;


                        const platformId = crypto.createHash('md5')
                            .update(extracted.url || (extracted.content + extracted.author)) // Use Author instead of Timestamp for stability
                            .digest('hex');

                        const filename = `${platform}_${platformId}.png`;
                        const filepath = path.join(EVIDENCE_DIR, filename);
                        let screenshotPath = null;

                        if (!fs.existsSync(filepath)) {
                            // Screenshotting each element usually slow, maybe optimized? 
                            // Keeping it for now.
                            try { await el.screenshot({ path: filepath }); screenshotPath = `/evidence/${filename}`; } catch (e) { }
                        }

                        const postData = {
                            twitterPostId: platformId,
                            platform: platform,
                            sourceUrl: extracted.url,
                            author: extracted.author,
                            content: extracted.content,
                            timestamp: extracted.timestamp,
                            screenshotPath: screenshotPath,
                            source: sourceTag,
                            sourceTag: sourceTag
                        };

                        const result = await postsCollection.updateOne(
                            { twitterPostId: postData.twitterPostId },
                            { $set: postData }, // Claiming logic
                            { upsert: true }
                        );

                        if (result.upsertedId || result.modifiedCount > 0) {
                            currentBatch.push({ ...postData, _id: result.upsertedId });
                            totalCount++;
                            postsFromCurrentTarget++;
                        }

                        if (currentBatch.length >= BATCH_SIZE) await flushBatch("Batch Full");

                    } catch (e) { }
                }

                // Next Page / Scroll Logic
                if (platform === 'reddit') {
                    const nextButton = await page.$('.next-button a');
                    if (nextButton) {
                        await Promise.all([page.waitForNavigation({ timeout: 60000 }), nextButton.click()]);
                    } else break;
                } else {
                    const previousHeight = await page.evaluate('document.body.scrollHeight');
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                    await new Promise(r => setTimeout(r, 2000));
                    const newHeight = await page.evaluate('document.body.scrollHeight');
                    if (newHeight === previousHeight) break;
                }
            }
        }

        await flushBatch("Job Complete");
        return totalCount;

    } catch (e) {
        if (e.message.includes('Job stopped')) {
            console.log(`${logPrefix} Job stopped.`);
        } else {
            console.error(`${logPrefix} Crash:`, e);
        }
        await flushBatch("Job Stopped");
        return totalCount;
    } finally {
        if (browser) await browser.close();
    }
}

export const closeActiveBrowser = async () => { };
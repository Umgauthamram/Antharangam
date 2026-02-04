import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { posts as postsCollection } from './db.js';
import { searchGlobal, harvestMessages, searchGlobalMessages } from './telegramService.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';

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
            const getTxt = async (sel) => {
                try {
                    const node = await el.$(sel);
                    return node ? await page.evaluate(n => n.innerText.trim(), node) : null;
                } catch (e) { return null; }
            };

            const author = await getTxt('.feed-shared-actor__name') ||
                await getTxt('.update-components-actor__name') ||
                await getTxt('.update-components-actor__title') ||
                await getTxt('span[class*="actor__name"]') ||
                await getTxt('.app-aware-link span[dir="ltr"] > span') || 'LinkedIn User';

            const content = await getTxt('.feed-shared-update-v2__description') ||
                await getTxt('.feed-shared-text') ||
                await getTxt('.update-components-text') ||
                await getTxt('.break-words') || '';

            let url = null;
            try {
                const urn = await page.evaluate(e => {
                    let u = e.getAttribute('data-urn') || e.querySelector('[data-urn]')?.getAttribute('data-urn');
                    if (!u) {
                        const dataId = e.getAttribute('data-id') || e.querySelector('[data-id]')?.getAttribute('data-id');
                        if (dataId && !isNaN(dataId)) u = `urn:li:activity:${dataId}`;
                    }
                    return u;
                }, el);

                if (urn) {
                    url = `https://www.linkedin.com/feed/update/${urn}`;
                } else {
                    const linkEl = await el.$('a[href*="/activity/"], a.app-aware-link, a[class*="update-content"]');
                    if (linkEl) {
                        const rawHref = await page.evaluate(n => n.href, linkEl);
                        if (rawHref.includes('/activity/')) {
                            const match = rawHref.match(/activity-([0-9]+)/);
                            if (match) url = `https://www.linkedin.com/feed/update/urn:li:activity:${match[1]}`;
                            else url = rawHref.split('?')[0];
                        } else {
                            url = rawHref;
                        }
                    }
                }
            } catch (e) { }

            return {
                author: author,
                username: author, // Duplicate for frontend fallback
                content: content,
                timestamp: new Date().toISOString(),
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
            const postUrl = await page.evaluate(el => el.href, el);

            // Attempt to extract username from Alt Text or URL (if possible)
            let author = 'Instagram User';
            const userMatch = caption?.match(/Photo by ([^\s]+)|Image by ([^\s]+)/);
            if (userMatch) {
                author = userMatch[1] || userMatch[2];
            } else if (postUrl) {
                // Sometimes the URL might help but usually it's just /p/CODE
            }

            return {
                author: author.replace(/[.,!]$/, ''), // Clean trailing punctuation
                username: author,
                content: caption || '[Instagram Post]',
                timestamp: new Date().toISOString(),
                url: postUrl
            };
        }
    },
    // 'google': {
    //     baseUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    //     selector: 'div.g',
    //     extract: async (el, page) => {
    //         const titleEl = await el.$('h3');
    //         const linkEl = await el.$('a');

    //         const snippet = await page.evaluate(el => {
    //             const s = el.querySelector('div.VwiC3b, div.yD9v9d, div[style*="-webkit-line-clamp"]');
    //             return s ? s.innerText : '';
    //         }, el);

    //         const title = titleEl ? await page.evaluate(el => el.innerText, titleEl) : 'Untitled';
    //         const url = linkEl ? await page.evaluate(el => el.href, linkEl) : null;

    //         return {
    //             author: 'Google Web',
    //             username: url ? new URL(url).hostname : 'Web',
    //             content: snippet,
    //             title: title,
    //             timestamp: new Date().toISOString(),
    //             url: url
    //         };
    //     }
    // },
    // 'github': {
    //     baseUrl: (q) => `https://github.com/search?q=${encodeURIComponent(q)}&type=repositories`,
    //     selector: 'div[data-testid="results-list"] > div, .repo-list-item, div.Box-row',
    //     extract: async (el, page) => {
    //         const titleEl = await el.$('h3 a, span a');
    //         const descEl = await el.$('span[class*="Text"], div[class*="Text"]');
    //         const dateEl = await el.$('relative-time');

    //         const href = titleEl ? await page.evaluate(el => el.href, titleEl) : null;
    //         const repoText = titleEl ? await page.evaluate(el => el.innerText, titleEl) : 'Unknown';
    //         const description = descEl ? await page.evaluate(el => el.innerText, descEl) : '';
    //         const timestamp = dateEl ? await page.evaluate(el => el.getAttribute('datetime'), dateEl) : new Date().toISOString();

    //         const author = repoText.split('/')[0] || 'GitHub User';

    //         return {
    //             author: author.trim(),
    //             username: author.trim(),
    //             content: `Repository: ${repoText}\nDescription: ${description}`,
    //             timestamp: timestamp,
    //             url: href
    //         };
    //     }
    // },
    'duckduckgo': {
        baseUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}&t=h_&ia=web`,
        selector: 'article[data-testid="result"]',
        extract: async (el, page) => {
            const titleEl = await el.$('a[data-testid="result-title-a"]');
            const snippetEl = await el.$('div[data-testid="result-snippet"]');

            const title = titleEl ? await page.evaluate(el => el.innerText, titleEl) : 'Untitled';
            const url = titleEl ? await page.evaluate(el => el.href, titleEl) : null;
            const snippet = snippetEl ? await page.evaluate(el => el.innerText, snippetEl) : '';

            return {
                author: 'DuckDuckGo Web',
                username: url ? new URL(url).hostname : 'Web',
                content: snippet,
                title: title,
                timestamp: new Date().toISOString(),
                url: url
            };
        }
    }

};

// const calculateFileHash = (filePath) => {
//     return new Promise((resolve, reject) => {
//         const hash = crypto.createHash('sha256');
//         const stream = fs.createReadStream(filePath);
//         stream.on('data', (data) => hash.update(data));
//         stream.on('end', () => resolve(hash.digest('hex')));
//         stream.on('error', reject);
//     });
// };

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
    if (!config) {
        console.warn(`[Harvester] Platform '${platform}' is disabled or not supported. Skipping.`);
        return 0;
    }

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
    let apiSuccess = false;

    const tgSession = process.env.TELEGRAM_SESSION || process.env["TELEGRAM_SESSION "];

    if (platform === 'telegram' && tgSession) {
        console.log(`${logPrefix} 🔑 Telegram API Session detected. Using API Mode.`);
        try {
            let channelsToScrape = [];
            let directMessages = [];

            if (query.includes('t.me/')) {
                const username = query.split('/').pop().split('?')[0];
                channelsToScrape.push({ username: username, url: query });
            } else {
                console.log(`${logPrefix} API Phase 1: Global Channel Discovery for: ${query}`);
                try { channelsToScrape = await searchGlobal(query, 10); } catch (e) { }

                console.log(`${logPrefix} API Phase 2: Global Message Search for: ${query}`);
                let msgResults = { messages: [], discoveredChannels: [] };
                try { msgResults = await searchGlobalMessages(query, 100); } catch (e) { }

                directMessages.push(...msgResults.messages);

                // Add channels found via message search to our scraping target list
                msgResults.discoveredChannels.forEach(chan => {
                    if (!channelsToScrape.find(c => c.username === chan.username)) {
                        channelsToScrape.push(chan);
                    }
                });

                // ADVANCED FALLBACK: If 0 results for multi-word query, try the first / most unique word 
                const queryParts = query.split(/\s+/).filter(p => p.length > 3);
                if (directMessages.length === 0 && channelsToScrape.length === 0 && queryParts.length > 1) {
                    const broadQuery = queryParts[0];
                    console.log(`${logPrefix}    Zero results for "${query}". Retrying with Broad Search: "${broadQuery}"`);

                    try {
                        const broadMsgResults = await searchGlobalMessages(broadQuery, 50);
                        // Local filter: Keep messages from broad results that match ANY of the original parts
                        const filtered = broadMsgResults.messages.filter(m =>
                            queryParts.some(term => m.text.toLowerCase().includes(term.toLowerCase()))
                        );
                        directMessages.push(...filtered);
                        console.log(`${logPrefix} Broad Search recovered ${filtered.length} relevant messages.`);
                    } catch (e) { }
                }

                console.log(`${logPrefix} 🗺️ Discovery Phase Complete. Found ${channelsToScrape.length} relevant channels and ${directMessages.length} direct messages.`);
            }

            // 1. Process Channels (Deep Harvest)
            const seenChannelUsernames = new Set();
            for (const channel of channelsToScrape) {
                if (totalCount >= limit) break;
                if (!channel.username || seenChannelUsernames.has(channel.username)) continue;
                seenChannelUsernames.add(channel.username);

                console.log(`${logPrefix} 📥 Deep Harvesting Channel: @${channel.username}`);
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
            if (directMessages.length > 0) {
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
            } else {
                console.log(`${logPrefix} API Mode: No messages found for query.`);
            }

            await flushBatch("Job Complete");
            apiSuccess = true;
            return totalCount;

        } catch (e) {
            console.error(`${logPrefix}     Telegram API Mode Failed: ${e.message}`);

            // CRITICAL: If session exists but failed, don't fall back to web scraper 
            // as it will likely just time out or get blocked.
            console.log(`${logPrefix} API session is present but failed. Aborting to avoid flaky web fallback.`);
            return totalCount;
        }
    } else if (platform === 'telegram') {
        console.log(`${logPrefix}    No Telegram API Session found in .env. Attempting (highly restricted) Web Scraper fallback.`);
    }

    if (apiSuccess) return totalCount;

    let browser = null;

    try {
        const launchArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-notifications'
        ];

        if (process.env.PROXY_URL) {
            console.log(`${logPrefix} Using Proxy: ${process.env.PROXY_URL}`);
            launchArgs.push(`--proxy-server=${process.env.PROXY_URL}`);
        }

        const profileDir = path.join(USERDATADIR, `${platform}_session`);

        browser = await puppeteer.launch({
            // headless: (platform === 'google' || platform === 'facebook' || platform === 'linkedin' || platform === 'instagram' || platform === 'twitter' || platform === 'github' || platform === 'duckduckgo') ? true : true,
            headless: process.env.HEADLESS === 'true' ? true : true,
            // headless: platform ===  'google' ? false : false,
            executablePath: executablePath(),
            userDataDir: profileDir,
            args: launchArgs,
            ignoreDefaultArgs: ['--enable-automation']
        });

        if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
            const page = await browser.newPage();
            await page.authenticate({
                username: process.env.PROXY_USERNAME,
                password: process.env.PROXY_PASSWORD
            });
            await page.close();
        }

        const page = await browser.newPage();

        // Anti-Detection Evasions
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        await page.setViewport({ width: 1280, height: 800 }); // Standard Desktop Res

        // --- GOOGLE CONSENT HANDLING ---
        if (platform === 'google') {
            await page.goto("https://www.google.com", { waitUntil: 'domcontentloaded' });
            try {
                // Check for Consent or CPATCHA immediately on load
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) { }
        }

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
                    console.log(`${logPrefix}   Session appears valid (Title: "${title}").`);
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
        if (platform === 'google') {
            targets.push(config.baseUrl(query) + "&start=10"); // Page 2
        }

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

            // Google Cloudflare/Bot Check Mitigation (Advanced)
            const title = await page.title();
            const currentUrl = await page.url();

            if (platform === 'google' && (title.includes('Restricted') || currentUrl.includes('google.com/sorry') || title.includes('Before you continue'))) {
                console.error(`${logPrefix} 🛑 Google BLOCKED access (CAPTCHA detected).`);
                console.log(`${logPrefix} ⚠️ PAUSING execution for 5 minutes. Please MANUALLY solve the CAPTCHA in the browser window!`);

                // Wait for user to solve it
                const maxWait = 300; // 5 mins
                for (let w = 0; w < maxWait; w++) {
                    await new Promise(r => setTimeout(r, 1000));
                    const newUrl = await page.url();
                    if (!newUrl.includes('google.com/sorry') && !newUrl.includes('consent.google')) {
                        console.log(`${logPrefix} ✅ CAPTCHA Solved! Resuming...`);
                        break;
                    }
                    if (w % 30 === 0) console.log(`${logPrefix} ...waiting for manual solve (${w}/${maxWait}s)`);
                }
            }

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

                const selector = (platform === 'google' || platform === 'duckduckgo') ? (platform === 'google' ? 'div.g, div.tF2Cxc, div.MjjYud' : config.selector) : config.selector;

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

                    try {
                        const loadingSelector = platform === 'github' ? 'div[data-testid="results-list"]' : selector;
                        await waitForAbortable(page.waitForSelector(loadingSelector, { timeout: waitTimeout }), abortSignal);
                    } catch (err) {
                        if (platform === 'google') {
                            const debugPath = path.join(EVIDENCE_DIR, 'debug_google_crash.png');
                            try { await page.screenshot({ path: debugPath }); } catch (e) { }
                            console.error(`${logPrefix} Saved debug screenshot to /evidence/debug_google_crash.png`);
                        }
                        console.warn(`${logPrefix} Wait for selector '${selector}' timed out or failed: ${err.message}`);
                        // Don't throw, just let the flow continue to check for elements (which will be 0) and handle "No results" logic
                    }
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

                const elements = await page.$$(selector);
                console.log(`${logPrefix}  Found ${elements.length} elements matching selector "${selector}"`);

                if (elements.length === 0 && postsFromCurrentTarget === 0) {
                    console.log(`${logPrefix} No results found on current target. Page source may have changed or access is restricted.`);
                }

                for (const el of elements) {
                    if (totalCount >= limit) break;
                    try {
                        let extracted = await config.extract(el, page);
                        if (!extracted.content && !extracted.url) continue;

                        // --- GOOGLE & DUCKDUCKGO DEEP CRAWL ---
                        if ((platform === 'google' || platform === 'duckduckgo') && extracted.url) {
                            console.log(`${logPrefix} Deep Crawling: ${extracted.url}`);
                            const detailPage = await browser.newPage();
                            try {
                                await detailPage.goto(extracted.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                                const fullContent = await detailPage.evaluate(() => {
                                    const selectors = ['article', 'main', '.content', '.post-content', 'body'];
                                    for (const sel of selectors) {
                                        const el = document.querySelector(sel);
                                        if (el && el.innerText.length > 200) return el.innerText;
                                    }
                                    return Array.from(document.querySelectorAll('p')).map(p => p.innerText).join('\n\n');
                                });
                                if (fullContent && fullContent.length > 100) {
                                    extracted.content = fullContent.slice(0, 5000); // Store up to 5k chars
                                    console.log(`${logPrefix}   Extracted ${fullContent.length} chars from page.`);
                                }
                            } catch (err) {
                                console.error(`${logPrefix}     Failed deep crawl: ${err.message}`);
                            } finally {
                                await detailPage.close();
                            }
                        }

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
                            timestamp: new Date(extracted.timestamp || Date.now()).toISOString(),
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
        const isAborted = e.message.toLowerCase().includes('aborted') || e.message.toLowerCase().includes('stopped');
        if (isAborted) {
            console.log(`${logPrefix} Job stopped/aborted.`);
        } else {
            console.error(`${logPrefix} Crash:`, e);
        }
        await flushBatch("Job Stopped");
        return totalCount;
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (err) {
                console.error(`${logPrefix} Error closing browser:`, err.message);
            }
        }
    }
}

export const closeActiveBrowser = async () => { };
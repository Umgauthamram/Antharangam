import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { posts as postsCollection } from './db.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

puppeteer.use(StealthPlugin());

const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 2 * 60 * 1000;
const USERDATADIR = path.join(process.cwd(), 'chromium_user_data');
const EVIDENCE_DIR = path.join(process.cwd(), 'public', 'evidence');

[USERDATADIR, EVIDENCE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

let activeBrowser = null;

const PLATFORM_CONFIGS = {
    'twitter': {
        baseUrl: (q) => `https://x.com/search?q=${encodeURIComponent(q)}&f=live`,
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
            return `https://www.google.com/search?q=site:t.me+${encodeURIComponent(q)}`;
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
        baseUrl: (q) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}&sort=new`,
        selector: 'shreddit-post',
        extract: async (el, page) => {
            return {
                author: await el.evaluate(el => el.getAttribute('author')),
                content: await el.evaluate(el => el.getAttribute('post-title') + " " + (el.getAttribute('content-text') || "")),
                timestamp: await el.evaluate(el => el.getAttribute('created-timestamp')),
                url: await el.evaluate(el => el.getAttribute('content-href'))
            };
        }
    },
    'facebook': {
        baseUrl: (q) => `https://www.facebook.com/search/posts/?q=${encodeURIComponent(q)}`,
        selector: '.x1y1aw1k',  // Post container (requires login)
        extract: async (el, page) => {
            const authorEl = await el.$('.x193iq5w');
            const textEl = await el.$('.x1i10hfl');
            const timeEl = await el.$('abbr');
            const linkEl = await el.$('a[href*="posts"]');
            return {
                author: authorEl ? await page.evaluate(el => el.innerText, authorEl) : 'Unknown',
                content: textEl ? await page.evaluate(el => el.innerText, textEl) : '',
                timestamp: timeEl ? await page.evaluate(el => el.getAttribute('title'), timeEl) : new Date().toISOString(),
                url: linkEl ? await page.evaluate(el => el.href, linkEl) : null
            };
        }
    },
    'linkedin': {
        baseUrl: (q) => `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(q)}&sortBy=recent`,
        selector: '.update-components-article',  // Post container (requires login)
        extract: async (el, page) => {
            const authorEl = await el.$('.update-components-actor__name');
            const textEl = await el.$('.update-components-text');
            const timeEl = await el.$('time');
            const linkEl = await el.$('a[href*="posts"]');
            return {
                author: authorEl ? await page.evaluate(el => el.innerText, authorEl) : 'Unknown',
                content: textEl ? await page.evaluate(el => el.innerText, textEl) : '',
                timestamp: timeEl ? await page.evaluate(el => el.innerText, timeEl) : new Date().toISOString(),
                url: linkEl ? await page.evaluate(el => el.href, linkEl) : null
            };
        }
    },
    'instagram': {
        baseUrl: (q) => `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(q)}`,  // Requires login for full results
        selector: 'article',  // Post container
        extract: async (el, page) => {
            const authorEl = await el.$('._a9zc');
            const textEl = await el.$('._a9zs');
            const timeEl = await el.$('time');
            const linkEl = await el.$('a[href*="p/"]');
            return {
                author: authorEl ? await page.evaluate(el => el.innerText, authorEl) : 'Unknown',
                content: textEl ? await page.evaluate(el => el.innerText, textEl) : '[Image/Video]',
                timestamp: timeEl ? await page.evaluate(el => el.getAttribute('datetime'), timeEl) : new Date().toISOString(),
                url: linkEl ? await page.evaluate(el => el.href, linkEl) : null
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

export const closeActiveBrowser = async () => {
    if (activeBrowser) {
        try { await activeBrowser.close(); } catch (e) {}
        activeBrowser = null;
    }
};

export async function runUniversalScraper(platform, query, limit = 50, sourceTag, onBatchFound) {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) throw new Error(`Platform '${platform}' not supported yet.`);

    const logPrefix = `[${platform.toUpperCase()}:${sourceTag}]`;
    console.log(`${logPrefix} Starting generic scrape for: ${query}`);

    let currentBatch = []; 
    let totalCount = 0;
    let lastBatchSentTime = Date.now();

    const flushBatch = async (reason) => {
        if (currentBatch.length > 0) {
            console.log(`${logPrefix}  Sending batch of ${currentBatch.length} (${reason})...`);
            if (onBatchFound) await onBatchFound(currentBatch);
            currentBatch = [];
            lastBatchSentTime = Date.now();
        }
    };

    if (activeBrowser) await closeActiveBrowser();

    try {
        const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];

        activeBrowser = await puppeteer.launch({
            headless: true,
            userDataDir: USERDATADIR,
            args: launchArgs
        });

        const page = await activeBrowser.newPage();
        const url = config.baseUrl(query);
       
        console.log(`${logPrefix} Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        let noNewItemsCount = 0;
       
        while (totalCount < limit) {
            if (!activeBrowser) break;

            try {
                await page.waitForSelector(config.selector, { timeout: 5000 });
            } catch(e) {
                console.log(`${logPrefix} Waiting for content...`);
            }

            const elements = await page.$$(config.selector);
           
            for (const el of elements) {
                if (totalCount >= limit) break;

                try {
                    const extracted = await config.extract(el, page);
                    if (!extracted.content && !extracted.url) continue;

                    let platformId = '';
                    if (extracted.url) {
                        platformId = extracted.url.split('/').pop();
                    } else {
                        platformId = crypto.createHash('md5').update(extracted.content + extracted.timestamp).digest('hex');
                    }

                    const filename = `${platform}_${platformId}.png`;
                    const filepath = path.join(EVIDENCE_DIR, filename);
                    let screenshotPath = null;
                    let fileHash = null;

                    if (!fs.existsSync(filepath)) {
                        await el.screenshot({ path: filepath });
                        screenshotPath = `/evidence/${filename}`;
                        fileHash = await calculateFileHash(filepath);
                    }

                    const postData = {
                        twitterPostId: platformId,
                        platform: platform,    
                        sourceUrl: extracted.url,
                        author: extracted.author,
                        content: extracted.content,
                        timestamp: new Date(extracted.timestamp || Date.now()),
                        source: sourceTag,
                        severity: 'New',
                        screenshotPath: screenshotPath,
                        evidenceHash: fileHash
                    };

                    const result = await postsCollection.updateOne(
                        { twitterPostId: postData.twitterPostId },
                        { $setOnInsert: postData },
                        { upsert: true }
                    );

                    if (result.upsertedId) {
                        currentBatch.push({ ...postData, _id: result.upsertedId });
                        totalCount++;
                        noNewItemsCount = 0;
                    }

                    if (currentBatch.length >= BATCH_SIZE) await flushBatch("Batch Full");

                } catch (e) { console.error("Item parse error", e.message); }
            }

            const previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await new Promise(r => setTimeout(r, 2000));
            const newHeight = await page.evaluate('document.body.scrollHeight');
           
            if (newHeight === previousHeight) {
                noNewItemsCount++;
                if (noNewItemsCount > 3) break;
            }

            if (Date.now() - lastBatchSentTime > BATCH_TIMEOUT) await flushBatch("Timeout");
        }

        await flushBatch("Job Complete");
        return totalCount;

    } catch (e) {
        console.error(`${logPrefix} Crash:`, e);
        await flushBatch("Crash Recovery");
        return totalCount;
    } finally {
        await closeActiveBrowser();
    }
}
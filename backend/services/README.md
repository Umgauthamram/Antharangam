<!-- Harvester.js  -->

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { posts as postsCollection } from './db.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

puppeteer.use(StealthPlugin());

const BATCH_SIZE = 20;          
const BATCH_TIMEOUT = 3 * 60 * 1000; 
const JOB_TIMEOUT = 10 * 60 * 1000;

const USERDATADIR = path.join(process.cwd(), 'chromium_user_data');
const EVIDENCE_DIR = path.join(process.cwd(), 'public', 'evidence');

if (!fs.existsSync(USERDATADIR)) {
    try { fs.mkdirSync(USERDATADIR, { recursive: true }); console.log(`[Harvester] Created User Data Dir at: ${USERDATADIR}`); } catch (e) { console.error(e); }
}
if (!fs.existsSync(EVIDENCE_DIR)) {
    try { fs.mkdirSync(EVIDENCE_DIR, { recursive: true }); console.log(`[Harvester] Created Evidence Dir at: ${EVIDENCE_DIR}`); } catch (e) { console.error(e); }
}

const formatDate = (date) => new Date(date).toISOString().split('T')[0];
let activeBrowser = null;

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
        console.log('[Harvester]  Force-closing active browser...');
        try { await activeBrowser.close(); } catch (e) {}
        activeBrowser = null;
    }
};

export async function runTwitterScrapeJob(query, limit = 50, startDate, endDate, sourceTag, onBatchFound) {
    let finalQuery = query;
    if (startDate) finalQuery += ` since:${formatDate(startDate)}`;
    if (endDate) finalQuery += ` until:${formatDate(endDate)}`;

    const logPrefix = `Harvester[${sourceTag || 'DEFAULT'}]`;
    console.log(`${logPrefix} Starting job QUERY="${finalQuery}", LIMIT=${limit}`);

    let currentBatch = []; 
    let totalCount = 0;
    
    const jobStartTime = Date.now();
    let lastBatchSentTime = Date.now();

    const flushBatch = async (reason) => {
        if (currentBatch.length > 0) {
            console.log(`${logPrefix} Sending batch of ${currentBatch.length} (${reason})...`);
            if (onBatchFound) await onBatchFound(currentBatch);
            currentBatch = []; 
            lastBatchSentTime = Date.now(); 
        }
    };
    
    if (activeBrowser) await closeActiveBrowser();

    try {
        activeBrowser = await puppeteer.launch({
            headless: true,
            executablePath: executablePath(),
            userDataDir: USERDATADIR,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu']
        });

        const page = await activeBrowser.newPage();
        
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['font', 'stylesheet'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        const url = `https://x.com/search?q=${encodeURIComponent(finalQuery)}&f=live`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        try { await page.waitForSelector('[data-testid="tweet"]', { timeout: 30000 }); } catch (e) {}

        const tweetIds = new Set();

        while (totalCount < limit) {
            if (Date.now() - jobStartTime > JOB_TIMEOUT) {
                console.log(`${logPrefix} Job timed out (10 mins limit reached). Stopping.`);
                break;
            }

            if (!activeBrowser || !activeBrowser.isConnected()) break;

            const articles = await page.$$('[data-testid="tweet"]');
            
            if (articles.length === 0 && currentBatch.length > 0) {
                await flushBatch("Page Empty");
                break;
            } else if (articles.length === 0) {
                break;
            }

            for (const tweet of articles) {
                if (totalCount >= limit) break;

                try {

                    const timeElement = await tweet.$('a[href*="/status/"]');
                    if (!timeElement) continue;
                    const postUrl = await page.evaluate(el => el.href, timeElement);
                    const postId = postUrl.split('/').pop();

                    if (tweetIds.has(postId)) continue;
                    tweetIds.add(postId);

                    const userElement = await tweet.$('div[data-testid="User-Name"] span');
                    const username = userElement ? await page.evaluate(el => el.innerText, userElement) : 'Unknown';
                    const contentElement = await tweet.$('div[data-testid="tweetText"]');
                    const content = contentElement ? await page.evaluate(el => el.innerText, contentElement) : '';
                    const timeTag = await timeElement.$('time');
                    const timestampStr = timeTag ? await page.evaluate(el => el.getAttribute('datetime'), timeTag) : new Date().toISOString();

                    const filename = `evidence_${postId}.png`;
                    const filepath = path.join(EVIDENCE_DIR, filename);
                    let screenshotPath = null;
                    let fileHash = null;

                    try {
                        await tweet.screenshot({ path: filepath });
                        screenshotPath = `/evidence/${filename}`;
                        fileHash = await calculateFileHash(filepath);
                        console.log(`${logPrefix}  Saved ${postId}`);
                    } catch (ssError) {}

                    const postData = {
                        twitterPostId: String(postId),
                        url: postUrl,
                        username: username.replace(/@/g, ''),
                        content: content,
                        platform: 'X',
                        timestamp: new Date(timestampStr),
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

                    let finalPost = { ...postData };
                    if (result.upsertedId) finalPost._id = result.upsertedId;
                    else {
                        const existing = await postsCollection.findOne({ twitterPostId: postData.twitterPostId });
                        finalPost._id = existing._id;
                    }
                    
                    currentBatch.push(finalPost);
                    totalCount++;

                    if (currentBatch.length >= BATCH_SIZE) {
                        await flushBatch("Batch Full");
                    }

                } catch (e) {}
            }

            if (Date.now() - lastBatchSentTime > BATCH_TIMEOUT) {
                await flushBatch("Time Limit Reached");
            }

            if (activeBrowser && activeBrowser.isConnected()) {
                await page.evaluate(() => window.scrollBy(0, 1500));
                await new Promise(r => setTimeout(r, 3000));
            }
        }

        await flushBatch("Job Complete");

        return totalCount;

    } catch (e) {
        console.log(`${logPrefix} ⚠️ Error: ${e.message}`);
        await flushBatch("Error Recovery");
        return totalCount;
    } finally {
        if (activeBrowser) {
            await activeBrowser.close();
            activeBrowser = null;
        }
    }
}






<!-- harvesterManager.js -->


import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { posts as postsCollection } from './db.js';
import path from 'path';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const USER_DATA_DIR = path.join(process.cwd(), 'chromium_user_data');


const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};


export async function runTwitterScrapeJob(query, limit = 50, startDate, endDate, sourceTag) {

  let finalQuery = query;
  if (startDate) {
    finalQuery += ` since:${formatDate(startDate)}`;
  }
  if (endDate) {
    finalQuery += ` until:${formatDate(endDate)}`;
  }

  const logPrefix = `[Harvester:${sourceTag || 'DEFAULT'}]`;
  console.log(`${logPrefix} Starting new job: QUERY='${finalQuery}', LIMIT=${limit}`);

  const foundPosts = [];
  let browser = null;

  if (!fs.existsSync(USER_DATA_DIR)) {
    console.log(`[Harvester] CRITICAL ERROR: '${USER_DATA_DIR}' not found.`);
    console.log("[Harvester] Please run 'npm run create-session' first.");
    return [];
  }

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      userDataDir: USER_DATA_DIR,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
    });

    const page = await browser.newPage();

    const url = `https://x.com/search?q=${encodeURIComponent(finalQuery)}&f=live`;
    console.log(`[Harvester] Navigating as logged-in user to: ${url}`);
    await page.goto(url);

    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 30000 });
    console.log("[Harvester] Page loaded. Starting scroll...");

    let count = 0;
    const tweetIds = new Set();

    while (count < limit) {
      const articles = await page.$$('article[data-testid="tweet"]');

      if (articles.length === 0) {
        console.log("[Harvester] No tweets found on page.");
        break;
      }

      for (const tweet of articles) {
        if (count >= limit) break;
        try {
          const userElement = await tweet.$('div[data-testid="User-Name"] span');
          const timeElement = await tweet.$('a[href*="/status/"]');

          if (!userElement || !timeElement) continue;

          const username = await page.evaluate(el => el.innerText, userElement);
          const postUrl = await page.evaluate(el => el.href, timeElement);
          const postId = postUrl.split('/').pop();

          if (tweetIds.has(postId)) continue;
          tweetIds.add(postId);

          const contentElement = await tweet.$('div[data-testid="tweetText"]');
          const content = contentElement ? await page.evaluate(el => el.innerText, contentElement) : "";

          const timeTag = await timeElement.$('time');
          const timestampStr = timeTag ? await page.evaluate(el => el.getAttribute('datetime'), timeTag) : new Date().toISOString();
          const timestamp = new Date(timestampStr);

          const postData = {
            id: postId,
            url: postUrl,
            username: username.replace('@', ''),
            content: content,
            platform: "X",
            timestamp: timestamp,
            source: sourceTag || `strike-twitter-${query.split(' ')[0]}`,
            severity: "New"
          };

          await postsCollection.updateOne(
            { id: postData.id },
            { $setOnInsert: postData },
            { upsert: true }
          );

          foundPosts.push(postData);
          count++;

        } catch (e) {
          console.log(`[Harvester] Error parsing a tweet: ${e.message}`);
        }
      }
      await page.evaluate('window.scrollBy(0, 2000)');
      await new Promise(r => setTimeout(r, 1000));
    }

    await browser.close();
    console.log(`[Harvester] Job finished for: ${query}. Found ${count} posts.`);
    return foundPosts;

  } catch (e) {
    console.log(`[Harvester] Error during scrape for query '${finalQuery}': ${e}`);
    if (browser) await browser.close();
    return [];
  }
}

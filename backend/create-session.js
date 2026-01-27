import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import path from 'path';

puppeteer.use(StealthPlugin());

// 🟢 FORCE SUBFOLDER: We explicitly point to 'twitter_session'
const SESSION_PATH = path.join(process.cwd(), 'chromium_user_data', 'twitter_session');

console.log("=================================================");
console.log(`📂 TARGET PROFILE PATH: ${SESSION_PATH}`);
console.log("=================================================");

(async () => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: false,
      executablePath: executablePath(),
      // 🟢 We use the specific subfolder variable here
      userDataDir: SESSION_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null
    });

    const page = await browser.newPage();

    // Set User Agent to match Harvester
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36");

    await page.goto("https://x.com/login");

    console.log("👉 ACTION REQUIRED: Log in manually.");
    console.log("👉 Do NOT close the browser until you see the Home Feed.");

    await new Promise(resolve => browser.on('disconnected', resolve));
    console.log("  Session creation complete.");

  } catch (e) {
    console.log(`    An error occurred: ${e}`);
    if (browser) await browser.close();
  }
})();
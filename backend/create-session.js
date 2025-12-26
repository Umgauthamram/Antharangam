import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import path from 'path';

// Apply stealth plugin
puppeteer.use(StealthPlugin());

const USER_DATA_DIR = path.join(process.cwd(), 'chromium_user_data');

console.log(`Starting browser using persistent profile at: ${USER_DATA_DIR}`);
console.log("!!! IMPORTANT !!!");
console.log("1. A new Chromium window will open.");
console.log("2. Log in to X.com (Twitter) as normal.");
console.log("3. **After you are logged in**, close the browser window.");
console.log("Your session will be saved automatically.\n");

(async () => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: false,
      executablePath: executablePath(),
      userDataDir: USER_DATA_DIR, // This is the correct way to persist a session
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
    });
    // --- END OF FIX ---

    const page = await browser.newPage();
    await page.goto("https://x.com/login");

    console.log("Please log in now. Close the browser when done.");
    
    // Wait for the browser to be closed by the user
    await browser.waitForTarget(target => target.url() === 'about:blank');
    
    // The session is saved automatically by userDataDir
    // console.log(f"\nSession saved to '{USER_DATA_DIR}'");
    console.log("Session creation complete.");

  } catch (e) {
    console.log("\n--- SCRIPT FAILED ---");
    console.log(`An error occurred: ${e}`);
    if (browser) {
      await browser.close();
    }
  }
})();
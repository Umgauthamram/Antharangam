# from playwright.sync_api import sync_playwright
# from playwright_stealth import Stealth  

# import os
# from pathlib import Path

# USER_DATA_DIR = "./chromium_user_data"

# print(f"Starting browser using persistent profile at: {USER_DATA_DIR}")
# print("!!! IMPORTANT !!!")
# print("1. A new Chromium window will open.")
# print("2. Log in to X.com (Twitter) as normal.")
# print("3. **After you are logged in**, close the browser window.")
# print("Your session will be saved automatically.\n")

# try:
#     stealth = Stealth()  # Initialize Stealth (customize if needed, e.g., Stealth(navigator_languages_override=False))

#     with sync_playwright() as p:
#         # Launch persistent context
#         context = p.chromium.launch_persistent_context(
#             USER_DATA_DIR,
#             headless=False,
#             user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
#         )

#         # Apply stealth to the context (affects all pages)
#         stealth.apply_stealth_sync(context)

#         page = context.new_page()
#         page.goto("https://x.com/login")

#         print("Please log in now. Close the browser when done.")
#         page.on("close", lambda: print("Browser closed. Session saved."))
#         page.wait_for_event("close")

#         context.close()

#     print(f"\nSession saved to '{USER_DATA_DIR}'")
#     print("Session creation complete.")

# except Exception as e:
#     print("\n--- SCRIPT FAILED ---")
#     print(f"An error occurred: {e}")

from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth  # Correct v2.0 import
import time
import random

USER_DATA_DIR = "./chromium_user_data"

print(f"Starting browser using persistent profile at: {USER_DATA_DIR}")
print("!!! IMPORTANT !!!")
print("1. A new Chromium window will open.")
print("2. It will 'warm up' by visiting Google/Wikipedia...")
print("3. It will then go to the X.com login page.")
print("4. Log in as normal, then close the browser window.")
print("Your session will be saved automatically.\n")

try:
    stealth = Stealth() # Initialize Stealth

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
        )

        page = context.new_page()
        
        # Apply stealth to the page
        stealth.apply_stealth_sync(context)
        
        # --- NEW WARM-UP SCRIPT ---
        print("[Warm-Up] Navigating to Google...")
        page.goto("https://www.google.com")
        time.sleep(random.randint(2, 4))
        
        print("[Warm-Up] Navigating to Wikipedia...")
        page.goto("https://www.wikipedia.org")
        time.sleep(random.randint(1, 3))
        # --- END OF WARM-UP ---
        
        print("[Warm-Up] Complete. Navigating to login page...")
        page.goto("https://x.com/login")

        print("Please log in now. Close the browser when done.")
        page.on("close", lambda: print("Browser closed. Session saved."))
        page.wait_for_event("close")

        context.close()

    print(f"\nSession saved to '{USER_DATA_DIR}'")
    print("Session creation complete.")

except Exception as e:
    print("\n--- SCRIPT FAILED ---")
    print(f"An error occurred: {e}")
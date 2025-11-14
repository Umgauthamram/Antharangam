
# from playwright.sync_api import sync_playwright
# from playwright_stealth import stealth_sync

# import threading
# from app.services.db_service import db
# from datetime import datetime
# import time
# import os

# USER_DATA_DIR = "./chromium_user_data"

# def run_twitter_scrape_job(query, limit=50):
#     """
#     Runs the Playwright job AND RETURNS the found posts.
#     """
#     print(f"[Harvester] Starting new job: QUERY='{query}', LIMIT={limit}")
#     found_posts = []
   
#     if not os.path.exists(USER_DATA_DIR):
#         print(f"[Harvester] CRITICAL ERROR: '{USER_DATA_DIR}' not found.")
#         print("[Harvester] Please run 'python create_session.py' first.")
#         return []

#     # Updated: Wrap sync_playwright with Stealth().use()
#     with Stealth().use(sync_playwright()) as p:
#         try:
#             context = p.chromium.launch_persistent_context(
#                 USER_DATA_DIR,
#                 headless=True,
#                 user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
#             )
           
#             page = context.new_page()
           
#             # Removed: stealth_sync(page) - no longer needed, as Stealth applies globally
            
#             url = f"https://x.com/search?q={query}&f=live"
#             print(f"[Harvester] Navigating as logged-in user to: {url}")
#             page.goto(url)
           
#             page.wait_for_selector('article[data-testid="tweet"]', timeout=30000)
#             print("[Harvester] Page loaded. Starting scroll...")

#             count = 0
#             tweet_ids = set()

#             while count < limit:
#                 tweets = page.query_selector_all('article[data-testid="tweet"]')
               
#                 if not tweets:
#                     print("[Harvester] No tweets found on page.")
#                     break

#                 for tweet in tweets:
#                     if count >= limit:
#                         break
#                     try:
#                         user_element = tweet.query_selector('div[data-testid="User-Name"] span')
#                         time_element = tweet.query_selector('a[href*="/status/"]')
                       
#                         if not user_element or not time_element:
#                             continue

#                         username = user_element.inner_text().replace('@', '')
#                         post_url = f"https://x.com{time_element.get_attribute('href')}"
#                         post_id = post_url.split('/')[-1]

#                         if post_id in tweet_ids:
#                             continue
#                         tweet_ids.add(post_id)

#                         content_element = tweet.query_selector('div[data-testid="tweetText"]')
#                         content = content_element.inner_text() if content_element else ""

#                         timestamp_str = time_element.query_selector('time').get_attribute('datetime')
#                         timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

#                         post_data = {
#                             "id": post_id,
#                             "url": post_url,
#                             "username": username,
#                             "content": content,
#                             "platform": "X",
#                             "timestamp": timestamp,
#                             "source": f"strike-twitter-{query}",
#                             "severity": "New"
#                         }
                       
#                         db.posts.update_one(
#                             {"id": post_data['id']},
#                             {"$setOnInsert": post_data},
#                             upsert=True
#                         )
#                         found_posts.append(post_data)
#                         count += 1

#                     except Exception as e:
#                         print(f"[Harvester] Error parsing a tweet: {e}")
               
#                 page.evaluate('window.scrollBy(0, 2000)')
#                 time.sleep(1)

#             context.close()
#             print(f"[Harvester] Job finished for: {query}. Found {count} posts.")
#             return found_posts
           
#         except Exception as e:
#             print(f"[Harvester] Error during scrape for query '{query}': {e}")
#             if 'context' in locals():
#                 context.close()
#             return []

# # (This function is no longer used by the "strike" route, but we leave it)
# def start_twitter_scrape_job(query, limit=50):
#     thread = threading.Thread(
#         target=run_twitter_scrape_job,
#         args=(query, limit)
#     )
#     thread.daemon = True
#     thread.start()
#     return {"status": "success", "message": f"Twitter scrape job started for: {query}"}


import asyncio
import nest_asyncio
from twscrape.api import TwscrapeApi  # <-- THIS IS THE CORRECT IMPORT
from app.services.db_service import db
from datetime import datetime
import os

# Apply nest_asyncio to allow asyncio to run within Flask
nest_asyncio.apply()

# --- This is the new async scraping function ---
async def async_scrape_job(query, limit=50):
    """
    Runs the twscrape job and returns the found posts.
    """
    print(f"[Harvester] Starting new job: QUERY='{query}', LIMIT={limit}")
    found_posts = []
    
    # This will create/use 'twscrape.db' to load accounts
    api = TwscrapeApi() 
    
    try:
        accounts = await api.accounts_summary()
        if not accounts:
            print("[Harvester] CRITICAL ERROR: No Twitter accounts found.")
            print("[Harvester] Please run 'python add_account.py' first.")
            return []

        print(f"[Harvester] Using {len(accounts)} accounts for scraping.")
        
        count = 0
        # 1. Search for tweets
        async for tweet in api.search(query, limit=limit):
            count += 1
            
            # 2. Format the data (same as before)
            post_data = {
                "id": tweet.id,
                "url": tweet.url,
                "username": tweet.user.username,
                "content": tweet.rawContent,
                "platform": "X",
                "timestamp": tweet.date, # twscrape provides a datetime object
                "source": f"strike-twitter-{query}",
                "severity": "New" 
            }
            
            # 3. Save to DB
            db.posts.update_one(
                {"id": post_data['id']}, 
                {"$setOnInsert": post_data}, 
                upsert=True
            )
            found_posts.append(post_data)
        
        print(f"[Harvester] Job finished for: {query}. Found {count} posts.")
        return found_posts
        
    except Exception as e:
        print(f"[Harvester] Error during scrape for query '{query}': {e}")
        return []
    finally:
        # Close the connection
        await api.close()


# --- This is our synchronous "wrapper" for Flask ---
def run_twitter_scrape_job(query, limit=50):
    """
    Runs the (async) twscrape job from our (sync) Flask route.
    """
    # This is the correct way to call an async function from a sync one
    return asyncio.run(async_scrape_job(query, limit))
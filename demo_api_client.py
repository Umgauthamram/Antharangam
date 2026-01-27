import requests
import json

# CONFIGURATION
BASE_URL = "http://localhost:5001/api"
# REPLACE WITH YOUR ACTUAL KEY
API_KEY = "sk_live_REPLACE_WITH_YOUR_KEY_HERE"

def get_intel_feed(platform=None):
    """
    Fetches the intelligence feed.
    """
    url = f"{BASE_URL}/intel/feed"
    headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    params = {}
    if platform:
        params['platform'] = platform

    try:
        print(f"[*] Fetching feed from {url}...")
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print(f"[+] Success! Got {len(data)} items.")
            # Print first item as sample
            if data:
                print(json.dumps(data[0], indent=2))
        else:
            print(f"[-] Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"[-] Exception: {e}")

def create_key_example():
    """
    Example of programmatically creating a new key (requires admin/master key usually, 
    but for this demo we assume the endpoint might be open or this is a dev script).
    Note: The /api/keys endpoint typically requires User Auth (JWT) not just an API key,
    so this function is just to show the structure.
    """
    print("\n[*] Note: Creation endpoint typically requires User Session (JWT), not just API Key.")
    
if __name__ == "__main__":
    print("=== Antharangam API Demo ===")
    
    # 1. Test All Platforms
    print("\n--- Testing General Feed ---")
    get_intel_feed()
    
    # 2. Test Specific Platform (e.g. GitHub)
    # If your key is scoped to GitHub only, this should work.
    # If you try 'twitter' with a GitHub-only key, this might return empty or error depending on backend logic.
    print("\n--- Testing GitHub Feed ---")
    get_intel_feed(platform="github")
    
    # 3. Test Blocked Platform (Example)
    print("\n--- Testing Twitter Feed ---")
    get_intel_feed(platform="twitter")

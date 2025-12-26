import os
import json
from redis import Redis
from dotenv import load_dotenv

load_dotenv()

# Configuration
ENRICHMENT_QUEUE_NAME = 'forensic-enrichment-jobs'
REDIS_HOST = os.getenv('REDISHOST', '127.0.0.1')
REDIS_PORT = os.getenv('REDISPORT', 6379)

def check_queue():
    try:
        r = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()
        print(f"✅ Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
        
        # 1. Get Queue Length
        queue_len = r.llen(ENRICHMENT_QUEUE_NAME)
        print(f"📊 Current Queue Length: {queue_len} items")

        if queue_len == 0:
            print("✨ The queue is empty.")
            return

        # 2. Peek at the first 5 items
        print("\n👀 Peeking at top 5 items (Oldest first):")
        # Redis List is typically processed Left to Right or Right to Left depending on implementation.
        # Your worker uses 'blpop' (Left Pop), so we look at the Left (0).
        items = r.lrange(ENRICHMENT_QUEUE_NAME, 0, 4) 
        
        for i, item in enumerate(items):
            try:
                payload = json.loads(item)
                print(f"   {i+1}. ID: {payload.get('id')} | Content Snippet: {payload.get('content', '')[:30]}...")
            except:
                print(f"   {i+1}. [Invalid JSON]: {item}")

    except Exception as e:
        print(f"❌ Error connecting to Redis: {e}")

if __name__ == "__main__":
    check_queue()
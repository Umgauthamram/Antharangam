
import os
from redis import Redis
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.getenv('REDISHOST', '127.0.0.1')
REDIS_PORT = os.getenv('REDISPORT', 6379)

try:
    r = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    r.flushall()
    print("  Redis Queue FLUSHED. All ghost jobs removed.")
except Exception as e:
    print(f"    Failed to flush Redis: {e}")
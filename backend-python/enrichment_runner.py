import os
import json
import time
from redis import Redis, exceptions as redis_exceptions
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

ENRICHMENT_QUEUE_NAME = 'forensic-enrichment-jobs'
REDIS_HOST = os.getenv('REDISHOST', '127.0.0.1')
REDIS_PORT = os.getenv('REDISPORT', 6379)
MONGOURI =  os.getenv('MONGO_URI', 'mongodb+srv://gauthamramum_db_user:1234@cluster0.vgrmif5.mongodb.net/?appName=Cluster0') 
DBNAME = os.getenv('DBNAME', 'gauthamramum_db_user')

try:
    mongoclient = MongoClient(MONGOURI)
    db = mongoclient[DBNAME]
    global postscollection
    postscollection = db.posts
    print(f"Worker Database connection established to {DBNAME}")
except Exception as e:
    print(f"Worker ERROR Failed to connect to MongoDB: {e}")
    exit(1)

try:
    redisconn = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redisconn.ping()
    print(f"RQ Runner Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except redis_exceptions.ConnectionError as e:
    print(f"RQ Runner ERROR Failed to connect to Redis: {e}")
    exit(1)

def process_post_for_enrichment(jobpayload):
    global postscollection
    postidstr = jobpayload.get('id')  # Twitter post ID as string
    
    if not postidstr:
        print("Task ERROR Job skipped - no Post ID.")
        return False
    
    # ✅ FIXED: NO ObjectId conversion
    print(f"Task Starting enrichment for Post ID {postidstr}")
    
    enricheddata = {
        "risksource": "RuleEngineV1 RQ-Manual",
        "nerentities": f"TESTENTITYFROM{postidstr}",
        "sha256hash": "placeholderforensichash123",
        "isEnriched": True,
        "processingtimestamp": time.time()
    }
    
    # 🔧 CHANGE: Update using twitterPostId string field
    result = postscollection.update_one(
        {"twitterPostId": postidstr},
        {"$set": {"enrichedData": enricheddata}}
    )
    
    print(f"Task Successfully updated post {postidstr}")
    return True

if __name__ == "__main__":
    print(f"RQ Runner Worker listening on Redis list key {ENRICHMENT_QUEUE_NAME}")
    while True:
        jobresult = redisconn.blpop(ENRICHMENT_QUEUE_NAME, timeout=0)
        if jobresult:
            serializedpayload = jobresult[1]
            try:
                jobpayload = json.loads(serializedpayload)
                process_post_for_enrichment(jobpayload)
            except json.JSONDecodeError:
                print(f"RQ Runner ERROR Failed to deserialize JSON payload: {serializedpayload}")
            except Exception as e:
                print(f"RQ Runner CRITICAL PROCESSING ERROR: {e}")

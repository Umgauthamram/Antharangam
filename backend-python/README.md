these codes are phase 1 21/12/25

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
MONGOURI = os.getenv('MONGO_URI', 'mongodb+srv://gauthamramum_db_user:1234@cluster0.vgrmif5.mongodb.net/?appName=Cluster0')
DBNAME = os.getenv('DBNAME', 'gauthamramum_db_user')

try:
    mongoclient = MongoClient(MONGOURI)
    db = mongoclient[DBNAME]
    global postscollection
    postscollection = db.posts
    print(f"✅ Worker Database connection established to {DBNAME}")
except Exception as e:
    print(f"❌ Worker ERROR Failed to connect to MongoDB: {e}")
    exit(1)

try:
    redisconn = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redisconn.ping()
    print(f"✅ RQ Worker Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except redis_exceptions.ConnectionError as e:
    print(f"❌ RQ Worker ERROR Failed to connect to Redis: {e}")
    exit(1)

def process_enrichment_job(jobpayload):
    """Process single enrichment job from Redis queue."""
    global postscollection
    postid = jobpayload.get('id') 
    rawtext = jobpayload.get('content')
    
    print(f"🔄 Task Starting enrichment for Post ID {postid}")
    
    if not postid:
        print("❌ Task ERROR Job skipped - no Post ID.")
        return False
    
    enricheddata = {
        "risksource": "RuleEngineV1 RQ-Worker",
        "nerentities": f"TESTENTITYFROM{postid}",
        "sha256hash": "placeholderforensichash123",
        "isEnriched": True,
        "processingtimestamp": time.time()
    }
    
    result = postscollection.update_one(
        {"twitterPostId": postid},
        {"$set": {"enrichmentData": enricheddata}}
    )
    
    if result.matched_count > 0:
        print(f"✅ Task Successfully updated post {postid}")
        return True
    else:
        print(f"⚠️  Task No post found with twitterPostId {postid}")
        return False

if __name__ == "__main__":
    print(f"🚀 RQ Worker listening on Redis list key '{ENRICHMENT_QUEUE_NAME}'")
    print("⏳ Waiting for jobs... (Ctrl+C to stop)")
    
    while True:
        try:
            jobresult = redisconn.blpop(ENRICHMENT_QUEUE_NAME, timeout=5)
            if jobresult:
                serializedpayload = jobresult[1]
                try:
                    jobpayload = json.loads(serializedpayload)
                    success = process_enrichment_job(jobpayload)
                except json.JSONDecodeError:
                    print(f"❌ RQ Worker ERROR Failed to deserialize JSON payload: {serializedpayload[:100]}...")
                except Exception as e:
                    print(f"💥 RQ Worker CRITICAL PROCESSING ERROR: {e}")
            else:
                print(".", end="", flush=True)  # heartbeat
        except KeyboardInterrupt:
            print("\n👋 RQ Worker shutting down gracefully...")
            break
        except Exception as e:
            print(f"⚠️  RQ Worker loop error: {e}")
            time.sleep(1)
    
    redisconn.close()


<!-- enrichment_worker -->

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

<!-- enrichment_runner -->

# core logic for processing a single post.

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson.objectid import ObjectId

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI','mongodb+srv://gauthamramum_db_user:1234@cluster0.vgrmif5.mongodb.net/?appName=Cluster0')
DB_NAME = os.getenv('DB_NAME', 'gauthamramum_db_user')

try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    posts_collection = db['posts']
    print(f"[Worker] Database connection established to: {DB_NAME}")
except Exception as e:
    print(f"[Worker] ERROR: Failed to connect to MongoDB: {e}")
  
def process_post_for_enrichment(job_data): 
    """
    Executes the forensic enrichment tasks for a single post.
    This function is called directly by the BullMQ Python Worker.
    """
    post_id_str = job_data.get('id') 
    raw_text = job_data.get('content') 

    if not post_id_str:
        print("[Task] ERROR: Job skipped due to missing Post ID.")
        return False
    
    try:

        post_obj_id = ObjectId(post_id_str) 
    except Exception:
        print(f"[Task] ERROR: Invalid MongoDB ID format: {post_id_str}")
        raise ValueError(f"Invalid Post ID: {post_id_str}") 

    print(f"[Task] Starting enrichment for Post ID: {post_id_str}")

    enriched_data = {
        "risk_source": "RuleEngine_V1 (BullMQ)",
        "ner_entities": [f"TEST_ENTITY_FROM_{post_id_str}"],
        "sha256_hash": "placeholder_forensic_hash_123", 
        "is_enriched": True,
        "processing_timestamp": True
    }
    
    posts_collection.update_one(
        { "_id": post_obj_id },
        { "$set": enriched_data }
    )
    
    print(f"[Task] Successfully updated post: {post_id_str}")
    return True

    # --- PLACEHOLDER FOR FORENSIC TASKS ---
    # In future steps, we will replace this with:
    # 1. NER (spaCy) on raw_text
    # 2. OCR (Tesseract) on local media path
    # 3. Hashing (SHA-256 and pHash) on local media path
    
   
<!-- enrichment_tasks -->
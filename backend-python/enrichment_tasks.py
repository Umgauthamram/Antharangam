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
    
   
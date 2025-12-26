import os
import json
import time
import re
import nltk
from textblob import TextBlob
from redis import Redis, exceptions as redis_exceptions
from pymongo import MongoClient
from dotenv import load_dotenv
import pytesseract
from PIL import Image

load_dotenv()

ENRICHMENT_QUEUE_NAME = 'forensic-enrichment-jobs'
REDIS_HOST = os.getenv('REDISHOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDISPORT', 6379))
MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://gauthamramum_db_user:1234@cluster0.vgrmif5.mongodb.net/?appName=Cluster0')
DB_NAME = 'gauthamramum_db_user'

pytesseract.pytesseract.tesseract_cmd = r'G:\antharangam_files\tesseract.exe'


print(" Loading AI Models NLTK")
try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('averaged_perceptron_tagger_eng', quiet=True) 
    nltk.download('maxent_ne_chunker', quiet=True)
    nltk.download('words', quiet=True)
except Exception as e:
    print(f"NLTK Download Warning: {e}")
print("AI Models Loaded.")

RISK_KEYWORDS = {
    'high': [
        'investment', 'double', 'profit', 'guaranteed', 'risk free', 'dm me', 
        'whatsapp', 'telegram', 'hacked', 'recovery', 'lost funds', 'customer care',
        '100% safe', 'multiply', 'returns','terrorist','Attack','Explosion','Suspect',
        'Subject','Individual','Person of Interest (POI)','Known Associate','High-Risk Individual',
        'Militant','Extremist','Terrorist Organization', 'Criminal Organization', 'Network',
        'Bomb','Improvised Explosive Device (IED)','Explosive Incident','Detonation','Blast Event',
        'Threat Event','Violent Event','scams','crypto scams'
    ],
    'medium': [
        'join', 'channel', 'signal', 'crypto', 'pump', 'giveaway', 'winner', 
        'bank', 'kyc', 'update', 'urgent', 'limited time'
    ]
}

PHONE_REGEX = re.compile(r'(?:\+91[\-\s]?)?[6789]\d{9}')
UPI_REGEX = re.compile(r'[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{2,}')

try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    posts_collection = db.posts
    print(f"DB connected: {DB_NAME}")
except Exception as e:
    print(f" DB error: {e}")
    exit(1)

try:
    redis_conn = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redis_conn.ping()
    print(f"Redis Connected: {REDIS_HOST}:{REDIS_PORT}")
except redis_exceptions.ConnectionError as e:
    print(f"Redis Error: {e}")
    exit(1)

def perform_ocr(screenshot_relative_path):
    """Reads text from the image file on disk."""
    if not screenshot_relative_path:
        return ""
    
    base_dir = os.path.dirname(os.path.abspath(__file__)) 
    project_root = os.path.dirname(base_dir)              
    
    clean_rel_path = screenshot_relative_path.lstrip('/\\') 
    image_path = os.path.join(project_root, 'backend', 'public', clean_rel_path)
    
    image_path = os.path.normpath(image_path)

    if not os.path.exists(image_path):
        print(f"⚠️ Image NOT found at: {image_path}")
        return ""

    try:
        img = Image.open(image_path)
        img = img.convert('L') 
        
        text = pytesseract.image_to_string(img)
        clean_text = " ".join(text.split())
        
        if len(clean_text) > 0:
            print(f" OCR Success: Found {len(clean_text)} chars in {screenshot_relative_path}")
        else:
            print(f"OCR ran but found NO text in {screenshot_relative_path}")
            
        return clean_text
    except Exception as e:
        print(f" OCR Crashed: {e}")
        return ""
    
def extract_entities_nltk(text):
    entities = []
    try:
        for sent in nltk.sent_tokenize(text):
            for chunk in nltk.ne_chunk(nltk.pos_tag(nltk.word_tokenize(sent))):
                if hasattr(chunk, 'label') and chunk.label() in ['PERSON', 'ORGANIZATION', 'GPE']:
                    entities.append(' '.join(c[0] for c in chunk))
    except: pass
    return list(set(entities))

def analyze_risk(text):
    if not text: return "Low", 0, [], [], []
    text_lower = text.lower()
    score = 0
    flags = []

    for word in RISK_KEYWORDS['high']:
        if word in text_lower:
            score += 25
            flags.append(f"Keyword: {word}")
    for word in RISK_KEYWORDS['medium']:
        if word in text_lower:
            score += 10
            flags.append(f"Keyword: {word}")

    phones = PHONE_REGEX.findall(text)
    if phones:
        score += 40
        flags.append(f"Phone Detected: {phones[0]}")

    upis = UPI_REGEX.findall(text)
    if upis:
        score += 50
        flags.append(f"UPI Detected: {upis[0]}")

    final_score = min(score, 100)
    
    if final_score >= 75: risk_label = "High"
    elif final_score >= 30: risk_label = "Medium"
    else: risk_label = "Low"

    return risk_label, final_score, list(set(flags)), list(set(phones)), list(set(upis))

def process_enrichment_job(job_payload):
    post_id = job_payload.get('id')
    raw_text = job_payload.get('content') or ""

    post_doc = posts_collection.find_one({"twitterPostId": post_id})
    screenshot_path = post_doc.get('screenshotPath') if post_doc else None

    ocr_text = perform_ocr(screenshot_path)
    
    full_analysis_text = f"{raw_text} . {ocr_text}"

    print(f"🔄 Processing Post ID {post_id}...")
    
    try:
        blob = TextBlob(raw_text)
        pol = blob.sentiment.polarity
        if pol < -0.1: sentiment_label = "Negative"
        elif pol > 0.1: sentiment_label = "Positive"
        else: sentiment_label = "Neutral"
    except:
        sentiment_label = "Neutral"

    entities = extract_entities_nltk(full_analysis_text)

    risk_label, risk_score, risk_flags, phones, upis = analyze_risk(full_analysis_text)

    if ocr_text:
        risk_flags.append("Source: OCR Extracted")

    enriched_data = {
        "risk_source": "RuleEngine v3 (OCR+NLTK)",
        "ner_entities": entities,
        "extracted_phones": phones,
        "extracted_upis": upis,
        "risk_flags": risk_flags,
        "risk_score": risk_score,
        "ocr_text": ocr_text[:200] + "..." if ocr_text else None, 
        "isEnriched": True,
        "processing_timestamp": time.time()
    }

    result = posts_collection.update_one(
        {"twitterPostId": post_id},
        {
            "$set": {
                "enrichmentData": enriched_data,
                "risk": risk_label,
                "sentiment": sentiment_label
            }
        }
    )
    
    if result.matched_count > 0:
        print(f"Success: Post {post_id} | Risk: {risk_label} | OCR Found: {len(ocr_text) > 0}")
        return True
    else:
        print(f"Warning: Post {post_id} not found in DB.")
        return False

if __name__ == "__main__":
    print(f"RQ Worker (OCR Enabled) listening on '{ENRICHMENT_QUEUE_NAME}'")
    while True:
        try:
            job_result = redis_conn.blpop(ENRICHMENT_QUEUE_NAME, timeout=5)
            if job_result:
                payload_str = job_result[1]
                try:
                    job_payload = json.loads(payload_str)
                    process_enrichment_job(job_payload)
                except json.JSONDecodeError:
                    print("Error: Invalid JSON")
                except Exception as e:
                    print(f"Critical Error: {e}")
        except KeyboardInterrupt:
            print("\n Shutting down worker.")
            break
        except Exception as e:
            print(f" Connection loop error: {e}")
            time.sleep(1)
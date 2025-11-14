from flask import current_app as app, jsonify, request
from app.services.db_service import db
# --- UPDATED IMPORTS ---
from app.services.harvester_service import run_twitter_scrape_job 
from app.utils.parsers import parse_json

@app.route("/")
def hello():
    return jsonify({"status": "Antharangam API is running!"})

@app.route("/api/alerts")
def get_alerts():
    """
    Fetches all recent posts from the database.
    """
    try:
        posts = list(db.posts.find().sort("timestamp", -1).limit(100))
        return jsonify(parse_json(posts))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/strike/twitter", methods=['POST'])
def strike_twitter():
    """
    API endpoint to run a new, ON-DEMAND Twitter scrape.
    This now WAITS for the job to finish and returns the data.
    """
    data = request.get_json()
    if not data or 'keyword' not in data:
        return jsonify({"error": "Missing 'keyword' in request body"}), 400
    
    keyword = data['keyword']
    limit = data.get('limit', 50)
    
    # --- CRITICAL CHANGE ---
    # We now call the synchronous function and wait for it.
    # We no longer use 'start_twitter_scrape_job'
    try:
        scraped_posts = run_twitter_scrape_job(query=keyword, limit=limit)
        
        # Return the actual posts we found
        return jsonify(parse_json(scraped_posts)), 200 # 200 OK
        
    except Exception as e:
        print(f"[API Error] {e}")
        return jsonify({"error": "An error occurred during scraping."}), 500
    

# from flask import current_app as app, jsonify, request
# from app.services.db_service import db
# from app.services.harvester_service import start_twitter_scrape_job
# from app.utils.parsers import parse_json

# @app.route("/")
# def hello():
#     return jsonify({"status": "Antharangam API is running!"})


# @app.route("/api/alerts")
# def get_alerts():
#     """
#     Fetches recent posts from the DB for dashboard.
#     """
#     try:
#         posts = list(db.posts.find().sort("timestamp", -1).limit(100))
#         return jsonify(parse_json(posts))
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# @app.route("/api/strike/twitter", methods=["POST"])
# def strike_twitter():
#     """
#     Starts an on-demand Twitter scrape for a keyword.
#     """
#     data = request.get_json()
#     if not data or "keyword" not in data:
#         return jsonify({"error": "Missing 'keyword' in request body"}), 400

#     keyword = data["keyword"]
#     limit = data.get("limit", 50)

#     result = start_twitter_scrape_job(query=keyword, limit=limit)
#     return jsonify(result), 202

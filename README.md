python enrichment_runner.py
node server.js
npm run dev


redis-server
python enrichment_worker.py  # BullMQ worker
python enrichment_runner.py        # RQ worker  
npm start                   # Node.js backend

python reset_redis.py       #for reseting redis
node db_cleanup.js          #cleaning the databse



4/12/2006 - 7:10

harvester.js
queueService.js 
enrichment_worker.py
enrichment_runner.py
projectcontroller


node create-session.js 


{
  "_id": "ObjectId(...)",
  "platform": "telegram", // or 'twitter', 'darkweb', 'reddit'
  "platformId": "10928374", // The ID on that specific platform
  "sourceUrl": "https://t.me/s/scam_channel/123",
  
  // 🟢 NORMALIZED FIELDS (Python analyzes these)
  "content": "Selling credit card dumps...", // The text body
  "author": "DarkVendor99", // The username/channel name
  "timestamp": "2025-10-24T10:00:00Z", // When it was posted
  
  // 🛡️ EVIDENCE CHAIN
  "screenshotPath": "/evidence/evidence_10928374.png",
  "evidenceHash": "a1b2c3d4...", 
  
  // 🧠 INTELLIGENCE (Added by Python)
  "risk": "High",
  "enrichmentData": {
      "phones": ["+9198..."],
      "upis": ["scam@ybl"]
  }
}
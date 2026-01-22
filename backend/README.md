Antharangam External Developer API
Bring the power of Antharangam's risk analysis to your own applications.

Authentication
All API requests must include your secret API Key in the x-api-key header or as a Bearer token.

Header Example:

x-api-key: sk_live_...
Bearer Token Example:

Authorization: Bearer sk_live_...
Base URL
Your API is hosted at: http://localhost:5001/api/v1

Endpoints
1. Scan Content
Analyze text for risk, sentiment, and entity extraction.

URL: /scan
Method: POST
Body:
{
  "content": "Text to analyze...",
  "platform": "optional_source_name"
}
Success Response (200 OK):

{
  "meta": {
    "scanned_at": "2024-03-20T10:00:00Z",
    "platform": "twitter",
    "api_key_prefix": "sk_live_a1b2..."
  },
  "analysis": {
    "risk": "High",
    "score": 90,
    "sentiment": "Negative",
    "flags": ["Keyword: fraud"],
    "entities": [],
    "financial": {
      "phones": [],
      "upis": []
    }
  }
}
2. Check Key Status
Verify if your key is active and view owner details.

URL: /keys/me
Method: GET
Success Response:

{
  "key_id": "a1b2c3d4",
  "name": "My Prod App",
  "created_at": "..."
}
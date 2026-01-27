Antharangam API Integration Guide
This guide explains how to use your Antharangam API Key to fetch threat intelligence data in your own applications.

Authentication
Authentication is performed via HTTP Headers. You must include your API Key in every request.

Header Name: x-api-key Value: Your unique API key (starting with sk_live_...)

Endpoints
1. Intelligence Feed
URL: http://localhost:5001/api/intel/feed Method: GET

Query Parameters (Optional):

platform: Filter by specific platform (e.g., github, twitter, reddit).
search: Search for specific keywords (e.g., breach, leaked).
risk: Filter by risk level (e.g., Critical, High).
Code Examples
Python (using requests)
import requests
API_KEY = "sk_live_YOUR_KEY_HERE"
URL = "http://localhost:5001/api/intel/feed"
headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}
# Example 1: Fetch all data
response = requests.get(URL, headers=headers)
if response.status_code == 200:
    data = response.json()
    print(f"Received {len(data)} items")
else:
    print(f"Error: {response.text}")
# Example 2: Fetch only GitHub data
params = {"platform": "github"}
response = requests.get(URL, headers=headers, params=params)
print(response.json())
Node.js (using axios)
const axios = require('axios');
const API_KEY = 'sk_live_YOUR_KEY_HERE';
const URL = 'http://localhost:5001/api/intel/feed';
async function fetchIntel() {
    try {
        const config = {
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            params: {
                platform: 'github' // Optional filter
            }
        };
        const response = await axios.get(URL, config);
        console.log(`Received ${response.data.length} items`);
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
    }
}
fetchIntel();
cURL (Command Line)
curl -X GET "http://localhost:5001/api/intel/feed?platform=github" \
     -H "x-api-key: sk_live_YOUR_KEY_HERE" \
     -H "Content-Type: application/json"
Best Practices
Keep Keys Secret: Never expose your API keys in client-side code (browser). Use them only in backend-to-backend communication.
Handle Rate Limits: If you receive a 429 error, you have exceeded your quota.
Secure Storage: Store API keys in environment variables (e.g., 

.env
), not hardcoded in source files.


Postman Configuration
To test in Postman, follow these steps:

1. Configure Authentication (Headers)
For any request, go to the Headers tab and add:

Key: x-api-key
Value: sk_live_YOUR_KEY_HERE
2. Search / Research Request (GET)
To research specific content by keyword (returns relevant posts):

Method: GET
URL: http://localhost:5001/api/intel/feed
Params (Query Params tab):
Key: search, Value: YOUR_KEYWORD
Key: platform, Value: github (Optional)
3. Create Key Request (POST)
If you want to create a new key programmatically:

Method: POST
URL: http://localhost:5001/api/keys
Headers: Add Content-Type: application/json
Body (Select "raw" -> "JSON"):
{
  "name": "New App Key",
  "email": "dev@company.com",
  "quota": 1000,
  "expiresInDays": 30,
  "allowedPlatforms": ["github", "telegram"]
}



4. Trigger Scraper Request (POST)
To start a scraping job from another frontend (e.g. searching for a number online):

Method: POST
URL: http://localhost:5001/api/harvesters/start
Headers: Content-Type: application/json
Body:
{
  "id": "job_123",
  "name": "Investigation A",
  "keywords": ["scams", "account_123"],
  "platform": "twitter"
}
*Note: This starts a background job. Results will appear in the Feed (GET request) as they are found.*

### 5. Stop Scraper Request (POST)
To stop a running job:

- **Method**: `POST`
- **URL**: `http://localhost:5001/api/harvesters/stop`
- **Body**:
```json
{
  "id": "job_123"
}
```

### 6. Retrieve Content (GET)
To get the results of your scraping job, use the **Feed Endpoint** (same as Section 2).

- **Method**: `GET`
- **URL**: `http://localhost:5001/api/intel/feed`
- **Params**:
    - `search`: Use the **same keyword** you used in the job (e.g., "account_123").
    - `platform`: (Optional) "twitter", etc.

### 7. Fetch Data Response Format (JSON)
The response from the GET request above will be a JSON Array:

```json
[
  {
    "id": "6791e8...",
    "platform": "github",
    "author": "user123",
    "content": "Leaked database credentials found in repo...",
    "risk": "High",
    "timestamp": "1/27/2026, 9:45:00 AM",
    "url": "https://github.com/...",
    "isManuallyFlagged": false
  }
]
```
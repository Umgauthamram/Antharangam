const axios = require('axios');

// CONFIGURATION
const BASE_URL = 'http://localhost:5001/api';
// REPLACE WITH YOUR ACTUAL KEY
const API_KEY = 'sk_live_REPLACE_WITH_YOUR_KEY_HERE';

async function getIntelFeed(platform = null) {
    const url = `${BASE_URL}/intel/feed`;

    // Set headers
    const config = {
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
        },
        params: {}
    };

    if (platform) {
        config.params.platform = platform;
    }

    try {
        console.log(`[*] Fetching feed from ${url}...`);
        const response = await axios.get(url, config);

        console.log(`[+] Success! Got ${response.data.length} items.`);
        if (response.data.length > 0) {
            console.log(JSON.stringify(response.data[0], null, 2));
        }
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`[-] Error ${error.response.status}: ${error.response.data.error || 'Unknown error'}`);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('[-] No response received');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('[-] Error:', error.message);
        }
    }
}

async function runDemo() {
    console.log("=== Antharangam API Node.js Demo ===");

    // 1. Test All Platforms
    console.log("\n--- Testing General Feed ---");
    await getIntelFeed();

    // 2. Test Specific Platform (e.g. GitHub)
    console.log("\n--- Testing GitHub Feed ---");
    await getIntelFeed('github');
}

// Run the demo
if (require.main === module) {
    runDemo();
}

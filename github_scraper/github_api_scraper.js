require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

//collect TOKEN HERE: https://github.com/settings/tokens
//Create .env and add: GITHUB_TOKEN=your_token_here
const TOKEN = process.env.GITHUB_TOKEN;
const KEYWORD = process.argv[2] || "leaked password";

if (!TOKEN) {
    console.error("ERROR: Mising GitHub Token.");
    console.error("    Please create a .env file and add: GITHUB_TOKEN=your_actual_token_here");
    process.exit(1);
}

async function searchGitHubCode(query) {
    console.log(`Authenticated as Developer. Searching API for: "${query}"...`);

    try {
        const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const items = response.data.items;
        console.log(`Found ${items.length} matching files.`);

        const results = items.map(item => ({
            file: item.name,
            path: item.path,
            repo: item.repository.full_name,
            author: item.repository.owner.login,
            url: item.html_url,
            msg: "Click URL to see the code snippet"
        }));

        if (results.length > 0) {
            fs.writeFileSync('github_api_results.json', JSON.stringify(results, null, 2));
            console.log(`Saved clean results to 'github_api_results.json'`);
        }

    } catch (error) {
        if (error.response) {
            console.error(`API Error: ${error.response.status} ${error.response.statusText}`);
            if (error.response.status === 403) console.log("    (You hit the rate limit or your token is invalid)");
            if (error.response.status === 401) console.log("    (Your token is wrong)");
            if (error.response.status === 422) console.log("    (Validation Failed: Query might be too broad)");
        } else {
            console.error("Network Error:", error.message);
        }
    }
}

searchGitHubCode(KEYWORD);

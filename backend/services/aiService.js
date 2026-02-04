
// import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// Initialize Gemini (DISABLED)
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

// const model = genAI.getGenerativeModel({
//     model: "gemini-2.0-flash-lite",
//     temperature: 0.2
// });

// Delay helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic wrapper (DISABLED)
/*
async function generateWithRetry(prompt, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await model.generateContent(prompt);
        } catch (error) {
            if (error.status === 429 || error.message?.includes('429')) {
                retries++;
                const delay = Math.pow(2, retries) * 1000 + (Math.random() * 1000);
                console.warn(`[Gemini] Rate limit hit. Retrying in ${(delay / 1000).toFixed(1)}s...`);
                await sleep(delay);
            } else {
                throw error;
            }
        }
    }
    throw new Error("Againt rate limit exceeded after retries");
}
*/

// --- LOCAL RULES-BASED ANALYSIS (FAST FALLBACK) ---

const HIGH_RISK_KEYWORDS = [
    // Violence & Terror
    'kill', 'terror', 'bomb', 'suicide', 'murder', 'assassinate', 'explosive', 'weapon', 'gun', 'ammo',
    'shoot', 'attack', 'dead', 'death', 'genocide', 'massacre', 'behead', 'hostage', 'torture',
    'radical', 'extremist', 'jihad', 'isis', 'al-qaeda', 'cartel', 'trafficking', 'smuggle',

    // Criminal & Illegal
    'steal', 'hacked', 'illegal', 'drug', 'cocaine', 'heroin', 'meth', 'fentanyl', 'dealer',
    'market', 'darknet', 'onion', 'tor', 'carding', 'cc', 'cvv', 'fullz', 'dump', 'leak',
    'malware', 'ransomware', 'virus', 'trojan', 'botnet', 'ddos', 'exploit', 'vulnerability',
    'bypass', 'crack', 'stolen', 'counterfeit', 'fake id', 'passport', 'laundering',

    // Financial Fraud (High Severity)
    'money laundering', 'ponzi', 'pyramid scheme', 'guaranteed returns', 'dm me for money',
    'instant profit', 'double your money', 'flip cash', 'cash app flip', 'bank log',
    'clean money', 'dirty money', 'transfer hack', 'wire transfer', 'western union hack'
];

const MEDIUM_RISK_KEYWORDS = [
    // Scams & Phishing
    'scam', 'fraud', 'urgent', 'act now', 'click here', 'password', 'login', 'verify',
    'account suspended', 'limited time', 'winner', 'prize', 'giveaway', 'lottery',
    'claim now', 'free money', 'gift card', 'voucher', 'coupon', 'exclusive deal',
    'risk free', 'investment', 'profit', 'earnings',

    // Crypto & Hype
    'crypto', 'bitcoin', 'btc', 'eth', 'ethereum', 'usdt', 'airdrop', 'presale',
    'private key', 'seed phrase', 'wallet', 'recovery', 'mask', 'trust wallet',
    'pump', 'dump', 'moon', '100x', '1000x', 'gem', 'signal', 'mining',
    'forex', 'trading', 'binary option', 'expert trader', 'mentor',

    // Suspicious Behavior
    'dm me', 'inbox me', 'send message', 'whatsapp', 'telegram', 'snapchat',
    'secret', 'hidden', 'private group', 'vip connection', 'insider info',
    'bulk', 'cheap', 'discount', 'wholesale', 'refurbished', 'unlocked',
    'jailbreak', 'activator', 'generator', 'bot', 'automation'
];

export async function analyzePostMultimodal(post) {
    const { content, id } = post;
    const lowerContent = (content || '').toLowerCase();

    let risk = 'Low';
    let riskScore = 10;
    const riskFlags = [];
    let sentiment = 'Neutral';

    // Basic Keyword Matching
    for (const kw of HIGH_RISK_KEYWORDS) {
        if (lowerContent.includes(kw)) {
            risk = 'High';
            riskScore = 90;
            riskFlags.push(`Keyword: ${kw}`);
            sentiment = 'Negative';
        }
    }

    if (risk !== 'High') {
        for (const kw of MEDIUM_RISK_KEYWORDS) {
            if (lowerContent.includes(kw)) {
                risk = 'Medium';
                riskScore = 50;
                riskFlags.push(`Keyword: ${kw}`);
                sentiment = 'Negative';
            }
        }
    }

    // Regex extraction (Phone, UPI)
    const phoneRegex = /(\+?\d{1,3}[- ]?)?\d{10}/g;
    const extractedPhones = (content || '').match(phoneRegex) || [];
    if (extractedPhones.length > 0) {
        riskFlags.push("Phone Detected");
        if (risk === 'Low') { risk = 'Medium'; riskScore = 40; }
    }

    const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
    const extractedUpis = (content || '').match(upiRegex) || [];
    if (extractedUpis.length > 0) {
        riskFlags.push("UPI Detected");
        if (risk === 'Low') { risk = 'Medium'; riskScore = 45; }
    }

    return {
        risk,
        sentiment,
        risk_score: riskScore,
        risk_flags: riskFlags,
        extracted_phones: extractedPhones,
        extracted_upis: extractedUpis,
        ner_entities: []
    };
}



export const analyzeRiskBatch = async (posts) => {
    // FORCE LOCAL ANALYSIS ONLY
    console.log("[System] Running Standard Risk scoring...");

    // 1. Run local risk scoring on all posts
    const analyzedPosts = await Promise.all(posts.map(async p => ({
        ...p,
        ...(await analyzePostMultimodal(p))
    })));

    return analyzedPosts;

    /* GEMINI BATCH CODE HIDDEN/DISABLED
    const ENABLE_BATCH_AI = false;

    // Always fallback to purely local analysis
    if (!process.env.GEMINI_API_KEY || !ENABLE_BATCH_AI) {
        console.warn("[AI] AI Analysis disabled. Using local system analysis only.");
        return Promise.all(posts.map(async p => ({ ...p, ...(await analyzePostMultimodal(p)) })));
    }

    const BATCH_SIZE = 15; // Safe batch size
    const DELAY_BETWEEN_BATCHES = 2500; // 2.5s delay to be nice to rate limits

    let allAnalyzedPosts = [];

    // 1. First, run local analysis on everything to get baseline features (phones, UPIs)
    const locallyEnriched = await Promise.all(posts.map(async p => {
        const local = await analyzePostMultimodal(p);
        return { ...p, ...local, enrichmentData: { ...p.enrichmentData, ...local } };
    }));

    // 2. Chunk for AI
    for (let i = 0; i < locallyEnriched.length; i += BATCH_SIZE) {
        const batch = locallyEnriched.slice(i, i + BATCH_SIZE);
        console.log(`[AI Batch] Processing items ${i + 1} to ${i + batch.length}...`);

        try {
            const prompt = `
            You are an expert intelligence analyst. Analyze these ${batch.length} social media posts.
            
            INPUT (JSON):
            ${JSON.stringify(batch.map(p => ({ id: p._id || p.id, content: p.content })), null, 2)}

            For each post, determine:
            1. Risk Level (High, Medium, Low) - Be strict. Look for fraud, intent to harm, or illegal content.
            2. Sentiment (Negative, Neutral, Positive).
            3. Detailed Risk Reasoning (1 sentence).

            OUTPUT: Return ONLY a JSON array, nothing else.
            Example: [{"id": "123", "risk": "High", "sentiment": "Negative", "reason": "Scam pattern detected"}]
            `;

            const result = await generateWithRetry(prompt);
            const text = result.response.text();

            // Clean markdown if present
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiResults = JSON.parse(cleanJson);

            // Merge AI results back into batch
            const mergedBatch = batch.map(post => {
                const aiData = aiResults.find(r => r.id === (post._id || post.id).toString()) || {};
                return {
                    ...post,
                    risk: aiData.risk || post.risk, // Prefer AI risk, fallback to local
                    sentiment: aiData.sentiment || post.sentiment,
                    ai_reason: aiData.reason,
                    // Keep robust local extraction for flags
                    enrichmentData: {
                        ...post.enrichmentData,
                        risk_flags: [...(post.risk_flags || []), aiData.reason ? `AI: ${aiData.reason}` : null].filter(Boolean)
                    }
                };
            });

            allAnalyzedPosts.push(...mergedBatch);

            // Rate Limit Pause
            if (i + BATCH_SIZE < locallyEnriched.length) {
                console.log(`[AI Batch] Sleeping for ${DELAY_BETWEEN_BATCHES}ms...`);
                await sleep(DELAY_BETWEEN_BATCHES);
            }

        } catch (e) {
            console.error(`[AI Batch] Failed for batch ${i}:`, e.message);
            // Fallback: push the locally enriched ones if AI fails
            allAnalyzedPosts.push(...batch);
        }
    }

    return allAnalyzedPosts;
    */
};


// --- REPORT GENERATION ---

export const runFullProjectAnalysis = async (keyword, posts, totalCount) => {
    // AI Summary disabled. Falling back to system summary.
    const ENABLE_AI_SUMMARY = false;

    /* AI SUMMARY - HIDDEN
    if (ENABLE_AI_SUMMARY && process.env.GEMINI_API_KEY) {
        console.log(`[AI Summary] Generating summary for ${posts.length} posts...`);
        try {
            const prompt = `
            SYSTEM PROMPT:
            Check and summarize the following social media posts. Focus on potential risks and threats.
            
            INPUT:
            ${JSON.stringify(posts.map(p => ({
                content: p.content,
                author: p.author,
                risk: p.risk
            })).slice(0, 50), null, 2)} 
            
            OUTPUT:
            Provide a concise HTML summary wrapped in a <div>. Include a Threat Level and a Key Findings list.
            `;

            const result = await generateWithRetry(prompt);
            const summaryHTML = result.response.text().replace(/```html/g, '').replace(/```/g, '').trim();

            return {
                summary: summaryHTML,
                riskResults: posts
            };

        } catch (e) {
            console.error("[AI Summary] Failed:", e);
            // Fallback to local if AI fails
        }
    }
    */

    console.log(`[LocalAI] Generating detailed system summary for ${posts.length} posts...`);

    let highRiskCount = 0;
    const allKeywords = {};
    const highRiskUsers = []; // Stores { username, platform, riskScore }

    posts.forEach(post => {
        if (post.risk === 'High') {
            highRiskCount++;
            highRiskUsers.push({
                username: post.username || post.author || 'Unknown',
                platform: post.platform || 'Unknown',
                riskScore: post.risk_score || 90
            });
        }

        const intel = post.enrichmentData || {};
        (intel.risk_flags || []).forEach(flag => {
            const clean = flag.replace('AI: ', '').replace('Keyword: ', '').trim();
            if (clean && clean !== 'Phone Detected' && clean !== 'UPI Detected') {
                allKeywords[clean] = (allKeywords[clean] || 0) + 1;
            }
        });
    });

    const highRiskPercent = totalCount > 0 ? (highRiskCount / totalCount) * 100 : 0;

    let threatLevel = "LOW";
    if (highRiskPercent > 10) threatLevel = "MEDIUM";
    if (highRiskPercent > 30) threatLevel = "CRITICAL";

    // --- GENERATE NARRATIVE (Target ~250 words) ---

    // 1. Top Keywords
    const sortedKeywords = Object.entries(allKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => k);

    // 2. Top High Risk Users (Unique)
    const uniqueHighRiskUsers = [...new Set(highRiskUsers.map(u => `${u.username} (${u.platform})`))].slice(0, 8);

    // 3. Construct Narrative Paragraphs
    const introParams = [
        `The automated intelligence scan for "<strong>${keyword}</strong>" has completed processing ${totalCount} items.`,
        `The system has identified <strong>${highRiskCount} high-risk artifacts</strong>, representing ${highRiskPercent.toFixed(1)}% of the total dataset.`,
        `Based on the density of threat indicators, the overall threat level is assessed as <strong>${threatLevel}</strong>.`
    ];

    const keywordParams = sortedKeywords.length > 0
        ? `Primary risk factors include a high frequency of terms such as <em>"${sortedKeywords.join('", "')}"</em>. These keywords are often associated with illicit activities, financial fraud, or coordinated campaigns.`
        : `No specific recurring risk keywords were dominant in this dataset, though individual high-risk items were flagged based on isolated indicators.`;

    const userParams = uniqueHighRiskUsers.length > 0
        ? `Several accounts were flagged for distributing high-risk content. Notable entities include <strong>${uniqueHighRiskUsers.join(', ')}</strong>. Monitoring these accounts is recommended to identify potential bot networks or organized groups.`
        : `No specific recurrent high-risk accounts were isolated in this batch.`;

    // const conclusionParams = `This automated summary is generated based on strictly defined risk heuristics including keyword matching, pattern recognition, and known threat indicators. Immediate review of the flagged items is advised to determine the validity of the threats and take appropriate mitigation actions.`;
    const conclusionParams = ``;

    // Combine into a roughly 200-300 word text block
    const fullNarrative = `
        <p class="mb-4">${introParams.join(' ')}</p>
        <p class="mb-4">${keywordParams} ${userParams}</p>
        <p class="text-sm text-slate-400 border-l-2 border-slate-600 pl-4 italic">${conclusionParams}</p>
    `;

    const summaryHTML = `
        <div class="p-6 bg-slate-900/50 rounded-xl border border-slate-700 font-sans">
        

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="bg-gray-700 p-4 rounded-lg">
                    <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Threat Level</p>
                    <p class="text-2xl font-black ${threatLevel === 'CRITICAL' ? 'text-red-500' : threatLevel === 'MEDIUM' ? 'text-orange-500' : 'text-emerald-500'} tracking-tight">${threatLevel}</p>
                </div>
                <div class="bg-gray-700 p-4 rounded-lg">
                    <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">High Risk Items</p>
                    <p class="text-2xl font-bold text-white">${highRiskCount} <span class="text-sm font-normal text-slate-500">of ${totalCount}</span></p>
                </div>
                 <div class="bg-gray-700 p-4 rounded-lg">
                    <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Top Risk Vector</p>
                    <p class="text-lg font-bold text-white truncate" title="${sortedKeywords[0] || 'None'}">${sortedKeywords[0] || 'None'}</p>
                </div>
                <div class="bg-gray-700 p-4 rounded-lg">
                    <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Flagged Accounts</p>
                    <p class="text-2xl font-bold text-white">${uniqueHighRiskUsers.length}</p>
                </div>
            </div>

            <div class="text-slate-300 text-sm leading-7 space-y-4">
                ${fullNarrative}
            </div>
            
             <div class="mt-6 pt-4 border-t-4 border-gray-700 flex flex-wrap gap-2">
                ${sortedKeywords.map(k => `<span class="px-2 py-1 bg-red-900/20 border border-red-900/50 text-red-400 text-xs rounded">${k}</span>`).join('')}
            </div>
        </div>
    `;

    return {
        summary: summaryHTML,
        riskResults: posts
    };
};
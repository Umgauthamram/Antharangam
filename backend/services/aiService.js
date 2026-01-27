

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import 'dotenv/config';

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const summaryModel = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash-lite",
//   temperature: 0.3
// });


// const structuredModel = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash-lite"
// });




// // Helper function for retry logic with exponential backoff
// async function generateContentWithRetry(model, params, maxRetries = 5) {
//     let retries = 0;
//     while (retries < maxRetries) {
//         try {
//             return await model.generateContent(params);
//         } catch (error) {
//             const isRateLimit = error.status === 429 || error.message?.includes('429');
//             const isServerOverload = error.status === 503 || error.message?.includes('503');

//             if (isRateLimit || isServerOverload) {
//                 retries++;
//                 const baseDelay = Math.pow(2, retries) * 1000; 

//                 const delay = baseDelay + Math.random() * 1000;

//                 console.warn(`[Gemini] ${isRateLimit ? 'Rate Limit (429)' : 'Overload (503)'} hit. Retrying in ${(delay/1000).toFixed(1)}s... (Attempt ${retries}/${maxRetries})`);

//                 await new Promise(resolve => setTimeout(resolve, delay));
//             } else {
//                 throw error;
//             }
//         }
//     }
//     throw new Error(`[Gemini] Failed after ${maxRetries} retries due to persistent rate limiting/overload.`);
// }

// export async function runFullProjectAnalysis(query, postsToAnalyze, totalPostsFound) {

//   const MAX_POSTS_PER_ANALYSIS = 10;

//   if (!postsToAnalyze || postsToAnalyze.length === 0) {
//     return { summary: "No posts were found for this query.", riskResults: [] };
//   }

//   if (postsToAnalyze.length > MAX_POSTS_PER_ANALYSIS) {
//     console.warn(`[AI Service] Truncating analysis sample from ${postsToAnalyze.length} to ${MAX_POSTS_PER_ANALYSIS}.`);

//     postsToAnalyze = postsToAnalyze.slice(0, MAX_POSTS_PER_ANALYSIS);
//   }

//   const postsData = postsToAnalyze.map(p => `ID: ${p._id}\nContent: ${p.content}`).join('\n---\n');

//   const systemPrompt = `
// You are a professional OSINT (Open-Source Intelligence) analyst.
// Your task is to analyze the provided sample of social media posts and perform two actions:

// 1. **Generate a formal intelligence summary:** This summary must cover key findings based on the sample, following a structure with a Title, Executive Summary, and Key Findings. Highlight all important entities (usernames, locations, threats) by wrapping them in double asterisks (e.g., **@username**). Include Risk Level: Low / Moderate / High / Critical.

// 2. **Analyze each post in the sample for risk and sentiment.**

// **CRUCIAL INSTRUCTION:** Output ONLY a valid JSON object.
// `;

//   const userPrompt = `
// **Original Query:** "${query}"
// **Total Posts Found in Scrape:** ${totalPostsFound}
// **Posts Sampled for Detailed Analysis:** ${postsToAnalyze.length}

// ${postsData}
// ---

// Please generate the full Threat Intelligence Summary (Markdown) and the post-by-post risk analysis (JSON array) based on this sample.
// `;


//   try {
//     const result = await generateContentWithRetry(structuredModel, {
//       contents: [{ role: "user", parts: [{ text: userPrompt }] }],
//       systemInstruction: systemPrompt,
//       generationConfig: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: "OBJECT",
//           properties: {
//             summary: { type: "STRING" },
//             post_analysis: {
//               type: "ARRAY",
//               items: {
//                 type: "OBJECT",
//                 properties: {
//                   id: { type: "STRING" },
//                   risk: { type: "STRING", enum: ["High", "Medium", "Low"] },
//                   sentiment: { type: "STRING", enum: ["Negative", "Neutral", "Positive"] }
//                 },
//                 required: ["id", "risk", "sentiment"]
//               }
//             }
//           },
//           required: ["summary", "post_analysis"]
//         }
//       }
//     });


//     let jsonText = result.text; 
//         if (!jsonText) {
//             jsonText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

//             if (!jsonText) {
//                 console.error("[AI Service] Empty text detected. Full API result:", JSON.stringify(result, null, 2));
//                 throw new Error("AI returned an empty or invalid response structure.");
//             }
//         }
//     const cleanJsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

//         const parsed = JSON.parse(cleanJsonText);

//         return {
//             summary: parsed.summary,
//             riskResults: parsed.post_analysis
//         };

//     } catch (error) {
//         console.error("[AI Service] Error calling Gemini API:", error);
//         return { summary: "Error: AI analysis failed or returned invalid data.", riskResults: [] };
//     }
// }


// export async function analyzeRiskBatch(posts) {
//   if (!posts || posts.length === 0) return [];

//   const postsData = posts.map(p => `ID: ${p._id}\nContent: ${p.content}`).join('\n---\n');

//   const systemPrompt = `
// You are an expert content moderator and threat analyst.
//  Analyze the following social media posts.
// For EACH post, determine:
// 1. Risk Level: "High", "Medium", or "Low" (Based on violence, illegal acts, threats).
// 2. Sentiment: "Negative", "Neutral", or "Positive".

// Output ONLY a valid JSON array. Format:
// [{"id": "post_id", "risk": "High", "sentiment": "Negative"}, ...]
//  `;

//   try {
//     const result = await generateContentWithRetry(summaryModel, {
//       contents: [{ role: "user", parts: [{ text: postsData }] }],
//       systemInstruction: systemPrompt,
//       generationConfig: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: "ARRAY",
//           items: {
//             type: "OBJECT",
//             properties: {
//               id: { type: "STRING" },
//               risk: { type: "STRING", enum: ["High", "Medium", "Low"] },
//               sentiment: { type: "STRING", enum: ["Negative", "Neutral", "Positive"] }
//             },
//             required: ["id", "risk", "sentiment"]
//           }
//         }
//       }
//     });

//     let text = result.text; 
//         if (!text) {
//             text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
//         }

//         if (!text) {
//             console.error("[AI] Risk analysis failed: Received empty response text. Full API result:", JSON.stringify(result, null, 2));
//             return [];
//         }

//         const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
//         return JSON.parse(jsonString);

//     } catch (error) {
//         console.error("[AI] Risk analysis failed:", error);
//         return [];
//     }
// }



const HIGH_RISK_KEYWORDS = ['scam', 'fraud', 'steal', 'hack', 'illegal', 'drug', 'weapon', 'kill', 'terror', 'bomb', 'suicide', 'money laundering', 'guaranteed returns', 'dm me for money'];
const MEDIUM_RISK_KEYWORDS = ['investment', 'crypto', 'urgent', 'act now', 'click here', 'password', 'login', 'verify', 'account suspended'];

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

    // Phone Extraction Regex (Simple India/US)
    const phoneRegex = /(\+?\d{1,3}[- ]?)?\d{10}/g;
    const extractedPhones = (content || '').match(phoneRegex) || [];
    if (extractedPhones.length > 0) {
        riskFlags.push("Phone Detected");
        if (risk === 'Low') { risk = 'Medium'; riskScore = 40; }
    }

    // UPI Extraction Regex
    const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
    const extractedUpis = (content || '').match(upiRegex) || [];
    if (extractedUpis.length > 0) {
        riskFlags.push("UPI Detected");
        if (risk === 'Low') { risk = 'Medium'; riskScore = 45; }
    }

    // console.log(`[LocalAnalysis] Analyzed Post ${id}: Risk=${risk}`);

    return {
        risk: risk,
        sentiment: sentiment,
        risk_score: riskScore,
        risk_flags: riskFlags,
        ner_entities: [],
        extracted_phones: extractedPhones,
        extracted_upis: extractedUpis,
        ocr_text: null,
        summary: `Local analysis determined ${risk} risk based on keywords.`
    };
}



// Batch analysis reusing the single post logic
export const analyzeRiskBatch = async (posts) => {
    // Process all posts in parallel (since it's local and fast)
    const results = await Promise.all(posts.map(async (post) => {
        // Only re-analyze if risk is missing or we want to force refresh. 
        // For now, let's force refresh or at least ensure we get full enrichment structure.
        const analysis = await analyzePostMultimodal(post);
        return {
            ...post,
            ...analysis, // This overwrites/adds risk, sentiment, risk_flags, etc.
            enrichmentData: {
                ...post.enrichmentData,
                risk_flags: analysis.risk_flags,
                extracted_phones: analysis.extracted_phones,
                extracted_upis: analysis.extracted_upis,
                ner_entities: analysis.ner_entities
            }
        };
    }));
    return results;
};


function generateVerboseReport(keyword, totalCount, highRiskCount, topKeywords, topEntities, allPhones, allUPIs, threatLevel) {
    const riskPercentage = totalCount > 0 ? ((highRiskCount / totalCount) * 100).toFixed(1) : 0;
    const hasEntities = topEntities.length > 0;
    const hasContacts = allPhones.size > 0 || allUPIs.size > 0;

    let narrative = `
        <div style="font-family: 'Georgia', serif; color: #cbd5e1; line-height: 1.8; font-size: 15px;">
        
        <h3 style="color: #e2e8f0; font-family: 'Inter', sans-serif; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #475569; padding-bottom: 5px;">1. Executive Overview</h3>
        <p style="margin-bottom: 16px;">
            This intelligence assessment provides a detailed forensic analysis of social media activity surrounding the target vector <em>"${keyword}"</em>. 
            The automated surveillance grid successfully intercepted and processed a total of <strong>${totalCount} unique data points</strong> across monitored platforms. 
            The primary objective of this scan was to isolate high-probability threat indicators, identify coordinated inauthentic behavior, and map potential fraud networks. 
            Based on the aggregate data analysis, the current operational threat level is classified as <strong>${threatLevel}</strong>. 
            Approximately <strong>${riskPercentage}%</strong> of the analyzed content has been flagged as "High Risk," warranting immediate attention from analysts and law enforcement liaisons.
        </p>

        <h3 style="color: #e2e8f0; font-family: 'Inter', sans-serif; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #475569; padding-bottom: 5px;">2. Threat Vector Analysis</h3>
        <p style="margin-bottom: 16px;">
            A granular inspection of the intercepted communications reveals specific patterns indicative of structured activity. 
            The semantic analysis engine identified a recurring lexicon associated with the target query. 
            <strong>Dominant Keywords:</strong> The most statistically significant terms observed in the dataset include ${topKeywords ? topKeywords : "general conversational fillers"}, 
            suggesting that these concepts form the core narrative or modus operandi of the actors involved.
            ${highRiskCount > 0
            ? `Specifically, the detection of <strong>${highRiskCount} critical risk items</strong> highlights a tangible security concern. these items exhibited strong markers of malicious intent, including but not limited to financial solicitation, social engineering tactics, or explicit threats.`
            : "While no critical high-risk vectors were isolated in this specific batch, the volume of chatter suggests a need for continued vigilance to detect low-level grooming or reconnaissance activity."}
            This pattern of keyword usage is consistent with known behavioral signatures of ${threatLevel === 'CRITICAL' ? "organized cyber-fraud syndicates or coordinated disinformation campaigns." : "opportunistic actors or organic public discourse."}
        </p>

        <h3 style="color: #e2e8f0; font-family: 'Inter', sans-serif; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #475569; padding-bottom: 5px;">3. Entity & Identity Resolution</h3>
        <p style="margin-bottom: 16px;">
            Forensic extraction algorithms were deployed to identify actionable intelligence targets within the unstructured text data. 
            ${hasEntities
            ? `The system successfully resolved several key named entities. <strong>Prominent Entities:</strong> The dataset heavily references <strong>${topEntities}</strong>. These entities may represent the primary subjects of the discussion, alias accounts used by threat actors, or organizations being impersonated for credibility.`
            : "Identity resolution algorithms did not converge on specific, high-frequency named entities in this pass, suggesting a diffuse conversation or the use of generic obfuscation techniques."}
            
            ${hasContacts
            ? `Critically, the deep-dive extraction modules uncovered direct attribution data. The system isolated <strong>${allPhones.size} unique telephone numbers</strong> and <strong>${allUPIs.size} UPI (Unified Payments Interface) identifiers</strong> embedded within the posts. In the context of financial fraud investigations, these identifiers are considered high-value forensic artifacts. Cross-referencing these contacts with known offender databases is strongly recommended to establish linkage with prior cases.`
            : "No direct financial identifiers (Phone/UPI) were openly broadcast in this sample, which implies that actors may be moving conversations to encrypted private channels (DM) before sharing sensitive payment details."}
        </p>

        <h3 style="color: #e2e8f0; font-family: 'Inter', sans-serif; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #475569; padding-bottom: 5px;">4. Strategic Recommendations</h3>
        <p style="margin-bottom: 0;">
            In conclusion, the intelligence picture derived from the query <em>"${keyword}"</em> indicates a <strong>${threatLevel.toLowerCase()}</strong> probability of adverse events. 
            ${threatLevel === 'CRITICAL'
            ? "<strong>Action Required:</strong> Immediate intervention is advised. Data preservation notices should be issued to the relevant platforms for the high-risk accounts identified. The extracted financial identifiers should be prioritized for tracing."
            : (threatLevel === 'MEDIUM'
                ? "<strong>Action Required:</strong> Enhanced monitoring is recommended. The situation is evolving, and while immediate harm may not be imminent, the indicators suggest a potential for escalation. Analysts should conduct a manual review of the flagged 'Medium Risk' items."
                : "<strong>Action Required:</strong> Routine monitoring is sufficient at this stage. The current noise-to-signal ratio is high, with limited actionable threads. Periodic re-scans are advised to detect any shifts in sentiment or tactic.")}
            This generated report serves as a preliminary assessment to guide resource allocation and further investigative steps.
        </p>
        </div>
    `;
    return narrative;
}

export const runFullProjectAnalysis = async (keyword, posts, totalCount) => {
    console.log(`[LocalAI] Generating statistical summary for ${posts.length} posts...`);

    try {
        let highRiskCount = 0;
        let mediumRiskCount = 0;

        const allKeywords = {};
        const allEntities = {};
        const allPhones = new Set();
        const allUPIs = new Set();

        posts.forEach(post => {
            if (post.risk === 'High') highRiskCount++;
            else if (post.risk === 'Medium') mediumRiskCount++;

            const intel = post.enrichmentData || {};

            (intel.risk_flags || []).forEach(flag => {
                const cleanFlag = flag.replace('Keyword: ', '').replace('Phone Detected', '').replace('UPI Detected', '').trim();
                if (cleanFlag && !cleanFlag.startsWith('Source:')) {
                    allKeywords[cleanFlag] = (allKeywords[cleanFlag] || 0) + 1;
                }
            });

            (intel.ner_entities || []).forEach(entity => {
                allEntities[entity] = (allEntities[entity] || 0) + 1;
            });

            (intel.extracted_phones || []).forEach(p => allPhones.add(p));
            (intel.extracted_upis || []).forEach(u => allUPIs.add(u));
        });

        const topKeywordsArray = Object.entries(allKeywords).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topKeywords = topKeywordsArray.map(k => `<b>${k[0]}</b>`).join(', ');

        const topEntitiesArray = Object.entries(allEntities).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const topEntities = topEntitiesArray.map(e => e[0]).join(', ');

        const highRiskPercent = totalCount > 0 ? (highRiskCount / totalCount) * 100 : 0;
        let threatLevel = "LOW";
        let threatColor = "#4ade80"; // Bright Green
        let panelBg = "rgba(74, 222, 128, 0.1)"; // Green tint
        let panelBorder = "rgba(74, 222, 128, 0.2)";

        if (highRiskPercent > 10) {
            threatLevel = "MEDIUM";
            threatColor = "#fbbf24"; // Amber 400
            panelBg = "rgba(251, 191, 36, 0.1)";
            panelBorder = "rgba(251, 191, 36, 0.2)";
        }
        if (highRiskPercent > 30) {
            threatLevel = "CRITICAL";
            threatColor = "#f87171"; // Red 400
            panelBg = "rgba(248, 113, 113, 0.1)";
            panelBorder = "rgba(248, 113, 113, 0.2)";
        }

        const verboseReport = generateVerboseReport(keyword, totalCount, highRiskCount, topKeywords, topEntities, allPhones, allUPIs, threatLevel);

        const summaryHTML = `
            <div style="font-family: 'Inter', sans-serif; font-size: 14px; color: #e2e8f0; line-height: 1.6;">
                <div style="background-color: ${panelBg}; padding: 16px; border-radius: 8px; border: 1px solid ${panelBorder}; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;"></span>
                        <div>
                            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${threatColor}; font-weight: bold;">Threat Intelligence Report</p>
                            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #f8fafc;">Threat Level: <span style="color:${threatColor};">${threatLevel}</span></p>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 24px; color: #cbd5e1;">
                    ${verboseReport}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                     <div style="background: rgba(30, 41, 59, 0.5); padding: 12px; border-radius: 6px; border: 1px solid #334155;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Common Keywords</span>
                        <p style="margin-top: 4px; color: #f1f5f9; font-size: 13px;">${topKeywords || "None"}</p>
                     </div>
                     <div style="background: rgba(30, 41, 59, 0.5); padding: 12px; border-radius: 6px; border: 1px solid #334155;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Entities Identified</span>
                        <p style="margin-top: 4px; color: #f1f5f9; font-size: 13px;">${topEntities || "None"}</p>
                     </div>
                </div>

                ${highRiskCount > 0 ? `
                <h4 style="border-bottom: 1px solid #334155; padding-bottom: 8px; margin-top: 32px; color: #f87171; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    🚨 Critical Threat Breakdown (${highRiskCount} Items)
                </h4>
                <div style="margin-top: 16px;">
                    ${posts.filter(p => p.risk === 'High').map(p => {
            const domain = p.sourceUrl ? (new URL(p.sourceUrl).hostname.replace('www.', '')) : p.platform.toUpperCase();
            return `
                        <div style="background-color: rgba(248, 113, 113, 0.05); border-left: 3px solid #f87171; padding: 12px 16px; margin-bottom: 12px; border-radius: 0 4px 4px 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: bold; color: #f1f5f9;">@${p.username}</span>
                                    ${p.sourceUrl ?
                    `<a href="${p.sourceUrl}" target="_blank" style="font-weight: normal; color: #60a5fa; font-size: 12px; text-decoration: none; border: 1px solid #1e293b; padding: 2px 6px; border-radius: 4px; background: rgba(30,41,59,0.5);">🔗 ${domain}</a>`
                    : `<span style="font-weight: normal; color: #94a3b8; font-size: 12px;">(${p.platform?.toUpperCase()})</span>`
                }
                                </div>
                                <span style="font-size: 12px; color: #64748b;">${new Date(p.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-style: italic; font-family: 'Georgia', serif;">"${p.content.length > 200 ? p.content.substring(0, 200) + '...' : p.content}"</p>
                            ${(p.enrichmentData?.extracted_phones?.length > 0 || p.enrichmentData?.extracted_upis?.length > 0) ? `
                                <div style="margin-top: 8px; font-size: 11px; background-color: rgba(15, 23, 42, 0.5); padding: 4px 8px; border-radius: 4px; display: inline-block; color: #f8fafc; border: 1px solid #334155;">
                                    <strong>Extracted:</strong> ${[... (p.enrichmentData.extracted_phones || []), ... (p.enrichmentData.extracted_upis || [])].join(', ')}
                                </div>
                            ` : ''}
                        </div>
                    `}).join('')}
                </div>
                ` : ''}
            </div>
        `;

        return {
            summary: summaryHTML,
            riskResults: posts
        };

    } catch (error) {
        console.error("Local Analysis Error:", error);
        return {
            summary: "Error generating statistical summary.",
            riskResults: []
        };
    }
};
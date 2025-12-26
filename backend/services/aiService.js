

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import 'dotenv/config';

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const summaryModel = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash",
//   temperature: 0.3
// });


// const structuredModel = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash"
// });



// export async function runFullProjectAnalysis(query, postsToAnalyze, totalPostsFound) {

//   const MAX_POSTS_PER_ANALYSIS = 35;

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
//     const result = await structuredModel.generateContent({
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
//     const result = await summaryModel.generateContent({
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

//    let text = result.text; 
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





// above is for google gemini ai service

export const analyzeRiskBatch = async (posts) => {
    return posts.map(post => ({
        ...post,
        risk: post.risk || 'Low',
        sentiment: post.sentiment || 'Neutral'
    }));
};

export const runFullProjectAnalysis = async (keyword, posts, totalCount) => {
    console.log(`[LocalAI] Generating statistical summary for ${posts.length} posts...`);

    try {
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;
        
        const allKeywords = {};
        const allEntities = {};
        const allPhones = new Set();
        const allUPIs = new Set();

        posts.forEach(post => {
            if (post.risk === 'High') highRiskCount++;
            else if (post.risk === 'Medium') mediumRiskCount++;
            else lowRiskCount++;

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

        const topKeywords = Object.entries(allKeywords)
            .sort((a, b) => b[1] - a[1]) 
            .slice(0, 5)
            .map(k => `<b>${k[0]}</b> (${k[1]})`)
            .join(', ');

        const topEntities = Object.entries(allEntities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(e => e[0])
            .join(', ');

        const highRiskPercent = totalCount > 0 ? (highRiskCount / totalCount) * 100 : 0;
        let threatLevel = "LOW";
        let threatColor = "green";
        
        if (highRiskPercent > 10) { threatLevel = "MEDIUM"; threatColor = "#d97706"; } 
        if (highRiskPercent > 30) { threatLevel = "CRITICAL"; threatColor = "#dc2626"; } 
        const summaryHTML = `
            <div style="font-family: sans-serif; font-size: 14px;">
                <p style="margin-bottom: 8px;"><strong> Threat Level: <span style="color:${threatColor}">${threatLevel}</span></strong></p>
                <p style="margin-bottom: 12px;">
                    Scan completed on <strong>${totalCount} posts</strong> relating to "<em>${keyword}</em>".
                    System identified <strong>${highRiskCount} High Risk</strong> items requiring immediate attention.
                </p>
                
                <p style="margin-bottom: 4px;"><strong> Key Patterns Detected:</strong></p>
                <ul style="margin-top: 0;">
                    <li><strong>Common Themes:</strong> ${topKeywords || "None detected"}</li>
                    <li><strong>Key Entities Mentioned:</strong> ${topEntities || "None detected"}</li>
                    <li><strong>Suspect Contacts:</strong> Found ${allPhones.size} unique phone numbers and ${allUPIs.size} UPI IDs.</li>
                </ul>

                <p style="margin-top: 12px;"><strong> Recommendation:</strong>
                ${threatLevel === "CRITICAL" 
                    ? "Significant scam activity detected. Generate Forensic Report immediately for law enforcement action." 
                    : "Monitor specific high-risk users. Review extracted evidence in the log below."}
                </p>
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


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


function generateVerboseReport(keyword, totalCount, highRiskCount, topKeywords, topEntities, allPhones, allUPIs, threatLevel) {
    const riskPercentage = ((highRiskCount / totalCount) * 100).toFixed(1);
    const hasEntities = topEntities.length > 0;
    const hasContacts = allPhones.size > 0 || allUPIs.size > 0;

    let narrative = `
        <p style="margin-bottom: 12px; color: #cbd5e1;">
            This intelligence assessment is based on a comprehensive automated scan of <strong>${totalCount} social media signals</strong> related to the query <em>"${keyword}"</em>. 
            The system successfully ingested and processed these items to identify potential security threats, fraudulent activities, and high-risk indicators.
            Current analysis indicates a threat level of <strong>${threatLevel}</strong>, with <strong>${riskPercentage}%</strong> of the analyzed content flagged as High Risk.
        </p>
        <p style="margin-bottom: 12px; color: #cbd5e1;">
            Detailed inspection of the content reveals a coordinated pattern of activity. 
            The most dominant themes discovered in the dataset include ${topKeywords ? topKeywords : "generic discussions"}, suggesting that these are the primary vectors being utilized or discussed. 
            ${highRiskCount > 0 ? `Specifically, the system isolated <strong>${highRiskCount} critical items</strong> that exhibited strong indicators of malicious intent, scam keywords, or direct financial solicitation.` : "No critical high-risk vectors were isolated in this specific batch, indicating primarily informational or low-risk chatter."}
        </p>
        <p style="margin-bottom: 12px; color: #cbd5e1;">
            Forensic extraction algorithms ${hasEntities || hasContacts ? "were successful in identifying specific actionable intelligence." : "did not identify specific entities in this pass."}
            ${hasEntities ? `Key named entities appearing frequently in the context of these posts include <strong>${topEntities}</strong>, which may represent associated organizations, individuals, or alias accounts.` : ""}
            ${hasContacts ? `Furthermore, the system extracted <strong>${allPhones.size} unique phone numbers</strong> and <strong>${allUPIs.size} UPI IDs</strong> from the content. These identifiers are high-value targets for cross-referencing against known fraud databases.` : "No direct financial identifiers (Phone/UPI) were openly broadcast in this sample."}
        </p>
        <p style="color: #cbd5e1;">
            In conclusion, the presence of ${threatLevel === 'CRITICAL' ? "widespread high-risk signals" : (threatLevel === 'MEDIUM' ? "moderate risk indicators" : "low-risk content")} warrants ${threatLevel === 'CRITICAL' ? "immediate intervention and forensic preservation of evidence." : "continued monitoring to detect any escalation in threat velocity."}
            Analysts are advised to review the itemized breakdown below for specific attribution.
        </p>
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
                        <span style="font-size: 24px;">🛡️</span>
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
                    ${posts.filter(p => p.risk === 'High').map(p => `
                        <div style="background-color: rgba(248, 113, 113, 0.05); border-left: 3px solid #f87171; padding: 12px 16px; margin-bottom: 12px; border-radius: 0 4px 4px 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: bold; color: #f1f5f9;">@${p.username} <span style="font-weight: normal; color: #94a3b8; font-size: 12px;">(${p.platform?.toUpperCase()})</span></span>
                                <span style="font-size: 12px; color: #64748b;">${new Date(p.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-style: italic; font-family: 'Georgia', serif;">"${p.content.length > 200 ? p.content.substring(0, 200) + '...' : p.content}"</p>
                            ${(p.enrichmentData?.extracted_phones?.length > 0 || p.enrichmentData?.extracted_upis?.length > 0) ? `
                                <div style="margin-top: 8px; font-size: 11px; background-color: rgba(15, 23, 42, 0.5); padding: 4px 8px; border-radius: 4px; display: inline-block; color: #f8fafc; border: 1px solid #334155;">
                                    <strong>Extracted:</strong> ${[... (p.enrichmentData.extracted_phones || []), ... (p.enrichmentData.extracted_upis || [])].join(', ')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
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
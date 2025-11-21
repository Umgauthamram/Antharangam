import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  temperature: 0.3,
  systemInstruction: `You are a professional OSINT analyst.
Analyze social media posts and generate a formal Threat Intelligence Summary.
Structure:
# Title
## Executive Summary
## Key Findings (bullet points)
Highlight entities with **bold** (e.g., **@username**, **Delhi**, **#Protest**).
Be concise, factual, and direct. Never output JSON.`
});

const MAX_POSTS_PER_CHUNK = 20; 
const MAX_DIRECT_POSTS = 25;    

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function summarizeChunk(posts, query) {
  const postTexts = posts
    .map(p => `• @${p.username}: "${p.content.substring(0, 300)}${p.content.length > 300 ? '...' : ''}"`)
    .join("\n");

  const prompt = `
Analyze these ${posts.length} posts about: "${query}"

Extract:
- Threats or violence
- Locations, people, organizations
- Coordinated activity or calls to action
- Sentiment (anger, planning, fear)

Posts:
${postTexts}

Return 4–6 bullet points. Use **bold** for critical entities.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    return `[Error analyzing this batch]`;
  }
}

async function generateFinalReport(chunkSummaries, query, totalPosts) {
  const combined = chunkSummaries
    .map((s, i) => `Batch ${i + 1}:\n${s}`)
    .join("\n\n");

  const finalPrompt = `
# Threat Intelligence Summary: "${query}"

Total Posts Analyzed: ${totalPosts}
Platform: X (Twitter)

${combined}

Generate a final professional report with:
- Executive Summary (2–3 sentences)
- Key Findings (bullet points)
- Entities of Interest
- Risk Level: Low / Moderate / High / Critical

Use **bold** for all names, locations, hashtags, threats.
`;

  try {
    const result = await model.generateContent(finalPrompt);
    return result.response.text();
  } catch (err) {
    return `# Threat Intelligence Summary: "${query}"\n\nAnalysis partially failed. ${totalPosts} posts collected. Raw data available.`;
  }
}

export async function generateAnalysis(query, posts) {
  if (!posts || posts.length === 0) {
    return `# No Results Found\n\nNo posts matched: "${query}"\n\nPossible reasons: topic not trending, heavy moderation, or safe environment.`;
  }

  const total = posts.length;
  console.log(`[AI] Analyzing ${total} posts for "${query}"`);

  // Case 1: Small number of posts = send directly 
  if (total <= MAX_DIRECT_POSTS) {
    const prompt = `
Analyze these ${total} posts about: "${query}"

Posts:
${posts.map(p => `• @${p.username}: "${p.content}"`).join("\n")}

Generate a Threat Intelligence Summary with:
# Title
## Executive Summary
## Key Findings
Use **bold** for entities.
`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      return `AI analysis failed for ${total} posts.`;
    }
  }

  // Case 2: Large number = chunk + summarize + merge 
  const chunks = chunkArray(posts, MAX_POSTS_PER_CHUNK);
  console.log(`[AI] Split into ${chunks.length} chunks`);

  const summaries = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[AI] Processing chunk ${i + 1}/${chunks.length}...`);
    const summary = await summarizeChunk(chunks[i], query);
    summaries.push(summary);
    await new Promise(r => setTimeout(r, 600)); 
  }

  return await generateFinalReport(summaries, query, total);
}
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


export async function generateAnalysis(query, posts) {
  if (!posts || posts.length === 0) {
    return "No posts were found for this query, so no analysis could be generated.";
  }

  const systemPrompt = `You are a professional OSINT (Open-Source Intelligence) analyst. Your task is to analyze a raw list of social media posts (from X/Twitter,Facebook, Instagram, Reddit, Linkedin) related to a specific keyword and generate a formal intelligence summary.

Respond in the style of a "general article" (as requested), structured with a title, an executive summary, and key findings.

**Crucially: Highlight all important entities (usernames, locations, keywords, threats) by wrapping them in double asterisks (e.g., **@username** or **Red Fort**).**

The output must be a single block of text, using Markdown for formatting. Do not output JSON.
`;

  let postData = "--- START OF RAW POST DATA ---\n";
  for (const post of posts) {
    postData += `Username: @${post.username}\nPost: ${post.content}\n\n`;
  }
  postData += "--- END OF RAW POST DATA ---";

  const userPrompt = `
Here is the data for my analysis.

**Original Query:** "${query}"
**Total Posts Found:** ${posts.length}

${postData}

Please generate the "Threat Intelligence Summary" based on this data, following all instructions in the system prompt.
`;

  try {
    console.log("[aiService] Sending request to Gemini API...");
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
      },
    });

    const summary = result.response.text();
    console.log("[aiService] Successfully received summary from Gemini.");
    return summary;

  } catch (error) {
    console.error("[aiService] Error calling Gemini API:", error);
    return "Error: The AI analysis failed to run. The backend may be missing its API key or has a connection issue.";
  }
}
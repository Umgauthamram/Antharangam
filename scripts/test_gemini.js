import { analyzePostMultimodal } from '../backend/services/aiService.js';
import 'dotenv/config';

// Mock Post
const mockPost = {
    id: "test-123",
    content: "Make $5000 in 2 days! Guaranteed returns. DM me now #crypto #money",
    screenshotPath: null // Test text-only first
};

console.log("Testing Gemini Analysis...");

async function runTest() {
    try {
        const result = await analyzePostMultimodal(mockPost);
        console.log("\n--- Analysis Result ---");
        console.log(JSON.stringify(result, null, 2));

        if (result.risk === 'High' && result.risk_flags.length > 0) {
            console.log("\n  SUCCESS: High risk detected correctly.");
        } else {
            console.log("\n   WARNING: Risk detection might be off.");
        }
    } catch (e) {
        console.error("\n    TEST FAILED:", e);
    }
}

runTest();

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SPAM_KEYWORDS = [
  'casino', 'betting', 'sugar daddy', 'assignment help', 'proxy attendance',
  'escort', 'weed', 'drugs', 'vape', 'fake id', 'guns', 'crypto investment'
];

async function checkSpamKeywords(title: string, description: string) {
  const payload = `${title} ${description}`.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (payload.includes(keyword)) {
      return { aiFlagged: true, confidence: 1.0, reason: `Policy Violation: Restricted keyword '${keyword}'` };
    }
  }
  return { aiFlagged: false, confidence: 0 };
}

async function checkGeminiAlignment(title: string, description: string, price: number, category: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('API Key Missing');
  
  const ai = new GoogleGenerativeAI(key);
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = `
    MODERATOR PROMPT:
    Item Title: ${title}
    Item Description: ${description}
    Item Price: ${price} INR
    Categorized As: ${category}

    Assess if this item is a mismatch for the category.
    Return JSON: {"isAligned": boolean, "confidence": number, "reason": string}
  `;
  const response = await model.generateContent(prompt);
  const text = response.response.text() || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI format');
  
  const data = JSON.parse(jsonMatch[0]);
  return {
    aiFlagged: !data.isAligned,
    confidence: data.confidence || 0.9,
    reason: data.reason
  };
}

async function checkListingAILocal(title: string, description: string, price: number, category: string) {
  // Try Keywords First
  const kw = await checkSpamKeywords(title, description);
  if (kw.aiFlagged) return kw;

  // Then Gemini
  try {
    return await checkGeminiAlignment(title, description, price, category);
  } catch (err) {
    console.error("Gemini Internal Error:", err);
    throw err;
  }
}

// Mock process.env if needed (tsx --env-file should handle this, but being safe)
if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY not found in environment.");
  process.exit(1);
}

const testCases = [
  {
    title: "iPhone 13 - 128GB - Midnight Blue",
    description: "Slightly used iPhone 13, no scratches, battery health 92%. Original box and cable included.",
    price: 45000,
    category: "Electronics",
    expected: "PASS"
  },
  {
    title: "Fresh Garden Tomatoes",
    description: "Organic tomatoes grown in my backyard. Very fresh and juicy. Pickup only.",
    price: 50,
    category: "Property",
    expected: "FAIL (Miscategorized)"
  },
  {
    title: "Win Casino Bonuses Now",
    description: "Get free spins and win big money today! Sign up at our link for exclusive deals.",
    price: 0,
    category: "Services",
    expected: "FAIL (Spam Keyword)"
  },
  {
    title: "Premium Vape Pen",
    description: "Top quality vaping device with extra pods. Various flavors available.",
    price: 1500,
    category: "Electronics",
    expected: "FAIL (Policy Violation)"
  },
  {
    title: "Study Notes for CS101",
    description: "Handwritten notes for computer science course. Covers all major topics from the semester.",
    price: 200,
    category: "Books",
    expected: "PASS"
  },
  {
    title: "Proxy Attendance Service",
    description: "I will sit in your classes for you. 100% attendance guaranteed. Message for rates.",
    price: 500,
    category: "Services",
    expected: "FAIL (Prohibited Service)"
  }
];

async function runTests() {
  console.log("====================================================");
  console.log("      UniDeal Gemini Moderation Test Suite         ");
  console.log("====================================================\n");

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const { title, description, price, category, expected } = testCases[i];
    console.log(`[Test ${i + 1}/${testCases.length}] Testing: "${title}" in ${category}...`);

    try {
      const startTime = Date.now();
      const result = await checkListingAILocal(title, description, price, category);
      const duration = Date.now() - startTime;

      const passed = !result.aiFlagged;
      const statusMatch = (passed && expected === "PASS") || (!passed && expected.startsWith("FAIL"));

      const output = {
        id: i + 1,
        actual: passed ? "PASS" : "FAIL",
        match: statusMatch ? "✅" : "❌",
        reason: result.reason || "N/A",
        duration: `${duration}ms`
      };
      console.log(`- Result: ${output.actual} (${output.match}) | Reason: ${output.reason} | Time: ${output.duration}\n`);

      results.push({
        ...output,
        title,
        category,
        expected,
        confidence: result.confidence
      });

      if (statusMatch) passedCount++;
      else failedCount++;

    } catch (error) {
      console.error(`Error testing listing ${i + 1}:`, error);
      results.push({
        id: i + 1,
        title,
        category,
        expected,
        actual: "ERROR",
        reason: error instanceof Error ? error.message : String(error),
        confidence: 0,
        duration: "0ms",
        match: "❌"
      });
      failedCount++;
    }
  }

  // Generate Report
  console.log("\n====================================================");
  console.log("                FINAL SUMMARY                       ");
  console.log("====================================================");
  results.forEach(r => {
    console.log(`[${r.id}] ${r.match} EXPECTED: ${r.expected} | ACTUAL: ${r.actual} | ${r.title.substring(0, 30)}`);
  });

  console.log("\nStatistics:");
  console.log(`- Total Tests: ${testCases.length}`);
  console.log(`- Matches Expected: ${passedCount}`);
  console.log(`- Mismatches: ${failedCount}`);
  console.log(`- Success Rate: ${((passedCount / testCases.length) * 100).toFixed(2)}%`);
  console.log("====================================================\n");

  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed with CRITICAL ERROR:");
  console.error(err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});

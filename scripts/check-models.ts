import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  // The SDK doesn't have a direct listModels, but we can try to use a known one or just check the error.
  // Actually, I'll try 'gemini-1.5-flash-latest' or 'gemini-pro'.
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.0-pro'];
  
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent("test");
      console.log(`✅ ${m} works!`);
      process.exit(0);
    } catch (e: any) {
      console.log(`❌ ${m} failed: ${e.message}`);
    }
  }
}

listModels();

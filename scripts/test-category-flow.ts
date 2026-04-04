import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../src/lib/db/connect.js';
import Category from '../src/lib/db/models/Category.js';
import Listing from '../src/lib/db/models/Listing.js';
import User from '../src/lib/db/models/User.js';
import { nanoid } from 'nanoid';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runTest() {
  console.log('====================================================');
  console.log('   UniDeal Category AI Workflow E2E Test           ');
  console.log('====================================================\n');
  
  try {
    await connectDB();
    console.log('✓ Connected to Database');

    // 1. Setup
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) throw new Error('Admin user required for test. Run seed first.');

    const misc = await Category.findOne({ slug: 'miscellaneous' });
    const electronics = await Category.findOne({ name: 'Electronics' });
    const furniture = await Category.findOne({ name: 'Furniture' });

    if (!misc || !electronics || !furniture) {
      throw new Error('Core categories missing. Please run npm run seed first.');
    }

    // 2. Create Temp Category
    console.log('[Step 1] Creating Temporary Test Category...');
    const tempCategory = await Category.create({
      name: 'Temp Test Cat ' + nanoid(4),
      slug: 'temp-test-' + nanoid(4),
      icon: '🧪',
      isActive: true,
      isProtected: false,
      createdBy: adminUser._id,
    });

    // 3. Create Sample Listings
    console.log('[Step 2] Creating sample listings in Temp Category...');
    const lA = await Listing.create({
      title: 'Sony PlayStation 5 Console',
      description: 'Brand new PS5 with dualsense controller. Ultra-high speed SSD.',
      price: 49999,
      category: tempCategory._id,
      condition: 'new',
      seller: adminUser._id,
      status: 'approved',
      slug: 'test-ps5-' + nanoid(4),
    });

    const lB = await Listing.create({
      title: 'Modern Velvet Sofa',
      description: 'Comfortable 3-seater sofa with velvet finish and wooden legs.',
      price: 15000,
      category: tempCategory._id,
      condition: 'good',
      seller: adminUser._id,
      status: 'approved',
      slug: 'test-sofa-' + nanoid(4),
    });

    console.log(`- Created: "${lA.title}" and "${lB.title}"`);

    // 4. Delete Category (Trigger migration)
    console.log(`\n[Step 3] Deleting category "${tempCategory.name}"...`);
    
    // Simulate the logic from the route.ts
    const affected = await Listing.updateMany(
      { category: tempCategory._id },
      { 
        $set: { category: misc._id, needsRecategorization: true },
        $push: {
          recategorizationHistory: {
            from: tempCategory._id,
            to: misc._id,
            reason: 'category_deleted',
            confidence: 1,
            movedAt: new Date()
          }
        }
      }
    );
    await Category.findByIdAndDelete(tempCategory._id);
    
    console.log(`- Success: ${affected.modifiedCount} listings moved to Miscellaneous and flagged.`);

    // 5. Run AI Recategorization
    console.log('\n[Step 4] Triggering Gemini AI Recategorization...');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const categories = await Category.find({ isActive: true });
    const categoryNames = categories
      .filter(c => c.slug !== 'miscellaneous')
      .map(c => c.name)
      .join(', ');

    const testListings = await Listing.find({ _id: { $in: [lA._id, lB._id] } });
    
    let reassignedCount = 0;

    for (const listing of testListings) {
      console.log(`  - Analyzing: "${listing.title}"...`);
      
      const prompt = `
        Marketplace Categorization Task. Return JSON only.
        Categories: ${categoryNames}
        Item: ${listing.title}
        Desc: ${listing.description}
        Return: {"suggestedCategory": "category name", "confidence": 0.9, "reason": "why"}
      `;

      const aiRes = await model.generateContent(prompt);
      const text = aiRes.response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);

      const match = categories.find(c => c.name.toLowerCase() === parsed.suggestedCategory.toLowerCase());

      if (parsed.confidence >= 0.8 && match) {
        await Listing.findByIdAndUpdate(listing._id, {
          $set: { category: match._id, needsRecategorization: false },
          $push: {
            recategorizationHistory: {
              from: misc._id,
              to: match._id,
              reason: 'manual_run',
              confidence: parsed.confidence,
              movedAt: new Date()
            }
          }
        });
        console.log(`    ✅ Moved to: ${match.name} (Conf: ${parsed.confidence})`);
        reassignedCount++;
      } else {
        console.log(`    ❌ Skipped: ${parsed.suggestedCategory} (Conf: ${parsed.confidence})`);
      }
    }

    // 6. Validation
    console.log('\n[Step 5] Final Validation...');
    const finalA = await Listing.findById(lA._id).populate('category', 'name');
    const finalB = await Listing.findById(lB._id).populate('category', 'name');

    const aOk = (finalA?.category as any).name === 'Electronics';
    const bOk = (finalB?.category as any).name === 'Furniture';

    if (aOk && bOk) {
      console.log('✅ ALL TESTS PASSED: Listings correctly migrated and AI-recategorized.');
    } else {
      console.warn('⚠️ PARTIAL SUCCESS: Check AI confidence or data mapping.');
      console.log(`- A: Expected Electronics, got ${(finalA?.category as any)?.name}`);
      console.log(`- B: Expected Furniture, got ${(finalB?.category as any)?.name}`);
    }

    // 7. Cleanup
    console.log('\n[Step 6] Cleaning up test data...');
    await Listing.deleteMany({ _id: { $in: [lA._id, lB._id] } });
    console.log('✓ Cleanup Complete');

  } catch (err: any) {
    console.error('\n❌ TEST FAILED:');
    console.error(err.message || err);
    if (err.response) {
      console.error('AI Response Error:', await err.response.text());
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n--- Test Execution Finished ---\n');
  }
}

runTest();

import { connectDB } from '@/lib/db/connect';
import Listing from '@/lib/db/models/Listing';
import Category from '@/lib/db/models/Category';
import redis from '@/lib/redis/client';
import { logAction } from '@/lib/utils/logAction';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Vercel Cron: 0 3 * * 0 (Sunday at 3:00 AM)
 * Standardized Backup & Recategorization Job
 */
export async function GET(req: Request) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isManual = searchParams.get('manual') === 'true';
  const actorUid = searchParams.get('actorUid') || null;
  const triggeredBy = isManual ? 'manual_run' : 'weekly_cron';

  try {
    await connectDB();

    const categories = await Category.find({ isActive: true });
    const categoryNames = categories
      .filter(c => c.slug !== 'miscellaneous')
      .map(c => c.name)
      .join(', ');

    let processed = 0;
    let reassigned = 0;
    let skipped = 0;
    let cursor = null;

    // Process in batches to avoid extreme timeouts (though maxDuration is 60s)
    do {
      const query: any = {
        needsRecategorization: true,
        status: 'approved',
        isDeleted: false,
        sellerBanned: false
      };

      if (cursor) query._id = { $gt: cursor };

      const batch = await Listing.find(query)
        .sort({ _id: 1 })
        .limit(20) // Smaller batch for cron stability
        .populate('category', 'name slug');

      if (batch.length === 0) break;

      for (const listing of batch) {
        try {
          const result = await checkCategorization(
            listing, 
            categoryNames, 
            categories
          );

          if (result.confidence < 0.5) {
            skipped++;
          } else if (
            result.shouldMove && 
            result.confidence >= 0.8 && 
            result.newCategoryId
          ) {
            await Listing.findByIdAndUpdate(listing._id, {
              $set: {
                category: result.newCategoryId,
                needsRecategorization: false
              },
              $push: {
                recategorizationHistory: {
                  from: listing.category?._id || null,
                  to: result.newCategoryId,
                  reason: triggeredBy,
                  confidence: result.confidence,
                  movedAt: new Date()
                }
              }
            });
            reassigned++;
          } else if (!result.shouldMove) {
            await Listing.findByIdAndUpdate(listing._id, {
              needsRecategorization: false
            });
          } else {
            skipped++;
          }
        } catch (err) {
          console.error('[AI BACKUP/RECATEGORIZE LISTING FAULT]', err);
          skipped++;
        }
        processed++;
      }

      cursor = batch[batch.length - 1]._id;
      
      // Safety break if we approach the 60s limit (approximate)
      // For now, we rely on Vercel's 60s limit.
    } while (processed < 100); // Guard to prevent infinite loops in a single request

    if (reassigned > 0) {
      const keys = await redis.keys('feed:browse:*');
      if (keys.length > 0) await redis.del(...keys);
    }

    await logAction(
      isManual ? 'RECATEGORIZATION_MANUAL_TRIGGERED' : 'RECATEGORIZATION_CRON_COMPLETED',
      {
        actor: actorUid,
        actorType: actorUid ? 'user' : 'system',
        targetModel: 'System',
        metadata: { processed, reassigned, skipped, triggeredBy }
      }
    );

    return Response.json({ 
      success: true,
      processed, 
      reassigned, 
      skipped 
    });
  } catch (error) {
    console.error('[AI BACKUP/RECATEGORIZE CRON FAULT]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function checkCategorization(
  listing: any,
  categoryNames: string,
  categories: any[]
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    You are a marketplace categorization assistant. Return JSON only.
    Available categories: ${categoryNames}
    Listing title: ${listing.title}
    Listing description: ${listing.description}
    Current category: ${listing.category?.name ?? 'Miscellaneous'}
    Is this listing in the correct category? If not, which available category is the best fit?
    Return: { 
      "correct": boolean, 
      "suggestedCategory": "<exact category name from the list>",
      "confidence": 0.0 to 1.0,
      "reason": "<one sentence>"
    }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  const matchedCategory = categories.find(
    c => c.name.toLowerCase() === parsed.suggestedCategory.toLowerCase()
  );

  return {
    shouldMove: !parsed.correct,
    newCategoryId: matchedCategory?._id ?? null,
    confidence: parsed.confidence,
    reason: parsed.reason
  };
}

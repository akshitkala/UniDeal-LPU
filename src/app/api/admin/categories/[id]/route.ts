import { connectDB } from '@/lib/db/connect';
import Category from '@/lib/db/models/Category';
import Listing from '@/lib/db/models/Listing';
import { logAction } from '@/lib/utils/logAction';
import redis from '@/lib/redis/client';
import { withAdmin } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

export const DELETE = withAdmin(async (req, user, context) => {
  try {
    const params = await context?.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    
    await connectDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Block deletion of protected categories
    if (category.isProtected || category.slug === 'miscellaneous') {
      return NextResponse.json(
        { error: 'This category cannot be deleted' },
        { status: 400 }
      );
    }

    const miscellaneous = await Category.findOne({ slug: 'miscellaneous' });
    if (!miscellaneous) {
      return NextResponse.json(
        { error: 'Miscellaneous category not found — cannot safely delete' },
        { status: 500 }
      );
    }

    // Move all listings to miscellaneous + flag them
    const affected = await Listing.updateMany(
      { 
        category: id,
        isDeleted: false 
      },
      {
        $set: { 
          category: miscellaneous._id,
          needsRecategorization: true
        },
        $push: {
          recategorizationHistory: {
            from: id,
            to: miscellaneous._id,
            reason: 'category_deleted',
            confidence: 1,
            movedAt: new Date()
          }
        }
      }
    );

    // Delete the category
    await Category.findByIdAndDelete(id);

    // Flush cache
    await redis.del('categories:active');
    // Clear wildcard feed cache if any listings were moved or when category tree changes
    const keys = await redis.keys('feed:browse:*');
    if (keys.length > 0) await redis.del(...keys);

    // Audit log
    await logAction('CATEGORY_DELETED', {
      actor: user.uid,
      actorType: 'user',
      target: id,
      targetModel: 'Category',
      metadata: {
        categoryName: category.name,
        listingsMoved: affected.modifiedCount
      }
    });

    return NextResponse.json({
      success: true,
      listingsMoved: affected.modifiedCount
    });

  } catch (error) {
    console.error('[CATEGORY DELETE ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

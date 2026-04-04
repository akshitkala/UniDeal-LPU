import { connectDB } from '@/lib/db/connect';
import Category from '@/lib/db/models/Category';
import Listing from '@/lib/db/models/Listing';
import { logAction } from '@/lib/utils/logAction';
import redis from '@/lib/redis/client';
import { withAdmin } from '@/lib/middleware/auth';
import { deleteImages } from '@/lib/utils/cloudinary';
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

    // DB-003: Hard delete all listings under this category (Rule 166)
    const categoryListings = await Listing.find({ category: id })
    const allImages: string[] = []
    categoryListings.forEach(l => {
      if (l.images?.length) allImages.push(...l.images)
    })

    if (allImages.length > 0) {
      deleteImages(allImages).catch(err => console.error('[CASCADE] Cloudinary sweep failed:', err))
    }
    
    const affected = await Listing.deleteMany({ category: id })

    // Delete the category
    await Category.findByIdAndDelete(id);

    // Flush cache
    await redis.del('categories:active');
    // Clear wildcard feed cache if any listings were moved or when category tree changes
    const keys = await redis.keys('feed:browse:*');
    if (keys.length > 0) await redis.del(...keys);

    // Audit log
    await logAction('CATEGORY_DELETED', {
      actor: user.dbId,
      actorType: 'user',
      target: id,
      targetModel: 'Category',
      metadata: {
        categoryName: category.name,
        listingsDeleted: affected.deletedCount
      }
    });

    return NextResponse.json({
      success: true,
      listingsDeleted: affected.deletedCount
    });

  } catch (error) {
    console.error('[CATEGORY DELETE ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

**UniDeal**

Low-Level Design Document

Version 2.1  |  March 2026

# **1. Data Models**
## **1.1 User**
{ uid: String (unique, indexed)           // Firebase UID

`  `email: String (unique, indexed)          // from Google

`  `displayName: String                      // editable — defaults to email prefix

`  `photoURL: String                         // from Google

`  `role: Enum['user','admin']               // default: user

`  `isActive: Boolean                        // false = banned

`  `trustLevel: Enum['new','trusted','flagged']

`  `whatsappNumber: String (select:false)    // NEVER in any API response

`  `bio: String (optional, max 200)

`  `totalListings: Number

`  `activeListings: Number

`  `createdAt: Date, updatedAt: Date }

`  `**CRITICAL: whatsappNumber stored on User with select:false. Never in any API response. Used server-side only to build wa.me link.**

## **1.2 Listing**
{ title: String

`  `description: String

`  `price: Number

`  `negotiable: Boolean (default: false)

`  `category: ObjectId (ref: Category)

`  `condition: Enum['new','like-new','good','used','damaged']

`  `images: [String]                         // max 2 Cloudinary URLs

`  `seller: ObjectId (ref: User)

`  `sellerBanned: Boolean (default: false)   // denormalised — updated atomically on ban/unban

`  `status: Enum['pending','approved','rejected','sold','expired']

`  `isDeleted: Boolean (default: false)      // SELLER self-delete ONLY

`  `rejectionReason: String

`  `aiFlagged: Boolean (default: false)      // flagged by AI OR when AI unavailable

`  `aiUnavailable: Boolean (default: false)  // true = AI was down at submission time

`  `aiVerification: { checked, flagged, flags[], confidence, reason, checkedAt }

`  `slug: String (unique, nanoid suffix)

`  `views: Number (default: 0)

`  `bumpedAt: Date

`  `bumpCount: Number (default: 0, max: 3)

`  `lastBumpAt: Date

`  `expiresAt: Date                          // bumpedAt/createdAt + 60 days

`  `isExpired: Boolean (default: false)

`  `createdAt: Date, updatedAt: Date }

`  `**CRITICAL: Admin deletion is a HARD DELETE — Listing document removed from MongoDB + Cloudinary images purged. isDeleted is used ONLY for seller self-deletion.**

`  `**CRITICAL: MANDATORY feed filter: { status:'approved', isDeleted:false, sellerBanned:false, aiFlagged:false }**

## **1.3 Category**
{ name: String, slug: String (auto-generated), icon: String (emoji)

`  `isActive: Boolean (default: true), order: Number

`  `createdBy: ObjectId (ref: User), createdAt: Date }

## **1.4 AdminActivity (Audit Log)**
{ actor: ObjectId (nullable — null if deleted\_user)

`  `actorType: Enum['user','system','deleted\_user']

`  `target: ObjectId (refPath: targetModel)

`  `targetModel: Enum['User','Listing','Category','System']

`  `action: String

`  `metadata: Object

`  `reason: String                           // mandatory for sensitive actions

`  `ipAddress: String                        // masked in UI, real in DB

`  `timestamp: Date }

## **1.5 SystemConfig (Singleton)**
{ \_id: 'global'                            // fixed — enforces singleton

`  `approvalMode: Enum['manual','ai\_flagging','automatic']  // default: ai\_flagging

`  `maintenanceMode: Boolean (default: false)

`  `allowNewListings: Boolean (default: true)

`  `updatedBy: ObjectId, updatedAt: Date }

## **1.6 Report**
{ listing: ObjectId (ref: Listing)

`  `reportedBy: ObjectId (ref: User)

`  `reason: Enum['fake\_listing','wrong\_price','inappropriate','already\_sold','spam','other']

`  `description: String

`  `status: Enum['pending','reviewed','dismissed']

`  `reviewedBy: ObjectId, createdAt: Date }

## **1.7 ContactMessage**
{ name: String, email: String

`  `subject: Enum['bug\_report','ban\_appeal','listing\_dispute','general','other']

`  `message: String

`  `userId: ObjectId (nullable — null for guests)

`  `ipAddress: String

`  `status: Enum['open','resolved'] (default: open)

`  `createdAt: Date }

# **2. MongoDB Indexes**
`  `**CRITICAL: All indexes defined in lib/db/indexes.ts and created on first boot. No query should run without hitting an index.**

|**Collection**|**Index**|**Type**|**Purpose**|
| :- | :- | :- | :- |
|Listing|{ bumpedAt:-1, createdAt:-1 }|Compound|Browse feed primary sort — most critical|
|Listing|{ status:1, sellerBanned:1, aiFlagged:1, isDeleted:1 }|Compound|Four-condition feed visibility filter|
|Listing|{ category:1, status:1, sellerBanned:1, aiFlagged:1 }|Compound|Category filter with visibility|
|Listing|{ seller:1 }|Single|My Dashboard listings|
|Listing|{ slug:1 }|Unique|Listing detail page lookup|
|Listing|{ aiFlagged:1, aiUnavailable:1, status:1 }|Compound|Admin queue — flagged + unavailable first|
|Listing|{ expiresAt:1 }|TTL|Auto-expire documents at expiresAt|
|Listing|title + description (text)|Text|Full-text search|
|User|{ uid:1 }|Unique|Firebase UID lookup|
|User|{ email:1 }|Unique|Email lookup|
|AdminActivity|{ timestamp:-1 }|Single|Audit log sort|
|AdminActivity|{ actor:1, timestamp:-1 }|Compound|Filter audit by actor|
|Report|{ listing:1, status:1 }|Compound|Reports by listing and status|
|Category|{ order:1, isActive:1 }|Compound|Display order|
|ContactMessage|{ createdAt:-1 }|Single|Contact inbox sort|

# **3. API Endpoints**
## **3.1 Auth (Google OAuth only)**

|**Method**|**Endpoint**|**Auth**|**Description**|
| :- | :- | :- | :- |
|POST|/api/auth/login|None|Firebase Google ID token → HTTP-only JWT. Google only — no email/password path.|
|POST|/api/auth/logout|None|Clear access\_token and refresh\_token cookies|
|POST|/api/auth/refresh|Refresh cookie|Verify refresh token → issue new access JWT|

## **3.2 Listings**

|**Method**|**Endpoint**|**Auth**|**Description**|
| :- | :- | :- | :- |
|GET|/api/listings|None|Browse — cursor paginated — four-condition filter — card projection only|
|POST|/api/listings|auth + rateLimit|Create. Zod validate. WhatsApp save if needed. AI check async. Max 2 images.|
|GET|/api/listings/[slug]|None|Detail — four-condition check — no whatsappNumber in response|
|PATCH|/api/listings/[slug]|auth + ownership|Edit — seller only — Zod validate|
|DELETE|/api/listings/[slug]|auth + ownership|Soft delete (isDeleted:true) — SELLER only|
|POST|/api/listings/[slug]/contact|auth + rateLimit|Returns { waLink } only. 50/day. Number never in response.|
|POST|/api/listings/[slug]/bump|auth + ownership|7-day cooldown, max 3|
|POST|/api/listings/[slug]/report|auth + rateLimit|10/day|

## **3.3 User**

|**Method**|**Endpoint**|**Auth**|**Description**|
| :- | :- | :- | :- |
|GET|/api/user/me|auth|Current user profile — never includes whatsappNumber|
|PATCH|/api/user/me|auth|Update displayName, bio only|
|DELETE|/api/user/me|auth|Hard delete — full 8-step cascade|
|GET|/api/user/listings|auth|Own listings — cursor paginated by status tab|
|GET|/api/user/whatsapp-status|auth|Returns { hasWhatsapp: boolean } ONLY — never the number|

## **3.4 Public**

|**Method**|**Endpoint**|**Auth**|**Description**|
| :- | :- | :- | :- |
|POST|/api/contact|rateLimit (3/day/IP)|Submit contact form — save ContactMessage — Resend email to admin + auto-reply|

## **3.5 Admin**

|**Method**|**Endpoint**|**Description**|
| :- | :- | :- |
|GET|/api/admin/listings|All listings all statuses. aiFlagged + aiUnavailable sorted first. Paginated.|
|PATCH|/api/admin/listings/[id]|Approve (clears aiFlagged) / reject (mandatory reason) / hard delete (mandatory reason + Cloudinary purge)|
|GET|/api/admin/listings/[id]/contact|Admin contact — mandatory reason — returns plain number — always audit logged|
|GET|/api/admin/reports|All pending reports — paginated|
|PATCH|/api/admin/reports/[id]|Reviewed or dismissed|
|GET|/api/admin/users|User list — paginated|
|PATCH|/api/admin/users/[uid]|Ban (atomic sellerBanned update) / unban / change role / delete (cascade)|
|GET|/api/admin/activity|Full audit log — paginated — read-only|
|GET/PATCH|/api/admin/config|SystemConfig singleton|
|GET/POST|/api/admin/categories|List / create|
|GET|/api/admin/categories/[id]/check|Returns { canDelete, affectedCount } before delete|
|PATCH|/api/admin/categories/[id]|Update name, icon, order, isActive|
|POST|/api/admin/categories/[id]/reassign|Reassign all listings to targetCategoryId — then delete category|
|DELETE|/api/admin/categories/[id]|Delete — only if affectedCount:0 OR after reassign|
|DELETE|/api/admin/categories/[id]?cascade=true|Hard delete all listings in category — then delete category|
|GET|/api/admin/contacts|All ContactMessage docs — paginated|
|PATCH|/api/admin/contacts/[id]|Mark resolved|

## **3.6 Pagination Contract**
All list endpoints use cursor-based pagination. No offset pagination anywhere.

Request:  GET /api/listings?cursor=<lastId>&limit=20

Response: { data: [...], nextCursor: '<id>' | null, total: number }

- cursor: MongoDB \_id of last item in previous page
- limit: default 20, max 50 — Zod validated server-side
- nextCursor: null means no more pages
- All pagination endpoints require JWT — rate limited per user

# **4. API Response Projections**
`  `**CRITICAL: Every endpoint returns ONLY the fields needed for that view. Nothing extra. whatsappNumber is never in any response under any circumstance.**
## **4.1 Browse Feed Card**
{ \_id, title, price, negotiable, images[0], condition, category:{name,slug}, slug, bumpedAt, createdAt, seller:{displayName} }
## **4.2 Listing Detail**
{ \_id, title, description, price, negotiable, images[], condition, category:{name,slug},

`  `slug, views, bumpedAt, createdAt, status, seller:{uid,displayName,photoURL} }

whatsappNumber excluded at schema level via select:false — cannot be accidentally included.
## **4.3 Contact Reveal Response**
{ waLink: 'https://wa.me/91XXXXXXXXXX' }

Phone number is never in this response. The wa.me link is constructed server-side from User.whatsappNumber.
## **4.4 My Dashboard Card**
{ \_id, title, price, images[0], status, bumpedAt, lastBumpAt, bumpCount, expiresAt, createdAt, slug }
## **4.5 GET /api/user/me**
{ uid, email, displayName, photoURL, role, isActive, bio, totalListings, activeListings, createdAt }

whatsappNumber NOT included — use /api/user/whatsapp-status for boolean check only.

# **5. Zod Validation Schemas**
## **5.1 Create Listing**
z.object({

`  `title:          z.string().min(3).max(100),

`  `description:    z.string().min(10).max(2000),

`  `price:          z.number().positive().max(999999),

`  `negotiable:     z.boolean().default(false),

`  `category:       z.string().regex(/^[a-f0-9]{24}$/),

`  `condition:      z.enum(['new','like-new','good','used','damaged']),

`  `whatsappNumber: z.string().regex(/^[6-9]\d{9}$/).optional(),

`  `// required server-side if User.whatsappNumber not set

})

## **5.2 Browse Query**
z.object({

`  `category:  z.string().regex(/^[a-f0-9]{24}$/).optional(),

`  `condition: z.enum(['new','like-new','good','used','damaged']).optional(),

`  `minPrice:  z.coerce.number().optional(),

`  `maxPrice:  z.coerce.number().optional(),

`  `sort:      z.enum(['newest','oldest','price\_asc','price\_desc','views']).default('newest'),

`  `cursor:    z.string().optional(),

`  `limit:     z.coerce.number().min(1).max(50).default(20),

`  `q:         z.string().max(100).transform(s => s.replace(/[<>'"`;]/g,'')).optional(),

})

## **5.3 Contact Form**
z.object({

`  `name:    z.string().min(2).max(80),

`  `email:   z.string().email(),

`  `subject: z.enum(['bug\_report','ban\_appeal','listing\_dispute','general','other']),

`  `message: z.string().min(10).max(1000),

})

# **6. Client-Side Validation & Sanitisation**
`  `**CRITICAL: Validated AND sanitised before any fetch call. Server Zod validation is independent — client validation is UX, server validation is security.**

// lib/utils/validate.ts

export const sanitizeText = (s: string) =>

`  `s.replace(/<[^>]\*>/g, '')      // strip all HTML tags

.replace(/[<>"'`;]/g, '')    // strip injection-relevant chars

.trim();

export const validators = {

`  `title: (v) => { const s = sanitizeText(v); if(s.length<3) return 'Min 3 chars'; if(s.length>100) return 'Max 100 chars'; return null; },

`  `description: (v) => { const s = sanitizeText(v); if(s.length<10) return 'Min 10 chars'; if(s.length>2000) return 'Max 2000 chars'; return null; },

`  `price: (v) => (!Number.isFinite(v)||v<=0) ? 'Invalid price' : v>999999 ? 'Price too high' : null,

`  `whatsapp: (v) => /^[6-9]\d{9}$/.test(v) ? null : 'Enter valid 10-digit Indian number',

`  `username: (v) => /^[a-zA-Z0-9.\_]{2,50}$/.test(v) ? null : 'Invalid username',

`  `searchQuery: (v) => encodeURIComponent(sanitizeText(v).slice(0, 100)),

};

# **7. Image Compression**
// lib/utils/compressImage.ts

import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {

`  `return imageCompression(file, {

`    `maxSizeMB: 1,

`    `maxWidthOrHeight: 800,

`    `useWebWorker: true,

`    `fileType: 'image/jpeg',

`    `initialQuality: 0.8,

`  `});

}

// Before upload: const compressed = await Promise.all(files.map(compressImage));

# **8. AI Check Implementation**
`  `**CRITICAL: If AI is unavailable: listing is flagged (aiFlagged:true, aiUnavailable:true) and sent to admin queue. Never auto-approved.**

// lib/ai/checkListing.ts — fires after save, non-blocking

try {

`  `const results = await Promise.allSettled([

`    `checkCategoryMismatch(listing),  // Gemini 1.5 Flash

`    `checkImages(listing.images),      // Cloudinary moderation result

`    `checkSpamKeywords(listing),       // Rule-based — synchronous

`  `]);

`  `// aggregate confidence — if > 0.8: aiFlagged = true

} catch (err) {

`  `// AI unavailable — ALWAYS flag, never pass

`  `await Listing.findByIdAndUpdate(listing.\_id, {

`    `aiFlagged: true, aiUnavailable: true,

`    `'aiVerification.reason': 'AI service unavailable at submission'

`  `});

}

# **9. Ban — Atomic Transaction**
`  `**CRITICAL: On ban: User.isActive=false + bulk update all seller listings: sellerBanned=true (atomic transaction). Redis cache flushed immediately.**

const session = await mongoose.startSession();

session.startTransaction();

try {

`  `await User.findOneAndUpdate({ uid }, { isActive: false }, { session });

`  `await Listing.updateMany({ seller: userId }, { sellerBanned: true }, { session });

`  `await session.commitTransaction();

`  `await redis.del('feed:browse:\*');  // flush all feed cache

`  `await sendBanEmail(user.email, reason);

`  `await logAction('USER\_BANNED', { actor, target: userId, reason });

} catch (e) { await session.abortTransaction(); throw e; }

# **10. Category Deletion Logic**
// Step 1: check

GET /api/admin/categories/[id]/check

→ { canDelete: boolean, affectedCount: number }

// Step 2a: reassign path

await Listing.updateMany({ category: srcId }, { $set: { category: tgtId } });

await Category.findByIdAndDelete(srcId);

await redis.del(['categories:active','feed:browse:\*']);

// Step 2b: cascade delete path (requires typed DELETE confirmation)

const listings = await Listing.find({ category: categoryId });

for (const l of listings) {

`  `await cloudinary.api.delete\_resources(l.images.map(getPublicId));

}

await Listing.deleteMany({ category: categoryId });

await notifyAffectedSellers(listings, 'category\_deleted');

await Category.findByIdAndDelete(categoryId);

await redis.del(['categories:active','feed:browse:\*']);

# **11. Environment Variables — 17 Total**

|**Variable**|**Service**|**Purpose**|
| :- | :- | :- |
|MONGODB\_URI|MongoDB Atlas|Database connection string|
|NEXT\_PUBLIC\_FIREBASE\_API\_KEY|Firebase|Client-side Firebase init|
|NEXT\_PUBLIC\_FIREBASE\_AUTH\_DOMAIN|Firebase|Client-side Firebase init|
|NEXT\_PUBLIC\_FIREBASE\_PROJECT\_ID|Firebase|Client-side Firebase init|
|FIREBASE\_ADMIN\_CLIENT\_EMAIL|Firebase Admin|Server-side Google token verification|
|FIREBASE\_ADMIN\_PRIVATE\_KEY|Firebase Admin|Server-side Google token verification|
|JWT\_SECRET|Auth|Sign access tokens (15m TTL)|
|REFRESH\_SECRET|Auth|Sign refresh tokens (7d TTL)|
|CLOUDINARY\_CLOUD\_NAME|Cloudinary|Image upload + moderation|
|CLOUDINARY\_API\_KEY|Cloudinary|Image upload + moderation|
|CLOUDINARY\_API\_SECRET|Cloudinary|Image upload + moderation|
|RESEND\_API\_KEY|Resend|Transactional email + contact form|
|UPSTASH\_REDIS\_REST\_URL|Upstash|Rate limiting + read cache|
|UPSTASH\_REDIS\_REST\_TOKEN|Upstash|Rate limiting + read cache|
|GEMINI\_API\_KEY|Google AI|AI category mismatch detection|
|SENTRY\_DSN|Sentry|Error tracking|
|CRON\_SECRET|Vercel Cron|Authenticate scheduled jobs|

# **12. Audit Log — All Tracked Actions**

|**Category**|**Actions**|
| :- | :- |
|Auth|USER\_REGISTERED, USER\_LOGIN, USER\_DELETED\_ACCOUNT|
|Listings|LISTING\_CREATED, LISTING\_APPROVED, LISTING\_REJECTED (+reason), LISTING\_HARD\_DELETED (+reason), LISTING\_SOLD, LISTING\_BUMPED, LISTING\_EXPIRED, LISTING\_AI\_FLAGGED, LISTING\_AI\_UNAVAILABLE\_FLAGGED, LISTING\_REPORTED|
|Contact|CONTACT\_REVEALED (+mandatory reason, admin only)|
|Admin — users|USER\_BANNED (+reason), USER\_UNBANNED, ROLE\_CHANGED, USER\_DELETED (+reason)|
|Admin — content|CATEGORY\_CREATED, CATEGORY\_UPDATED, CATEGORY\_DELETED, CATEGORY\_LISTINGS\_REASSIGNED, CATEGORY\_LISTINGS\_CASCADE\_DELETED, REPORT\_REVIEWED, REPORT\_DISMISSED|
|System|APPROVAL\_MODE\_CHANGED, MAINTENANCE\_TOGGLED, NEW\_LISTINGS\_TOGGLED, BACKUP\_COMPLETED, BACKUP\_FAILED|
|Contact form|CONTACT\_FORM\_SUBMITTED, CONTACT\_RESOLVED|

UniDeal LLD v2.1    |    Page 

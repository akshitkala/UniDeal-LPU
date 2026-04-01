**UniDeal**

High-Level Design Document

Version 2.1  |  March 2026

# **1. System Overview**
UniDeal is a serverless, edge-deployed web application. All compute runs on Vercel's serverless functions. No dedicated servers, no containers, no infrastructure cost at campus launch scale. The system is decomposed into five clearly bounded layers.

|**Layer**|**Technology**|**Responsibility**|
| :- | :- | :- |
|Presentation|Next.js 14 App Router + RSC|Pages, UI components, client state, routing, client-side validation|
|API|Next.js Route Handlers (/api/)|REST endpoints, Zod validation, auth middleware, rate limiting|
|Business Logic|Server-side TypeScript modules|Listing lifecycle, bump rules, AI checks, email triggers, ban cascade|
|Data|MongoDB Atlas M0 + Mongoose|Persistent storage, indexed queries, 7 document models|
|Cache|Upstash Redis|Rate limiting + read cache (browse feed, listing detail, categories)|
|External Services|Firebase, Cloudinary, Resend, Gemini, Sentry|Auth (Google only), images, email, AI moderation, monitoring|

# **2. Authentication Architecture**
`  `**CRITICAL: Google OAuth is the ONLY authentication method. Email/password does not exist. No password reset flow.**
## **2.1 Dual-Token Strategy**

|**Token**|**TTL**|**Storage**|**Purpose**|
| :- | :- | :- | :- |
|Access JWT|15 minutes|HTTP-only cookie, SameSite=Strict, Secure|Verified on every protected request. Short TTL limits exposure.|
|Refresh JWT|7 days|HTTP-only cookie, SameSite=Strict, Secure|Silent refresh before expiry. User never re-authenticates.|
|Firebase ID Token|1 hour|Memory only — never stored|Used once at login to exchange for custom JWT. Never persisted.|

## **2.2 Login Flow**
- User authenticates with Firebase via Google OAuth — the only method
- Client receives Firebase ID token (1hr TTL)
- Client POSTs { firebaseIdToken } to /api/auth/login
- Server verifies token via Firebase Admin SDK
- Server looks up or creates User in MongoDB by uid — sets displayName from email prefix if new
- Server issues access JWT (15m) + refresh JWT (7d) as HTTP-only cookies
- Server returns { user: { uid, email, role, displayName } } — never includes whatsappNumber

# **3. Component Boundaries**
## **3.1 Main Application**
- Navbar: logo, search bar, profile dropdown — on every page
- Homepage: hero, how-it-works, 20 listing cards, CTA section, footer
- Browse page: filter bar, listing grid, cursor-based pagination
- Listing detail: max 2 images, full metadata, sticky contact button
- Post listing modal: 2-step wizard, client-side state, no dedicated route, WhatsApp collection if needed
- My Dashboard: seller's own listings by status tab
- Profile page: username, bio, delete account — 'Admin Panel' button for admin-role users only
- Contact page (/contact): form for complaints and ban appeals — all users
- Privacy Policy page (/privacy): static — linked in footer

## **3.2 Admin Panel (Isolated)**
- Completely separate UI context — own layout, own sidebar
- Single entry point: 'Admin Panel' button on profile page
- Shares auth session — no re-login
- All /admin/\* routes protected by admin middleware — 403 for non-admins
- 8 screens: Overview, Moderation Queue, Reports, Users, Categories, Audit Log, Settings, Contact Inbox

# **4. Core Data Flows**
## **4.1 Browse Feed Request**
- Client: GET /api/listings?category=&condition=&sort=&cursor=&q=
- Redis check: feed:browse:{filters\_hash} — TTL 60s — cache hit returns immediately
- Cache miss: MongoDB query with compound index { bumpedAt:-1, createdAt:-1 }

`  `**CRITICAL: MANDATORY feed filter on every browse/search/profile query: { status:'approved', isDeleted:false, sellerBanned:false, aiFlagged:false }**

- Projection: card fields only — title, price, images[0], condition, category, slug, bumpedAt, negotiable
- Cursor-based pagination — nextCursor returned with response
- Result written to Redis — response returned

## **4.2 Create Listing Flow**
- Client validates all fields + sanitises inputs before submitting FormData
- POST /api/listings — Zod re-validates server-side — rejects malformed requests
- Server checks /api/user/whatsapp-status — if no number saved and number submitted: saved to User.whatsappNumber (select:false)
- Images: client-compressed → uploaded to Cloudinary (quality:auto, moderation:aws\_rek)
- Listing saved: status:pending, aiFlagged:false, aiUnavailable:false, sellerBanned:false
- Server responds 201 { slug } — user sees 'Under review'
- Background job (fire-and-forget): Gemini check + Cloudinary moderation result + keyword filter

`  `**CRITICAL: If AI is unavailable: listing is flagged (aiFlagged:true, aiUnavailable:true) and sent to admin queue. Never auto-approved.**

- If confidence > 0.8: aiFlagged:true — listing floats to top of admin queue
- AI-flagged listings never appear in public feed

## **4.3 Contact Reveal Flow**
- Logged-in user taps 'Contact Seller'
- POST /api/listings/[slug]/contact with JWT cookie
- auth middleware: verify JWT → 401 if invalid
- rateLimit: INCR contact:{uid} in Redis, EXPIRE 86400 — if > 50: return 429
- Server fetches listing with +select whatsappNumber from User model (explicit override of select:false)
- Constructs wa.me URL server-side — returns { waLink } only — number never in response
- CONTACT\_REVEALED logged to AdminActivity
- Client: window.open(waLink) — number never touches the DOM

## **4.4 Admin Moderation Flow**
- GET /api/admin/listings?status=pending — query sorted: aiFlagged desc, aiUnavailable desc, createdAt asc
- AI-flagged + aiUnavailable listings surface at top with reason
- Approve: status:approved, aiFlagged:false — Redis browse cache flushed — logged
- Reject: status:rejected, rejectionReason saved — email to seller — logged

`  `**CRITICAL: Admin delete = HARD DELETE: listing document removed from MongoDB + Cloudinary images purged + email to seller — logged**

`  `*Note: Soft delete (isDeleted:true) is ONLY for seller self-deletion from My Dashboard*

## **4.5 Ban User Flow**
`  `**CRITICAL: On ban: User.isActive=false + bulk update all seller listings: sellerBanned=true (atomic transaction). Redis cache flushed immediately.**

- MongoDB transaction: User.isActive=false + Listing.updateMany({ seller:userId }, { sellerBanned:true })
- Redis browse cache flushed — banned user's listings disappear from all feeds instantly
- Ban email sent via Resend with mandatory reason + /contact link
- Banned user's next login attempt: auth middleware checks isActive → 401 if false

## **4.6 Category Deletion Flow**
- Admin triggers delete → GET /api/admin/categories/[id]/check → { canDelete, affectedCount }
- If canDelete:true (no listings): simple Confirm Modal → delete
- If canDelete:false: Conflict Resolution Modal → Option A (reassign) or Option B (cascade delete)
- Option A: bulk update listings.category → delete category → log CATEGORY\_LISTINGS\_REASSIGNED
- Option B: hard delete all listings + purge Cloudinary + email affected sellers → delete category → log CATEGORY\_LISTINGS\_CASCADE\_DELETED
- Redis categories + browse cache flushed after either path

## **4.7 Account Deletion Cascade**
- DELETE /api/user/me (or admin delete) triggers full cascade
- 1. Hard delete all listings — purge Cloudinary images for each
- 2. Anonymise AdminActivity: actor:null, actorType:deleted\_user
- 3. Delete all Report documents by this user
- 4. Delete all ContactMessage documents by this user
- 5. Delete MongoDB User document
- 6. Delete Firebase account via Admin SDK
- 7. Clear all session cookies
- 8. Send account deleted confirmation email via Resend

# **5. Caching Strategy**

|**Route**|**Strategy**|**TTL**|**Invalidated When**|
| :- | :- | :- | :- |
|Browse feed|Redis cache|60s|Any listing approved, hard-deleted, sold, expired, or ban state changes|
|Listing detail|Redis cache|30s|That specific listing is updated|
|Categories|Redis cache|300s|Any category added, hidden, reordered, or deleted|
|Search results|No cache — dynamic|—|User-specific, must be fresh|
|My Dashboard|No cache — dynamic|—|Real-time accuracy required|
|Admin queue|No cache — dynamic|—|Real-time moderation state|
|Admin config|No cache — dynamic|—|Mode switches must be instant|
|Rate limit counters|Redis TTL|86400s|Auto-expiry|

# **6. Rate Limiting**

|**Endpoint**|**Limit**|**Window**|**What Happens**|
| :- | :- | :- | :- |
|Login|10 requests|Per hour|429 — brute force protection|
|Post listing|5 requests|Per day|429 — spam listing protection|
|Contact reveal|50 requests|Per day|429 — 'Daily limit reached. Try again tomorrow'|
|Report listing|10 requests|Per day|429 — report bombing protection|
|Admin actions|20 requests|Per minute|429 — log poisoning protection|
|Contact form submit|3 requests|Per day per user/IP|429 — abuse protection|
|Bump listing|1 request|Per 7 days per listing|400 — app logic + DB field|
|Browse / search|Unlimited|—|Vercel edge handles DDoS — Redis cache absorbs load|

# **7. Middleware Chain**

|**Step**|**Middleware**|**Action**|**Applied To**|
| :- | :- | :- | :- |
|1|auth|Verify JWT from HTTP-only cookie. Attach req.user. Return 401 if invalid.|All protected routes|
|2|admin|Check req.user.role==='admin'. Return 403 if not.|All /api/admin/\* routes|
|3|ownership|Check listing.seller===req.user.uid. Return 403 if not.|PATCH, DELETE /api/listings/[slug]|
|4|rateLimit|Check Upstash Redis counter. Return 429 if over limit.|Contact, post listing, report, contact form|
|5|reason|Require reason field in body. Return 400 if missing.|Admin reject, hard delete, ban, contact reveal|

# **8. External Services**

|**Service**|**Purpose**|**Free Limit**|**Upgrade Trigger**|
| :- | :- | :- | :- |
|MongoDB Atlas M0|Primary database|512MB / ~150K listings|M2 ~$9/mo above 150K listings|
|Firebase Auth|Google OAuth identity|10K users/month|Blaze pay-per-use above 10K|
|Cloudinary|Image upload, compression, moderation|25GB storage + BW|Plus $89/mo above 20GB|
|Resend|Transactional email + contact form|3K emails/month|Pro $20/mo above 2.5K|
|Upstash Redis|Rate limiting + read cache|10K req/day|Pay-as-you-go above limit|
|Gemini 1.5 Flash|AI category mismatch detection|1M tokens/month|Paid tier if volume grows|
|Sentry|Error tracking, P95 monitoring|Free hobby plan|Team plan if team grows|
|Vercel|Hosting, serverless, CDN, cron|100GB BW/month|Pro $20/mo at high traffic|

# **9. Deployment & Cron**
## **9.1 Vercel**
- Git push to main → automatic deployment
- Environment variables in Vercel dashboard — never committed to repo
- Region: ap-south-1 (Mumbai) — same as MongoDB Atlas for low latency
- Preview deployments on every pull request

## **9.2 Cron Jobs**

|**Job**|**Schedule**|**Purpose**|
| :- | :- | :- |
|Listing expiry|0 2 \* \* \* (2am daily)|Set isExpired:true on listings past expiresAt. Send expiry email to seller. Flush cache.|
|AI retry queue|\*/30 \* \* \* \* (every 30m)|Retry AI checks on listings where aiVerification.checked:false.|
|Data backup|0 3 \* \* 0 (3am Sunday)|Export MongoDB collections to JSON — commit to private GitHub repo.|

`  `*Note: All cron routes validate CRON\_SECRET header — return 401 if missing or wrong.*

# **10. Performance Targets**

|**Metric**|**Target**|**Strategy**|
| :- | :- | :- |
|Browse feed P95|< 800ms|Redis cache + compound index + card projection only|
|Listing detail P95|< 600ms|Redis cache (30s TTL) + full projection minus sensitive fields|
|Contact reveal P95|< 300ms|Redis rate check + single indexed User lookup|
|Post listing P95|< 2s|Client-side compression + Cloudinary async + Zod sync|
|Admin queue P95|< 500ms|Compound index on aiFlagged + aiUnavailable + status|
|Search results P95|< 1s|Full-text index on title + description|
|MongoDB connections|< 10 active|Global Mongoose connection cache across invocations|

UniDeal HLD v2.1    |    Page 

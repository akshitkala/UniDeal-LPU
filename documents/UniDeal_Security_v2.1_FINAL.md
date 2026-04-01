**UniDeal**

Security Rules Document

Version 2.1  |  March 2026

# **1. WhatsApp Number Protection**
`  `**CRITICAL: The most critical security requirement. The seller's WhatsApp number must never appear in any API response, any DOM element, or any client-side variable.**

- User.whatsappNumber has Mongoose select:false — physically excluded from every standard query
- The /contact endpoint fetches the number with explicit +select override — server-side only
- The wa.me deep link is constructed entirely on the server
- The response to the client contains { waLink } only — the number is never present
- window.open(waLink) fires on the client — the user reaches WhatsApp without ever seeing the number
- Admin contact reveal: separate endpoint /api/admin/listings/[id]/contact — mandatory reason — returns plain number for admin display only — always audit logged
- No sellerEmail stored or returned — removed from schema entirely

# **2. Authentication Security**
`  `**CRITICAL: Google OAuth is the ONLY authentication method. No email/password, no password reset flow, no email verification gate.**
## **2.1 Token Properties**

|**Token**|**TTL**|**Storage**|**Security Properties**|
| :- | :- | :- | :- |
|Access JWT|15 minutes|HTTP-only cookie|SameSite=Strict. Secure. Short TTL limits exposure window.|
|Refresh JWT|7 days|HTTP-only cookie|SameSite=Strict. Secure. Used only for access token renewal.|
|Firebase ID Token|1 hour|Memory only|Used once at login. Never stored. Verified server-side.|

## **2.2 Session Behaviour**
- All cookies: HttpOnly=true, Secure=true, SameSite=Strict
- On logout: both cookies cleared server-side immediately
- On ban: User.isActive=false — auth middleware rejects login — 401 returned — banned user cannot get a JWT
- On account deletion: Firebase account deleted → cookies cleared → session terminated
- Silent refresh: new access JWT issued before expiry — user never sees re-auth

## **2.3 Role Enforcement**
- Role stored in JWT payload — checked on every request by admin middleware
- admin middleware on every /api/admin/\* route — 403 if role !== 'admin'
- Role changes require Confirm Modal — logged to AdminActivity immediately
- No super\_admin role — reduces attack surface

# **3. Input Validation & Injection Protection**
`  `**CRITICAL: All user inputs are validated AND sanitised on the client side before any API request is made. Server Zod validation is a second, independent layer.**

|**Layer**|**Where**|**What It Does**|
| :- | :- | :- |
|Client-side sanitisation|Browser — before fetch|Strip HTML tags (</>), block script patterns, trim whitespace. Reject invalid formats inline.|
|Client-side validation|Browser — on blur + submit|Format checks, length checks, regex checks. Prevent invalid data reaching the network.|
|Zod schema validation|Server — before any DB operation|Re-validate all fields regardless of client. Reject with 400 + field errors if invalid.|
|ObjectId validation|Server|All ObjectId fields validated as 24-char hex before any DB query.|
|NoSQL injection prevention|Server|Zod rejects non-string types where strings expected. No $where or operator injection possible.|
|Search query sanitisation|Both|Special regex chars escaped client-side + Zod max-length + transform server-side.|

# **4. Feed Visibility — Four-Condition Filter**
`  `**CRITICAL: EVERY browse/search/public-profile query must include ALL four conditions. Missing any one is a security and UX bug.**

const feedFilter = {

`  `status: 'approved',

`  `isDeleted: false,       // not seller-deleted

`  `sellerBanned: false,    // seller not banned

`  `aiFlagged: false,       // not AI-flagged or AI-unavailable

};

sellerBanned is denormalised onto Listing for query performance — no join needed. Updated atomically when user is banned or unbanned.

# **5. Rate Limiting**
All rate limits enforced via Upstash Redis — consistent across all serverless instances. In-memory counters fail across Vercel invocations.

|**Endpoint**|**Limit**|**Window**|**Enforcement**|
| :- | :- | :- | :- |
|Login|10 requests|Per hour|Redis counter — brute force protection|
|Post listing|5 requests|Per day|Redis counter — spam listing protection|
|Contact reveal|50 requests|Per day|Redis counter — core contact protection|
|Report listing|10 requests|Per day|Redis counter — report bombing protection|
|Admin actions|20 requests|Per minute|Redis counter — log poisoning protection|
|Contact form|3 requests|Per day per user/IP|Redis counter — abuse protection|
|Bump listing|1 request|Per 7 days per listing|App logic + DB field — not Redis|
|Browse / search|Unlimited|—|Vercel edge DDoS protection + Redis cache absorbs load|

# **6. File Upload Security**
## **6.1 Three-Layer Validation**
- Layer 1 — Client: size check before upload (5MB per image, 10MB total for 2 images) — UX only
- Layer 2 — Server: Next.js config hard limit enforced before processing
- Layer 3 — Cloudinary: final hard limit + magic byte MIME validation

## **6.2 MIME & Format Validation**
- Magic byte validation server-side — file extension alone is never trusted
- Accepted types: JPEG, PNG, WebP only — all others rejected
- Extension spoofing: a .jpg file with non-JPEG magic bytes is rejected
- Client-side compression normalises all uploads to JPEG before they reach the server

## **6.3 Image Compression as Security**
- Client-side compression (max 800px, quality 0.8) reduces payload size and strips EXIF metadata
- Cloudinary further compresses and re-encodes — eliminates embedded metadata threats

# **7. HTTP Security Headers**
Set in next.config.ts — applied to every response automatically.

|**Header**|**Value**|**Protection**|
| :- | :- | :- |
|X-Frame-Options|DENY|Prevents clickjacking via iframes|
|X-Content-Type-Options|nosniff|Prevents MIME type sniffing attacks|
|Referrer-Policy|strict-origin-when-cross-origin|Limits referrer data leakage|
|Content-Security-Policy|Configured per Next.js docs|XSS and injection protection|
|Strict-Transport-Security|max-age=31536000; includeSubDomains|Forces HTTPS — prevents downgrade attacks|

# **8. Admin Security**
- Admin panel at /admin/\* — completely isolated from main app
- Only entry: single 'Admin Panel' button on profile page for admin-role users
- admin middleware on every /api/admin/\* request — role checked every time — never cached
- Non-admin navigating to /admin/\* directly: 403 + redirect to home

`  `**CRITICAL: No browser alert() or confirm() anywhere. All destructive/serious actions use an inline Confirm Modal with explicit confirmation button and optional Cancel.**

- Mandatory reason for: ban, reject listing, hard delete listing, role change, contact reveal
- Every admin action logged to AdminActivity: actor, target, action, reason, masked IP, timestamp
- Audit log is read-only — no admin can delete or edit any entry

# **9. Ban System**
## **9.1 Ban Flow**
`  `**CRITICAL: On ban: User.isActive=false + bulk update all seller listings: sellerBanned=true (atomic transaction). Redis cache flushed immediately.**

- Mandatory reason dropdown — cannot ban without selecting a reason
- Reason options: Fake or spam listings / Inappropriate content / Abusive behaviour / Suspicious account activity / Repeated policy violations / Other (free text)
- User.isActive=false + all Listing.sellerBanned=true — single MongoDB transaction
- Redis browse cache flushed — listings disappear from all feeds instantly
- Banned user's next login: auth middleware checks isActive → 401 — cannot obtain JWT
- Ban email sent via Resend: reason + /contact link for appeal

## **9.2 Unban Flow**
- Admin unbans: User.isActive=true + Listing.sellerBanned=false (same atomic pattern)
- Redis cache flushed — listings immediately visible again
- Logged to AdminActivity

# **10. Admin Deletion — Hard Delete**
`  `**CRITICAL: Admin deletion of a listing is a HARD DELETE. Document removed from MongoDB, Cloudinary images purged, seller emailed with reason.**

- 1. Cloudinary: delete\_resources() called for all listing images
- 2. MongoDB: Listing.findByIdAndDelete() — document permanently removed
- 3. Resend: deletion email to seller with mandatory reason + /contact link
- 4. AdminActivity: LISTING\_HARD\_DELETED logged with actor, reason, metadata

`  `*Note: Seller self-deletion (My Dashboard → Delete) is a soft delete: isDeleted:true. The document is retained. Admin deletion is irreversible.*

# **11. GDPR-Correct Account Deletion**
Hard delete — not soft. Full cascade on self-deletion or admin-triggered deletion.

|**Step**|**Action**|**Why**|
| :- | :- | :- |
|1|Hard delete all listings + purge Cloudinary images|Complete removal of user content|
|2|Anonymise AdminActivity: actor:null, actorType:deleted\_user|Audit integrity preserved, identity removed|
|3|Delete all Report documents by this user|Removes reporting associations|
|4|Delete all ContactMessage documents by this user|Removes contact history|
|5|Delete MongoDB User document|Primary record removed|
|6|Delete Firebase account via Admin SDK|Identity provider record removed|
|7|Clear all session cookies (access\_token, refresh\_token)|Session terminated immediately|
|8|Send account deleted confirmation email|User confirmation of data removal|

# **12. AI Moderation Security**
`  `**CRITICAL: If AI is unavailable: listing is flagged (aiFlagged:true, aiUnavailable:true) and sent to admin queue. Never auto-approved.**

- AI checks run silently in background — user never sees AI reasoning — no adversarial surface
- AI unavailability is treated as a flag, not a pass — prevents gaming via triggering AI downtime
- Admin sees: confidence score, flag reason, aiUnavailable flag in queue
- Approval always requires a human admin action — AI can flag but never auto-reject or auto-delete

# **13. DDoS & Abuse Protection**
- Vercel Edge Network: free DDoS protection and global CDN for all static assets
- Redis cache: browse/search served from cache on hit — database not touched
- MongoDB connection pooling: global Mongoose cache prevents connection exhaustion on M0
- All list endpoints paginated — no unbounded queries — no full collection scans
- Contact form rate limit: 3/day/IP — prevents spam to admin inbox

# **14. Observability & Monitoring**
- Sentry: all uncaught exceptions in API routes and server components
- Sentry: custom captureException on AI check failures and Cloudinary errors
- Sentry: P95 API response time tracking per route
- Sentry alert: error rate > 5% in any 5-minute window
- Admin audit log: searchable, paginated, all platform events, read-only
- Vercel logs: serverless function execution for debugging
UniDeal Security v2.1    |    Page 

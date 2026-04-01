**UniDeal**

Build Order — 6 Phases + Testing

Version 2.1  |  March 2026

|**Phase**|**Name**|**Duration**|**Deliverable**|
| :- | :- | :- | :- |
|1|Foundation & Infrastructure|Week 1|Repo, env, DB, auth (Google only), seed data|
|2|Core Listing System|Week 2|Browse (4-condition filter), detail, post (2 images), edit, soft delete|
|3|User Features & Contact Flow|Week 3|Dashboard, contact reveal, bump, report, WhatsApp collection|
|4|Admin Panel|Week 4|Isolated admin — full moderation suite, hard delete, ban cascade|
|5|AI, Email, Contact Page & Cron|Week 5|AI checks (flag on unavailable), emails, contact form, expiry cron|
|6|Security, Polish & Launch|Week 6|Headers, validation, compression, privacy policy, pagination audit, deploy|

`  `**PHASE 1: FOUNDATION & INFRASTRUCTURE  |  Week 1**
### **1.1 Day 1 — Repository Setup**
- Initialise Next.js 14 with TypeScript and App Router
- Install Tailwind CSS, shadcn/ui, browser-image-compression, zod
- Create .env.example with all 17 variable names (empty values) — commit this FIRST
- Create .env.local with real values — add to .gitignore immediately
- Set up ESLint, Prettier, TypeScript strict mode
- Create folder structure as defined in LLD section 6
- Push to GitHub — connect to Vercel — set region to ap-south-1

### **1.2 Day 2 — External Service Setup**
- MongoDB Atlas: create M0 cluster in ap-south-1 — whitelist 0.0.0.0/0
- Firebase: create project — enable Google OAuth ONLY — disable Email/Password — download Admin SDK JSON
- Cloudinary: create account — enable aws\_rek moderation add-on
- Resend: create account — verify domain — get API key
- Upstash: create Redis in ap-south-1 — get REST URL + token
- Sentry: create Next.js project — run wizard — get DSN
- Google AI Studio: get Gemini API key — no billing required

### **1.3 Day 3 — Database Layer**
- Implement lib/db/connect.ts — cached Mongoose connection (global pattern)
- Create all 7 Mongoose models: User, Listing, Category, AdminActivity, SystemConfig, Report, ContactMessage
- Implement lib/db/indexes.ts — all 15 indexes from LLD section 2 — createIndexes() on boot
- Verify: User.whatsappNumber has select:false from day one

### **1.4 Day 4 — Authentication (Google Only)**
- Set up Firebase client — Google OAuth ONLY — do not enable Email/Password provider
- Set up Firebase Admin SDK for server-side token verification
- Implement JWT issuance: access (15m) + refresh (7d) as HTTP-only cookies (SameSite=Strict)
- Build /api/auth/login — verifies Firebase Google ID token → issue JWTs
- Build /api/auth/logout — clear both cookies
- Build /api/auth/refresh — verify refresh token → new access JWT
- auth middleware: reads cookie, verifies JWT, checks isActive (banned users get 401), attaches req.user
- admin middleware: checks req.user.role === 'admin'

### **1.5 Day 5 — Seed & Verify**
- seed/categories.ts — 6 default categories
- seed/adminUser.ts — set first Google login user to admin role
- seed/listings.ts — 20 sample listings (max 2 images each) for homepage
- Verify auth flow end-to-end: Google login → JWT issued → protected route accessible

|**Phase 1 Test**|**Expected Result**|**Pass?**|
| :- | :- | :- |
|MongoDB connection pooling|Global cache — single connection per invocation|[ ]|
|All 7 models save correctly|Correct shape in Atlas|[ ]|
|All 15 indexes created|getIndexes() confirms all|[ ]|
|User.whatsappNumber hidden|GET /api/user/me response has no whatsappNumber field|[ ]|
|Google OAuth login|Firebase Google token → custom JWT → HTTP-only cookie set|[ ]|
|Email/Password login attempt|Should fail — provider not enabled in Firebase|[ ]|
|Logout|Both cookies cleared — protected route returns 401|[ ]|
|Token refresh|New access JWT issued from refresh token|[ ]|
|Banned user login|isActive:false → JWT not issued → 401|[ ]|
|Admin middleware|Non-admin gets 403 on /api/admin/\*|[ ]|
|Seed data|20 listings + 6 categories in Atlas — max 2 images each|[ ]|

`  `**PHASE 2: CORE LISTING SYSTEM  |  Week 2**
### **2.1 Browse & Search API**
- GET /api/listings — Zod query validation — cursor pagination — MANDATORY four-condition filter: { status:'approved', isDeleted:false, sellerBanned:false, aiFlagged:false }
- Redis cache: feed:browse:{filters\_hash} — 60s TTL
- Full-text search: MongoDB text index on title + description
- Sort: newest, oldest, price\_asc, price\_desc, views
- Card projection only: title, price, images[0], condition, category, slug, bumpedAt, negotiable

### **2.2 Listing Detail API**
- GET /api/listings/[slug] — fetch by slug index — increment views — 30s Redis cache
- Apply four-condition filter check — return 404 if listing fails any condition
- Projection excludes whatsappNumber (enforced by select:false — cannot be accidentally included)

### **2.3 Create Listing**
- POST /api/listings — auth — Zod validate — max 2 images validated server-side
- Check /api/user/whatsapp-status — save whatsappNumber to User if provided (select:false)
- Set: status:pending, aiFlagged:false, aiUnavailable:false, sellerBanned:false
- Respond 201 { slug } — AI check fires in background (non-blocking)
- Rate limit: 5 listings/user/day

### **2.4 Edit & Soft Delete (Seller Only)**
- PATCH /api/listings/[slug] — auth + ownership — Zod validate — flush Redis
- DELETE /api/listings/[slug] — auth + ownership — isDeleted:true — SOFT DELETE — flush Redis

### **2.5 Client-Side Validation Utility**
- Implement lib/utils/validate.ts — sanitizeText + validators object as per LLD section 6
- Implement lib/utils/compressImage.ts — browser-image-compression as per LLD section 7
- Apply validators to all form fields — error shown inline on blur before any API call

### **2.6 UI — Homepage**
- Navbar: logo, search, profile dropdown — hamburger < 768px
- Hero: headline, subheadline, Browse + List CTAs — no hero image
- How It Works: 3 steps
- Listing grid: 20 sample cards — max 2 images per card
- List an Item CTA section
- Footer: links including Contact (/contact) and Privacy (/privacy)

### **2.7 UI — Browse Page**
- Filter bar: category chips, condition, price range, sort — URL params
- Listing grid — load more pagination

### **2.8 UI — Listing Detail Page**
- Full page — max 2 images — main image + 1 thumbnail or swipe on mobile
- Contact button states: guest (lock), logged-in, rate-limited, no-number

|**Phase 2 Test**|**Expected Result**|**Pass?**|
| :- | :- | :- |
|Browse feed — four-condition filter|Banned/flagged/deleted/pending listings absent|[ ]|
|Redis cache hit|Second request served from cache — no DB query|[ ]|
|Cursor pagination|nextCursor works — page 2 starts from correct item|[ ]|
|Create listing — max 2 images|3rd image upload blocked client and server side|[ ]|
|whatsappNumber excluded from detail|GET /api/listings/[slug] has no phone field|[ ]|
|Client validation fires before fetch|Invalid title shows inline error — no API call made|[ ]|
|Soft delete — seller only|isDeleted:true — listing gone from feed — still in DB|[ ]|
|WhatsApp saved server-side|After listing, GET /api/user/whatsapp-status returns hasWhatsapp:true|[ ]|
|GET /api/user/me|No whatsappNumber in response|[ ]|

`  `**PHASE 3: USER FEATURES & CONTACT FLOW  |  Week 3**
### **3.1 Contact Reveal**
- POST /api/listings/[slug]/contact — auth + rateLimit (50/day)
- Fetch listing then User.whatsappNumber with explicit +select override
- Construct wa.me URL server-side — return { waLink } only — number never in response
- Log CONTACT\_REVEALED to AdminActivity
- Implement all 4 button states: guest, logged-in, rate-limited, no-number

### **3.2 WhatsApp Number Collection Flow**
- GET /api/user/whatsapp-status — returns { hasWhatsapp: boolean } only
- Step 2 of listing modal: show WhatsApp field if hasWhatsapp:false — hide if hasWhatsapp:true
- Client-side validation on blur: 10-digit Indian mobile regex
- On submit: number saved server-side (select:false) — never echoed back

### **3.3 Bump Feature**
- POST /api/listings/[slug]/bump — auth + ownership
- Check lastBumpAt < 7 days → 400 with cooldown info
- Check bumpCount >= 3 → 400 'Max bumps reached'
- Update: bumpedAt=now, bumpCount++, lastBumpAt=now, expiresAt=now+60days
- Flush Redis browse cache — return { nextBumpAt, bumpsRemaining }

### **3.4 Report Listing**
- POST /api/listings/[slug]/report — auth + rateLimit (10/day)
- Validate reason against enum — save Report document — return 201

### **3.5 My Dashboard**
- GET /api/user/listings — auth — cursor paginated by status
- Dashboard card projection: \_id, title, price, images[0], status, bumpedAt, lastBumpAt, bumpCount, expiresAt, slug
- All destructive actions (delete listing) → Confirm Modal — not alert()

### **3.6 Profile Page**
- GET/PATCH /api/user/me — displayName + bio only — no whatsappNumber in response ever
- Delete account → Confirm Modal → type DELETE → DELETE /api/user/me → 8-step cascade
- Admin-role users: 'Admin Panel' green button links to /admin/overview

|**Phase 3 Test**|**Expected Result**|**Pass?**|
| :- | :- | :- |
|Contact — guest|Login wall shown → /login?returnTo=/listing/[slug]|[ ]|
|Contact — logged in|{ waLink } returned — window.open fires — number never in DOM|[ ]|
|Contact — rate limit|51st request returns 429|[ ]|
|wa.me link opens WhatsApp|Correct number reached via WhatsApp|[ ]|
|WhatsApp field hidden if saved|Step 2 has no phone field if hasWhatsapp:true|[ ]|
|WhatsApp never returned|GET /api/user/whatsapp-status returns boolean only|[ ]|
|Bump — success|bumpedAt updated — listing top of feed — expiresAt + 60 days|[ ]|
|Bump — cooldown|400 with correct days remaining|[ ]|
|Bump — max|400 'Max bumps reached'|[ ]|
|Delete listing — Confirm Modal|No browser alert — inline modal appears|[ ]|
|Account deletion cascade|All 8 steps complete — Firebase account gone — cookies cleared|[ ]|

`  `**PHASE 4: ADMIN PANEL  |  Week 4**
### **4.1 Admin Layout**
- Create /admin layout with full sidebar — completely isolated from main app
- Sidebar: Overview, Queue (badge), Reports (badge), Users, Categories, Audit Log, Settings, Contacts (badge)
- 'Back to app' link in sidebar
- admin middleware on every /api/admin/\* and page route
- Confirm Modal global component — used for all destructive admin actions — no alert()

### **4.2 Overview (A-01)**
- Stats: Total Users, Active Listings, Pending Review, Open Reports
- Mode switcher: Auto / AI-flagging / Manual — instant + logged
- Pending queue preview: 5 listings — aiFlagged + aiUnavailable with badges
- Recent activity: last 10 audit entries

### **4.3 Moderation Queue (A-02)**
- GET /api/admin/listings?status=pending — aiFlagged desc, aiUnavailable desc, createdAt asc
- AI-flagged rows: orange border + confidence + reason
- aiUnavailable rows: amber badge 'AI was down — manual review required'
- Approve: clears aiFlagged → status:approved → feed cache flushed
- Reject: mandatory reason → Confirm Modal → email to seller — logged
- Hard delete: mandatory reason → Confirm Modal → Cloudinary purge → email to seller — logged

### **4.4 User Management (A-04)**
- Ban: mandatory reason dropdown → Confirm Modal → atomic transaction: isActive=false + sellerBanned=true on all listings → cache flush → email
- Unban: reverse atomic transaction → cache flush → logged
- Role change → Confirm Modal → logged
- Delete user → type DELETE → 8-step cascade — logged

### **4.5 Category Management (A-05)**
- GET /api/admin/categories/[id]/check before any delete
- No listings: simple Confirm Modal → delete
- Has listings: Conflict Resolution Modal → Option A (reassign) or Option B (cascade + type DELETE)
- Option B: hard delete all listings + Cloudinary purge + seller emails + delete category + cache flush

### **4.6 Audit Log (A-06)**
- Read-only — all actions from this document's audit log table — paginated — colour-coded

|**Phase 4 Test**|**Expected Result**|**Pass?**|
| :- | :- | :- |
|Non-admin /admin access|403 — redirect to home|[ ]|
|Mode switch: manual|All new listings require approval|[ ]|
|Approve flagged listing|aiFlagged cleared — listing visible in feed — cache flushed|[ ]|
|Admin hard delete|Listing gone from MongoDB — Cloudinary images purged — seller email sent|[ ]|
|Soft delete NOT used for admin|isDeleted stays false — document removed entirely|[ ]|
|Ban user — atomic|User.isActive=false + all listing.sellerBanned=true in one transaction|[ ]|
|Ban — listings hidden instantly|Banned user's listings gone from feed — no delay|[ ]|
|Banned user login|401 — cannot get JWT|[ ]|
|Unban — listings restored|All listings.sellerBanned=false — appear in feed again|[ ]|
|Category delete — has listings|Conflict modal shown — direct delete blocked|[ ]|
|Category cascade delete|All listings deleted + images purged + sellers emailed|[ ]|
|All admin actions in audit log|Every Phase 4 action appears with actor + reason|[ ]|
|No browser alert anywhere|All confirmations via inline modal|[ ]|

`  `**PHASE 5: AI, EMAIL, CONTACT PAGE & CRON  |  Week 5**
### **5.1 AI Quality Check**
- Implement lib/ai/checkListing.ts — three-layer parallel check
- Gemini 1.5 Flash: category mismatch — structured JSON prompt
- Cloudinary moderation: read aws\_rek result from upload response
- Rule-based keyword filter: synchronous — no API needed

`  `**CRITICAL: If AI is unavailable: listing is flagged (aiFlagged:true, aiUnavailable:true) and sent to admin queue. Never auto-approved.**

- On AI error: aiFlagged=true, aiUnavailable=true — log LISTING\_AI\_UNAVAILABLE\_FLAGGED

### **5.2 Email System**
- Implement lib/email/resend.ts — all 7 email trigger functions
- Welcome: on signup
- Listing rejected: reason from admin — resubmit CTA
- Listing deleted by admin: reason + /contact link
- Listing expired: notice + re-list CTA
- Account banned: reason + /contact link
- Account deleted: confirmation all data removed
- Contact form auto-reply: acknowledgement + 48hr promise

`  `*Note: No 'listing approved' email — sellers check My Dashboard.*

### **5.3 Contact Page (/contact)**
- POST /api/contact — Zod validate — rateLimit 3/day/IP
- Save ContactMessage document
- Send email to admin via Resend
- Send auto-reply to user via Resend
- Admin contact inbox at A-08: GET /api/admin/contacts — PATCH to mark resolved
- Pre-fill name + email if user is logged in

### **5.4 Cron Jobs**
- Expiry: 0 2 \* \* \* — isExpired:true on past-expiresAt listings — email seller — flush cache
- AI retry: \*/30 \* \* \* \* — retry listings where aiVerification.checked:false
- Backup: 0 3 \* \* 0 — export MongoDB → private GitHub repo
- All cron routes validate CRON\_SECRET header

|**Phase 5 Test**|**Expected Result**|**Pass?**|
| :- | :- | :- |
|AI: category mismatch|Book under Electronics → aiFlagged:true, confidence > 0.8|[ ]|
|AI: spam keywords|'test test test' listing → flagged by keyword filter|[ ]|
|AI: service unavailable|aiFlagged:true + aiUnavailable:true — NOT auto-approved|[ ]|
|aiUnavailable badge in queue|Admin queue shows amber 'AI was down' badge|[ ]|
|No approved email|Admin approves listing — no email sent to seller|[ ]|
|Reject email|Rejection reason included in email|[ ]|
|Deleted email|Deletion reason + /contact link in email|[ ]|
|Ban email|/contact link in ban email for appeal|[ ]|
|Contact form submit|ContactMessage saved — admin email + auto-reply sent|[ ]|
|Contact form rate limit|4th submission returns 429|[ ]|
|Expiry cron|Past-expiresAt listings set to isExpired:true — email sent|[ ]|
|Cron auth|Request without CRON\_SECRET returns 401|[ ]|

`  `**PHASE 6: SECURITY, POLISH & LAUNCH  |  Week 6**
### **6.1 Security Hardening**
- Add all 5 security headers to next.config.ts
- Verify whatsappNumber NEVER in any API response — write automated test
- Verify four-condition feed filter on every browse/search/public-profile endpoint
- Verify all admin routes return 403 for non-admin
- Verify all rate limits fire correctly
- Verify MIME validation rejects spoofed files
- Verify all JWT cookies: HttpOnly, Secure, SameSite=Strict
- Verify no browser alert() or confirm() anywhere in codebase — grep check

### **6.2 Privacy Policy Page (/privacy)**
- Static page — all 8 sections from PRD section 16
- Linked in footer on every page

### **6.3 Performance Verification**
- explain() on key MongoDB queries — verify index usage
- Verify Redis cache hit rate on browse feed under load
- Verify API response projections — no extra fields, no whatsappNumber
- Measure P95: browse < 800ms, detail < 600ms, contact < 300ms

### **6.4 UI Polish**
- Empty states: browse, search, dashboard
- 404 page
- Loading and error states on all async operations
- Mobile test: 375px, 768px, 1280px breakpoints
- Confirm Modal: verify works on all destructive actions — keyboard accessible

|**Pre-Launch Checklist**|**Check**|**Done?**|
| :- | :- | :- |
|Env|All 17 env vars in Vercel dashboard|[ ]|
|Env|.env.example committed — .env.local in .gitignore|[ ]|
|Auth|Google OAuth only — Email/Password disabled in Firebase console|[ ]|
|DB|All 15 indexes created — verified with getIndexes()|[ ]|
|DB|Seed data loaded — 20 listings with max 2 images|[ ]|
|Security|No whatsappNumber in any API response — automated test passes|[ ]|
|Security|Four-condition filter on all browse/search endpoints|[ ]|
|Security|All security headers present — curl -I confirms|[ ]|
|Security|No browser alert() in codebase — grep confirms|[ ]|
|Performance|Browse feed < 800ms P95|[ ]|
|Performance|Redis cache working — DB not hit on cache hit|[ ]|
|Email|All 7 Resend email types tested end-to-end|[ ]|
|Email|No approved email — verified|[ ]|
|AI|AI unavailable → flagged (not approved) — tested|[ ]|
|Contact|Contact page working — admin inbox receiving messages|[ ]|
|Privacy|Privacy Policy at /privacy — linked in footer|[ ]|
|Admin|Hard delete confirmed — isDeleted not used for admin actions|[ ]|
|Ban|Ban atomic transaction tested — cache flush confirmed|[ ]|
|Cron|Expiry cron tested — correct listings expired|[ ]|
|Backup|First backup in private GitHub repo|[ ]|
|Monitoring|Sentry receiving errors in production|[ ]|
|Mobile|All pages tested at 375px|[ ]|

UniDeal Build Order v2.1    |    Page 

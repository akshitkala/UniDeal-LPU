# UniDeal — Complete Pre-Production Audit Prompt

| Field | Value |
|---|---|
| Project | UniDeal — Campus Marketplace |
| Version | 2.1 — Pre-Production |
| Stack | Next.js 16.2.1 · MongoDB Atlas M0 · Firebase Auth · Upstash Redis · Cloudinary · Resend · Vercel bom1 |
| Audit Scope | UI/UX · Backend API · Database · Race Conditions · Security · Privacy · Logic Gaps · Performance |
| Document Type | Master Prompt — Paste into AI coding assistant with full codebase access |

---

## Instructions for Use

This document is a master audit prompt. Copy the prompt sections below and paste them into your AI coding assistant (Cursor, Claude Code, or any assistant with full read access to the UniDeal codebase). Run each audit section independently. For each finding, generate a report entry using the reporting template in Section 10.

> **📌 NOTE:** Run audits in order — Security first, then Database, then API, then Race Conditions, then UI, then Privacy, then Logic Gaps. Each audit builds on the previous one's findings.

---

## Section 1 — System Context (Read This First)

Before auditing, internalize these absolute constraints that must NEVER be violated.

### 1.1 Architecture Facts

| Layer | Detail |
|---|---|
| Framework | Next.js 16.2.1 App Router + TypeScript — serverless on Vercel bom1 (Mumbai) |
| Database | MongoDB Atlas M0 — Mongoose ODM — 512MB storage cap — never migrate to SQL |
| Auth | Firebase Google OAuth ONLY — custom JWT (access 15m + refresh 7d) — HTTP-only cookies |
| Session hint | Non-httpOnly session_hint cookie (display data only) — no auth value — UI hydration only |
| Images | Cloudinary — no aws_rek moderation — max 2 images per listing — max 5MB each |
| Cache | Upstash Redis singleton — lib/cache/redis.ts — never instantiate outside this file |
| Rate limits | All via Upstash — login 10/hr · post 5/day · contact 50/day · report 10/day · bump 1/7days |
| Emails | Resend — 7 trigger types — Firebase handles auth emails natively |
| AI | Gemini 1.5 Flash — fire-and-forget after listing save — never blocks response |
| Budget | ₹0/month — all free tiers — no paid services |

### 1.2 The 14 Unbreakable Rules

1. **`whatsappNumber` — `select:false` — NEVER in any API response under any circumstance**
2. Feed filter — 4 conditions on every browse/search query: `{ status:'approved', isDeleted:false, sellerBanned:false, aiFlagged:false }`
3. Admin delete — ALWAYS hard delete (remove from MongoDB + purge Cloudinary) — `isDeleted:true` is for seller self-delete ONLY
4. AI unavailable — ALWAYS flag (`aiFlagged:true + aiUnavailable:true`) — NEVER auto-approve when AI is down
5. No `browser alert()` or `confirm()` anywhere — always Confirm Modal component
6. Contact reveal — server builds `wa.me` URL — returns `{ waLink }` only — phone number never in DOM
7. Ban — atomic MongoDB transaction — `User.isActive=false` + `Listing.updateMany(sellerBanned:true)` simultaneously
8. JWT cookies — `httpOnly`, `Secure`, `SameSite=Strict`, `maxAge` set — no exceptions
9. Auth — Google OAuth only — any email accepted — no domain restriction
10. Listing detail — full page `/listing/[slug]` only — no drawer, no bottom sheet
11. React keys — always `listing._id` — never index, never slug
12. Redis — singleton client — never `new Redis()` outside `lib/cache/redis.ts`
13. Database — MongoDB only — never migrate to Neon or any SQL database
14. No AI mentions in UI — not to users, not to admins — AI is invisible

---

## Section 2 — Security Audit Prompt

> **PROMPT — SECURITY AUDIT**
> You are a senior security engineer auditing the UniDeal codebase before its first production deployment. UniDeal is a Next.js 16.2.1 App Router application using MongoDB Atlas M0, Firebase Google OAuth, custom JWTs stored in HTTP-only cookies, Upstash Redis for rate limiting, and Cloudinary for image storage. The app runs on Vercel bom1 (Mumbai). Perform a complete security audit covering ALL of the following areas and report every finding with severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), the exact file and line number where the issue exists, and a concrete fix.

### 2.1 Authentication & Session Security

- Verify `/api/auth/login` validates the Firebase ID token via Admin SDK before issuing JWTs — check that token is never trusted client-side only
- Verify access JWT is signed with `JWT_SECRET` and refresh JWT is signed with `REFRESH_SECRET` — confirm they are different secrets — flag if same secret used for both
- Verify both JWT cookies are set with: `httpOnly:true`, `secure:true`, `sameSite:'strict'`, `maxAge` explicitly set — flag any missing attribute
- Verify `/api/auth/refresh` re-checks `User.isActive` in MongoDB on every refresh — banned users must not get new access tokens
- Verify `/api/auth/refresh` validates the refresh token signature before issuing new access token — check for missing verification
- Verify the `session_hint` cookie (non-httpOnly) contains ONLY: `displayName`, `photoURL`, `role`, `uid` — flag if any sensitive field is included (`email` alone is borderline, `whatsappNumber` is CRITICAL)
- Check for JWT secret rotation strategy — flag if `JWT_SECRET` is hardcoded or appears in any committed file
- Verify logout clears ALL three cookies: `accessToken`, `refreshToken`, `session_hint` — flag if any is missed

### 2.2 Authorization & Access Control

- Audit every `/api/admin/*` route — verify `admin` middleware runs FIRST before any data access — flag any route missing the admin check
- Audit `PATCH /api/listings/[slug]` and `DELETE /api/listings/[slug]` — verify ownership middleware confirms `listing.seller === req.user.uid` — check for IDOR vulnerability
- Check `POST /api/listings/[slug]/bump` — verify ownership check exists — a user should not be able to bump another seller's listing
- Check `POST /api/listings/[slug]/sold` — verify ownership check — only the seller should mark their own listing as sold
- Check `/api/admin/listings/[id]/contact` — verify: (1) admin role required, (2) reason field mandatory, (3) always logs to AdminActivity — flag any missing check
- Audit all public endpoints (no auth) — verify they return NO sensitive fields even accidentally

### 2.3 WhatsApp Number / Phone Security (CRITICAL AREA)

> **⚠ CRITICAL:** This is the most security-critical area of the codebase. A leaked phone number is an immediate user safety issue. Check every single API response path.

- Search entire codebase for `whatsappNumber` — list every file that references it — verify `select:false` is set on the Mongoose schema
- Verify `GET /api/listings` (browse) projection NEVER includes `whatsappNumber` — check the `.select()` or projection object
- Verify `GET /api/listings/[slug]` (detail) NEVER includes `whatsappNumber` — even with `populate()`
- Verify `GET /api/user/me` NEVER includes `whatsappNumber` in the response
- Verify `GET /api/user/whatsapp-status` returns `{ hasWhatsapp: boolean }` ONLY — not the number itself
- Verify `POST /api/listings/[slug]/contact` returns `{ waLink }` ONLY — the `wa.me` URL string — never a phone field
- Verify `/api/admin/listings/[id]/contact` is a SEPARATE endpoint with separate audit logging — it should return the plain number for admin use but ALWAYS log the access with mandatory reason
- Run a full-text search for `phone`, `mobile`, `number`, `wa.me` in all API response objects — flag any unexpected occurrence

### 2.4 Input Validation & Injection

- Verify every POST/PATCH endpoint uses Zod validation server-side — check that client-side validation is duplicated, not replaced, server-side
- Check the search query parameter `?q=` — verify `sanitizeText()` strips HTML and injection chars before MongoDB `$text` query
- Verify listing title and description are sanitized — check for XSS via stored content rendered in React
- Check file upload: verify MIME type validation uses magic bytes (not just extension) — JPEG/PNG/WebP only
- Verify file size limits are checked both client-side AND server-side in Next.js config — flag if only client-side
- Check that MongoDB ObjectId parameters (category, userId, listingId) are validated as valid 24-char hex before use in queries

### 2.5 Rate Limiting

- Verify ALL rate-limited endpoints use Upstash Redis (not in-memory) — in-memory counters reset per serverless invocation and are useless
- Check login rate limit: 10/hour — verify it's keyed by IP, not just by user (pre-auth endpoint)
- Check contact reveal: 50/day — verify keyed by `uid` — verify the Redis `INCR + EXPIRE` pattern is atomic
- Check `POST /api/contact` (contact form): 3/day per IP — verify IP extraction from headers (`x-forwarded-for` on Vercel)
- Check bump endpoint: verify 7-day cooldown is enforced in DB (`lastBumpAt` field) AND in application logic — not just Redis
- Verify rate limit errors return `429` with a user-friendly message — not a raw Redis error

### 2.6 Security Headers

- Check `next.config.ts` — verify all 5 security headers are present: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Content-Security-Policy`
- Verify no CORS wildcard (`*`) on API routes — all API routes should be same-origin
- Verify no sensitive data in error messages returned to client — stack traces must not reach production responses

---

## Section 3 — Database Audit Prompt

> **PROMPT — DATABASE AUDIT**
> You are a senior database engineer auditing the UniDeal MongoDB schema and query patterns. The app uses MongoDB Atlas M0 (512MB storage limit) with Mongoose ODM. The app is serverless on Vercel — connection pooling is critical. Audit the following areas and report every finding with the affected model/file and a concrete fix.

### 3.1 Index Verification

Verify all 15 required indexes exist in `lib/db/indexes.ts` and are created on boot:

```
Listing: { bumpedAt:-1, createdAt:-1 }          — browse feed primary sort
Listing: { status:1, isDeleted:1, sellerBanned:1, aiFlagged:1 }  — four-condition filter
Listing: { category:1, status:1, sellerBanned:1, aiFlagged:1 }   — category filter
Listing: { seller:1 }                            — my dashboard
Listing: { slug:1 } unique                       — detail page lookup
Listing: { aiFlagged:1, aiUnavailable:1, status:1 }  — admin queue
Listing: { expiresAt:1 } TTL                     — auto-expire
Listing: { title:'text', description:'text' }    — full-text search
User:    { uid:1 } unique
User:    { email:1 } unique
AdminActivity: { timestamp:-1 }
AdminActivity: { actor:1, timestamp:-1 }
Report:  { listing:1, status:1 }
Category: { order:1, isActive:1 }
ContactMessage: { createdAt:-1 }
```

- Run `explain()` on the browse feed query — verify it hits `{ bumpedAt:-1, createdAt:-1 }` — flag if `COLLSCAN`
- Run `explain()` on the listing detail query by slug — verify it hits the unique slug index
- Run `explain()` on the admin queue query (status:pending, aiFlagged sort) — verify compound index hit
- Run `explain()` on the full-text search query — verify text index is used

### 3.2 Connection Pooling

- Verify `lib/db/connect.ts` uses the global cached connection pattern — flag if `mongoose.connect()` is called without caching
- Check that `connectDB()` is called at the top of every API route handler — flag any route that accesses models without calling `connectDB` first
- Verify the Mongoose connection string includes appropriate pool settings for M0 (`maxPoolSize` should not exceed 5 on free tier)

### 3.3 Data Integrity

- Verify the SystemConfig singleton pattern — `_id: 'global'` — check that only one document can exist — verify `findOneAndUpdate` with upsert is used, never `insertOne`
- Check `Listing.bumpCount` has a `max:3` validator at the Mongoose schema level — not just application logic
- Check that `expiresAt` is always set on listing creation (`createdAt + 60 days`) — flag if it can be null
- Verify that when a category is deleted via cascade, ALL associated listing documents are hard deleted — no orphaned listings with deleted category references
- Check `totalListings` and `activeListings` counters on User — verify they are updated atomically with listing status changes — flag if they can go out of sync

### 3.4 Sensitive Field Protection

- Verify `whatsappNumber` on User has `select: false` in the Mongoose schema definition — this is the primary protection
- Check every `.populate()` call that includes User — verify none accidentally request `whatsappNumber` via explicit field selection
- Verify `sellerPhone` and `sellerEmail` fields (from older spec) do not exist in current schema — if they do, flag for removal

---

## Section 4 — Race Condition Audit Prompt

> **PROMPT — RACE CONDITIONS**
> You are a senior backend engineer specializing in concurrency issues in serverless applications. UniDeal runs on Vercel serverless functions with MongoDB Atlas M0. Multiple simultaneous requests can hit the same data. Audit every operation that involves read-then-write patterns for race conditions. Report each finding with the exact scenario that triggers it, the consequence, and the fix.

### 4.1 Bump Race Condition (HIGH RISK)

**Scenario:** Two browser tabs both tap 'Bump' simultaneously on the same listing. Both read `bumpCount=2` before either write completes. Both increment to 3. Result: `bumpCount` exceeds max of 3, or 7-day cooldown is bypassed.

- Check `POST /api/listings/[slug]/bump` — verify the cooldown check and `bumpCount` check use `findOneAndUpdate` with atomic `$inc` and conditions in a single operation, NOT a read-then-write pattern
- **CORRECT pattern:**
```js
Listing.findOneAndUpdate(
  { _id, bumpCount: { $lt: 3 }, lastBumpAt: { $lt: sevenDaysAgo } },
  { $inc: { bumpCount: 1 }, $set: { bumpedAt: now, lastBumpAt: now, expiresAt: expiry } },
  { new: true }
)
// If null returned → condition failed
```
- **WRONG pattern (flag it):**
```js
const listing = await Listing.findById(id);
if (listing.bumpCount < 3) { listing.bumpCount++; await listing.save(); }
```

### 4.2 Ban Atomicity (CRITICAL)

- Verify the ban operation uses a MongoDB session/transaction: `User.isActive=false` AND `Listing.updateMany(sellerBanned:true)` must be atomic — if User update succeeds but Listing update fails, banned user's listings remain visible
- Check the `session.startTransaction()` / `commitTransaction()` / `abortTransaction()` pattern is implemented
- Verify Redis cache flush happens AFTER transaction commit, not before

### 4.3 Duplicate Report Race

**Scenario:** User double-taps 'Report' — two simultaneous `POST /api/listings/[slug]/report` requests. Result: duplicate Report documents for same user+listing combination.

- Check Report model for a unique compound index: `{ listing: 1, reportedBy: 1 }` — if absent, duplicates are possible
- Verify the report endpoint uses `insertOne` with this unique index (it will throw on duplicate) rather than a find-then-insert pattern

### 4.4 Category Deletion During Active Listing

**Scenario:** Admin starts cascade delete of a category. Simultaneously, a seller submits a new listing under that category. Result: listing saved with a reference to a non-existent category.

- Check `/api/admin/categories/[id]` DELETE — verify it checks for active listings atomically and blocks the category from accepting new listings before deletion begins

### 4.5 Listing Edit Mid-Review

**Scenario:** Admin is reviewing a pending listing in the queue. Seller edits the listing simultaneously (status resets to pending). Admin approves the OLD version but the DB now has the new version.

- Check `PATCH /api/listings/[slug]` — verify that editing a listing resets status to `pending` — this is correct behavior but must be documented
- Check if admin approve uses listing `_id` or `slug` — if slug, verify it fetches the latest version before approving

### 4.6 Concurrent Account Deletion

**Scenario:** User triggers account deletion. Simultaneously, an admin approves one of their listings. Result: listing may be approved and made public after user is deleted (orphaned listing).

- Check the account deletion cascade — verify it hard deletes ALL listings FIRST before deleting the User document
- Verify the cascade is wrapped in a transaction or at minimum uses sequential awaits with error handling at each step

---

## Section 5 — API Consistency Audit Prompt

> **PROMPT — API AUDIT**
> You are a senior API engineer auditing UniDeal's REST endpoints. Review every route for consistency, correctness, error handling, and adherence to the spec. Test each endpoint against the documented behavior. Report deviations with the endpoint, expected behavior, actual behavior, and fix.

### 5.1 Feed Filter Consistency

> **⚠ CRITICAL:** The four-condition feed filter `{ status:'approved', isDeleted:false, sellerBanned:false, aiFlagged:false }` MUST appear on EVERY query that returns listings to non-admin users. A missing condition is a data leak.

- Audit `GET /api/listings` — verify all 4 conditions present
- Audit `GET /api/listings/[slug]` (public detail) — verify listing is checked against all 4 conditions before returning — return neutral response if any condition fails
- Audit any public profile endpoint if it lists a seller's active listings — verify 4-condition filter
- Audit `GET /api/categories` if it returns listing counts — verify counts only include approved listings
- Audit `GET /api/stats` — verify active listing count only counts approved, non-deleted, non-banned listings

### 5.2 Response Shape Consistency

- Verify `GET /api/user/me` never includes `whatsappNumber` — check actual Mongoose projection
- Verify browse feed returns ONLY card projection fields: `_id, title, price, negotiable, images[0], condition, category:{name,slug}, slug, bumpedAt, createdAt, seller:{displayName}`
- Verify listing detail returns NO `whatsappNumber` — even via seller populate
- Verify all list endpoints return cursor-based pagination shape: `{ data: [...], nextCursor: string|null, total: number }`
- Verify all error responses use consistent shape: `{ error: string, code?: string }` — no raw MongoDB errors or stack traces

### 5.3 Status Code Consistency

- Verify `401` is returned for missing/invalid auth token (not 403)
- Verify `403` is returned for valid auth but insufficient role/ownership (not 401)
- Verify `429` is returned for rate limit exceeded with `Retry-After` header if possible
- Verify `404` is returned for non-existent resources (not 500)
- Verify `400` is returned for validation failures (not 500)

### 5.4 Missing Endpoints Check

- Verify `POST /api/listings/[slug]/sold` exists and requires auth + ownership
- Verify `GET /api/user/listings/counts` exists and returns `{ active: N, pending: N, rejected: N, sold: N }`
- Verify `GET /api/admin/categories/[id]/check` exists and returns `{ canDelete: boolean, affectedCount: number }`
- Verify `GET /api/stats` exists and is public — returns platform-level numbers for homepage

### 5.5 Cron Job Security

- Verify all cron route handlers check for `CRON_SECRET` header — return `401` immediately if missing or wrong
- Verify the expiry cron correctly queries `{ expiresAt: { $lt: new Date() }, status: 'approved', isExpired: false }` — flag if it could accidentally expire pending or sold listings
- Verify the AI retry cron only retries listings where `aiVerification.checked:false` — not all pending listings

---

## Section 6 — UI/UX Audit Prompt

> **PROMPT — UI/UX AUDIT**
> You are a senior frontend engineer and UX designer auditing UniDeal's interface. The app is Next.js 16.2.1 with Tailwind CSS and shadcn/ui. Brand color is `#16a34a` (green). The design system is minimal, white-dominant, Shopcart-inspired. Audit every screen for consistency, accessibility, mobile behavior, empty states, and loading states.

### 6.1 Design System Consistency

- Audit all buttons — verify they match the scale: Primary (`h-10 px-5 rounded-full bg-[#16a34a]`) / Secondary (`h-10 px-5 rounded-full border`) / Destructive (`h-9 px-4 rounded-full border-red-200 text-red-500`)
- Audit all text — verify: no `text-4xl+` outside hero, no `font-black` outside hero/stats, no uppercase on names/buttons/titles, no ALL CAPS
- Audit listing cards — verify single `ListingCard` component is used everywhere — no duplicated card implementations
- Verify card structure: `image aspect-square bg-gray-50 object-contain p-3` / `body p-2.5 sm:p-3` / row 1 category+condition / row 2 title `line-clamp-2` / row 3 price+negotiable badge / row 4 seller+timestamp (hidden after 6 days)
- Audit container widths — verify `max-w-7xl mx-auto px-4 sm:px-6 lg:px-6` is used consistently on all pages

### 6.2 Mobile Responsiveness

- Audit grid layouts — verify listing grid is `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` on all list views
- Verify tab bar (`h-14 fixed bottom`) appears ONLY on mobile — hidden on desktop (`md:hidden`)
- Verify `pb-16` is applied on mobile to prevent content hiding behind tab bar
- Audit all modals — verify bottom sheet on mobile (90dvh) / centered dialog on desktop
- Test the sell flow modal on 375px — verify step 1 and step 2 are fully accessible without horizontal scroll

### 6.3 Empty States

- Verify `/browse` with no results shows: empty state + `Nothing found.` + clear filters CTA
- Verify `/dashboard` Active tab with no listings shows: `You haven't listed anything yet.` + List an Item CTA
- Verify admin queue with no pending listings shows: `No pending listings. All clear.`
- Verify admin reports with no pending reports shows appropriate empty state

### 6.4 Loading & Error States

- Verify every async data fetch shows a skeleton loader (not a spinner) — cards should show skeleton shimmer
- Verify error states show a human-readable message + retry button — not a raw error string
- Verify the sell modal submit button shows loading state (spinner + disabled) while the POST is in flight
- Verify contact button shows loading state between tap and WhatsApp opening

### 6.5 Content Rules Verification

- Search entire codebase for `LPU`, `Lovely Professional`, `Verified Student`, `campus-verified` — flag any occurrence
- Search for `AI`, `artificial intelligence`, `machine learning`, `automated`, `flagged by` in any user-facing string — flag any occurrence
- Verify footer on every page contains: `© 2026 UniDeal. Not affiliated with any university.`
- Verify login page says `Sign in with Google` — no university email hint or domain suggestion
- Grep for `alert(` and `confirm(` in all `.tsx` and `.ts` files — flag any occurrence

### 6.6 Accessibility

- Verify all interactive elements have accessible labels (`aria-label` on icon buttons)
- Verify confirm modal is keyboard accessible — Escape closes, Enter confirms
- Verify color contrast — green `#16a34a` on white passes WCAG AA for normal text
- Verify images have `alt` attributes — listing images should use listing title as alt text

---

## Section 7 — Privacy & GDPR Audit Prompt

> **PROMPT — PRIVACY AUDIT**
> You are a privacy engineer auditing UniDeal for GDPR compliance and data minimization. UniDeal collects: email (from Google), display name (from Google), optional WhatsApp number, optional bio, listing content, IP addresses (in logs), and behavioral data (listing views). Audit every data collection, storage, retention, and deletion flow.

### 7.1 Account Deletion Cascade

Verify the 8-step hard delete cascade executes completely and in the correct order:

1. Hard delete all listings from MongoDB (not soft delete)
2. Purge all listing images from Cloudinary
3. Anonymise AdminActivity: `actor:null`, `actorType:deleted_user` — preserve log, remove identity
4. Delete all Report documents filed by this user
5. Delete all ContactMessage documents by this user
6. Delete MongoDB User document
7. Delete Firebase account via Admin SDK
8. Clear all session cookies (`accessToken`, `refreshToken`, `session_hint`)

- Verify step ordering — User document must be deleted AFTER all dependent records are handled
- Verify Firebase deletion happens AFTER MongoDB deletion — if Firebase deletes first and MongoDB fails, user is locked out but data remains
- Verify account deleted confirmation email is sent via Resend after cascade completes

### 7.2 Data Minimization

- Audit `GET /api/user/me` — verify only necessary fields are returned: `uid, email, displayName, photoURL, role, isActive, totalListings, activeListings, createdAt`
- Verify `whatsappNumber` is NEVER returned anywhere — only a boolean `hasWhatsapp` from `/api/user/whatsapp-status`
- Verify `AdminActivity.ipAddress` is stored masked in UI display but full in DB — verify masking function exists
- Audit `ContactMessage` — verify `ipAddress` is stored but not exposed in any user-facing response

### 7.3 Data Retention

- Verify listings expire after 60 days via the `expiresAt` TTL index — verify the cron job also sets `isExpired:true` for query efficiency
- Verify there is no mechanism to retain deleted user data beyond the cascade
- Audit `AdminActivity` — verify no personally identifiable data beyond `uid` is stored in the `metadata` field

### 7.4 Privacy Policy Page

- Verify `/privacy` page exists and is linked in footer on every page
- Verify privacy policy covers: what data is collected, why, how long it's kept, how to delete your account, contact information

---

## Section 8 — Logic Gap Audit Prompt

> **PROMPT — LOGIC GAPS**
> You are a QA engineer doing edge case analysis on UniDeal. Your job is to find scenarios that are logically possible but either unhandled, handled incorrectly, or produce inconsistent state. For each gap, describe the scenario, the current behavior, the expected behavior, and the fix.

### 8.1 Listing Lifecycle Edge Cases

- **GAP:** Seller marks listing as sold, then immediately edits it. Expected: sold listings should be read-only — edit option hidden from dashboard sold tab.
- **GAP:** Listing expires (`isExpired:true`) but seller tries to bump it. Expected: bump should fail with `Listing has expired, please re-list`. Check bump endpoint validates `status !== 'expired'`.
- **GAP:** Admin approves a listing, seller immediately deletes it (`isDeleted:true`), then admin tries to view it. Expected: admin should still see deleted listings — `isDeleted` listings must be visible in admin queue. Verify `/api/admin/listings` does NOT apply `isDeleted:false` filter.
- **GAP:** Seller submits listing with no WhatsApp number saved. Admin approves it. Buyer tries to contact — gets `Contact not available`. Seller has no way to know their listing was approved but has no contact method.

### 8.2 Admin Operation Edge Cases

- **GAP:** Admin bans a user who has pending listings in the queue. `sellerBanned:true` is set on all listings. Admin queue shows these listings but they can never be approved. Expected: ban operation should auto-reject all pending listings.
- **GAP:** Admin changes approval mode from `manual` to `auto-approve` mid-queue. Expected: mode change should NOT retroactively approve pending listings — mode only affects NEW submissions.
- **GAP:** Admin deletes a category that has listings in `rejected` or `pending` status. The check endpoint may only count `approved` listings. Expected: check must count ALL non-deleted listings in any status.

### 8.3 Bump Edge Cases

- **GAP:** Listing has `bumpCount:2`. Seller bumps (becomes 3). 7 days later, bump button shows available but max already reached. Expected: show `Max bumps reached` not a cooldown timer when `bumpCount >= 3`.
- **GAP:** Two devices logged into same account both see `Bump available`. User taps on both simultaneously. Without atomic check, `bumpCount` could exceed 3. Verify the atomic `findOneAndUpdate` pattern is used.

### 8.4 Search & Filter Edge Cases

- **GAP:** User searches for a term, applies a category filter, then clears the search. Expected: category filter should persist. Verify URL param state is managed correctly.
- **GAP:** Category is hidden by admin (`isActive:false`). Old bookmarked URL with `?category=[id]` is loaded. Expected: filter chip not shown, query returns no results silently (not an error).

### 8.5 Email Edge Cases

- **GAP:** User deletes their account. Resend fails sending the confirmation email. Expected: cascade should still complete — email failure should be logged but not block account deletion. Verify email send is not awaited as a blocking step.
- **GAP:** Admin selects `other` as rejection reason without filling free text. Expected: email should handle empty reason gracefully — not send `Reason: undefined`.

---

## Section 9 — Performance Audit Prompt

> **PROMPT — PERFORMANCE AUDIT**
> You are a performance engineer auditing UniDeal for production readiness. Targets: browse feed P95 < 400ms (MongoDB cold) / < 100ms (Redis hit), listing detail P95 < 600ms, contact reveal P95 < 300ms. Audit the following areas.

### 9.1 Redis Cache Validation

- Verify browse feed Redis key pattern is `feed:browse:{params_hash}` — the hash must include all query params (category, condition, sort, q, cursor) — if hash is wrong, cache misses occur on every unique URL
- Verify cache is invalidated on: listing approved, listing hard-deleted, listing sold, listing expired, user banned — check all 5 invalidation points
- Verify Redis singleton — grep for `new Redis(` outside of `lib/cache/redis.ts` — each extra instantiation wastes connections

### 9.2 MongoDB Query Efficiency

- Browse feed: verify card projection is used — `.select('title price images.0 condition category slug bumpedAt createdAt seller negotiable')` — not full documents
- Listing detail: verify full projection is used but with populate limited to safe fields — no uncontrolled `.populate()`
- Admin queue: verify sorted by `{ aiFlagged:-1, aiUnavailable:-1, createdAt:1 }` — check index supports this sort

### 9.3 Image Optimization

- Verify card images use Cloudinary transformation: `w_400,h_400,c_fill,q_85,f_auto`
- Verify detail images use: `w_900,c_limit,q_90,f_auto`
- Verify `browser-image-compression` runs client-side before upload — `maxSizeMB:1, maxWidthOrHeight:800`

---

## Section 10 — Reporting Template

For each finding discovered during any audit section, log it using this template:

| Field | Value |
|---|---|
| Finding ID | SEC-001 / DB-001 / RACE-001 / API-001 / UI-001 / PRIV-001 / LOGIC-001 / PERF-001 |
| Severity | CRITICAL / HIGH / MEDIUM / LOW / INFO |
| Category | Security / Database / Race Condition / API / UI-UX / Privacy / Logic Gap / Performance |
| Title | Short descriptive title |
| File | Exact file path and line number |
| Description | What the problem is and why it matters |
| Steps to Reproduce | Exact steps or curl command to trigger the issue |
| Expected Behavior | What should happen |
| Actual Behavior | What currently happens |
| Fix | Concrete code change or implementation instruction |
| Rule Violated | Which of the 14 unbreakable rules this breaks (if applicable) |
| Verified Fixed | `[ ]` — check after fix is applied and retested |

### 10.1 Severity Definitions

| Severity | Area | Meaning |
|---|---|---|
| **CRITICAL** | Security / Privacy | Immediate data exposure risk, auth bypass, or unbreakable rule violation. Block deployment until fixed. |
| **HIGH** | Security / Data | Exploitable vulnerability, race condition with data corruption potential, or broken core flow. Fix before launch. |
| **MEDIUM** | API / Logic | Incorrect behavior in edge cases, missing validation, inconsistent state. Fix before launch. |
| **LOW** | UI / Performance | Cosmetic issues, minor inconsistencies, performance degradation under load. Fix post-launch if needed. |
| **INFO** | General | Observation, best practice suggestion, or future consideration. No action required before launch. |

---

## Section 11 — How to Run This Audit

### Recommended Tool

Paste each section prompt into Claude Code (`claude.ai/code`) or Cursor with your full codebase open. Claude Code has direct file access and can search across the entire repo.

### Order of Execution

1. Security (Section 2) — run first, block on any CRITICAL finding
2. Database (Section 3) — run second, verify indexes exist before load testing
3. Race Conditions (Section 4) — run third, fix atomicity before API audit
4. API (Section 5) — run fourth, all endpoints verified before UI audit
5. Logic Gaps (Section 8) — run fifth, covers edge cases missed by API audit
6. UI/UX (Section 6) — run sixth, visual and content audit
7. Privacy (Section 7) — run seventh, verify deletion cascade works
8. Performance (Section 9) — run last, measure after all fixes applied

### Expected Output

For each audit section, the AI assistant should produce a structured list of findings using the reporting template in Section 10. Collect all findings into a single findings register, sorted by severity. Fix all CRITICAL and HIGH findings before considering the app production-ready.

> **📌 NOTE:** After all fixes are applied, run the audit again from scratch (a second pass). Fixes often introduce new issues. A clean second-pass audit with zero CRITICAL or HIGH findings is the production readiness gate.

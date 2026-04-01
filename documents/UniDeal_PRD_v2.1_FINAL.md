**UniDeal**

Product Requirements Document

Version 2.1  |  March 2026

|**Field**|**Value**|
| :- | :- |
|Version|2\.1|
|Date|March 2026|
|Status|Active — In Development|
|Author|Solo Developer|
|Platform|Next.js 14+ — Desktop First, Mobile Responsive|
|Budget|₹0 / month — Entirely Free Tier|
|Launch URL|unideal.vercel.app|
|Primary Color|#2D9A54|
|Target|LPU Campus — Expandable to multi-campus|

# **1. Executive Summary**
UniDeal is a zero-budget university campus marketplace enabling students to buy and sell physical items in a structured, trustworthy, and searchable environment. It replaces chaotic WhatsApp groups with an organised platform built for campus life.

Key design decisions locked in v2.1: Google-only authentication, WhatsApp number collected at listing time (server-side only, never client-side), hard deletion for admin-removed listings, AI-flagged and banned-user listings hidden from all feeds, max 2 images per listing with client-side compression, all inputs validated and sanitised client-side, Privacy Policy and Contact pages included.

# **2. Problem Statement**
## **2.1 Current State**
- Listings disappear within hours as new messages push them out of view
- No category or price filtering — discovery requires scrolling through hundreds of messages
- No seller verification — buyers have no way to assess trust
- Contact details publicly exposed to every group member
- No mechanism to mark items as sold — repeated enquiries on sold goods
- Admins cannot moderate content — fake or inappropriate listings persist

## **2.2 Core Insight**
Students don't need a better WhatsApp. They need a structured discovery layer. UniDeal is that layer — browse, find, and connect on UniDeal, then close the deal on WhatsApp.

# **3. Product Goals**
## **3.1 Primary Goals — V1**
- Replace WhatsApp group listings with a structured, searchable campus marketplace
- Protect seller WhatsApp number — revealed as wa.me deep link only, number never client-side
- Three moderation modes: auto, AI-flagging (default), manual
- Zero monthly cost — all infrastructure on free tiers
- All inputs validated and sanitised client-side before any API request
- Images compressed client-side before upload — max 2 images per listing
- AI-flagged listings never shown in feed until admin approves — AI unavailability also triggers flagging
- Banned user listings immediately and atomically hidden from all feeds
- All destructive actions require inline Confirm Modal — no browser alerts

## **3.2 Non-Goals — V1**

|**Feature**|**Reason Cut**|**Roadmap**|
| :- | :- | :- |
|In-app chat|WhatsApp handles this|Not planned|
|Reviews & ratings|Useless without transaction volume|V2|
|Exchange / swap|Coordination complexity|V2|
|Rent / lease|Legal complexity|V3+|
|Push notifications|Needs mobile app|V2|
|Paid promotions|Too early|V3+|
|Mobile app|Web-first for V1|V2|
|Payment / escrow|Off-platform via WhatsApp|Not planned|
|Lost & found|Different flow|V2|
|Wishlist / saved|Minimal scope|V2|
|Location field|Single campus launch|V2|
|Email/password auth|Google OAuth only|Not planned|
|Password reset screen|No password auth — not needed|Not applicable|

# **4. User Personas**
## **4.1 The Buyer**
Newly enrolled or mid-program student looking for affordable second-hand goods. Price-sensitive, values trust. Browsing available without login. Contact requires login.
## **4.2 The Seller**
Graduating student with items accumulated over 3–4 years. Posts listings from desktop. Provides WhatsApp number at listing time if not already saved — number never exposed client-side.
## **4.3 The Admin**
Staff or trusted student managing the platform via an isolated admin panel accessible only from their profile page.

# **5. Authentication**
`  `**CRITICAL: Google OAuth is the ONLY login method. Email/password authentication does not exist. There is no password reset screen.**

- Google OAuth — one-tap sign in via Firebase — the only method
- On login: Firebase ID token exchanged for access JWT (15m) + refresh JWT (7d) — both HTTP-only cookies
- Username defaults to the prefix of the Google email address (e.g. john.doe@gmail.com → john.doe) — editable in profile
- No email verification gate — any logged-in user has full access immediately

# **6. User Access Model**

|**User State**|**Capabilities**|
| :- | :- |
|Guest|Browse feed (approved + not deleted + seller not banned + not AI-flagged listings only), view listing detail, search, filter. Login wall on: contact seller, post listing, report listing.|
|Logged in (user)|Everything above plus: post listings, contact sellers via WhatsApp deep link (50/day), report listings, edit/bump/mark sold/delete own listings, delete own account.|
|Admin|Everything above plus: isolated admin panel — approve, reject, hard delete listings, ban/unban users, manage categories, audit log, system config, contact inbox.|

# **7. Buyer Flow**
## **7.1 Guest**
- Lands on homepage — browses feed — AI-flagged and banned-user listings never shown
- Searches, filters, sorts — URL params preserve state
- Clicks listing → full detail page
- Taps Contact Seller → login wall → /login?returnTo=/listing/[slug]

## **7.2 Logged-In**
- All above without walls
- Contact Seller → POST /api/listings/[slug]/contact → server constructs wa.me link → window.open()
- WhatsApp number never in DOM, never in any API response
- 50 contact reveals per day — 51st returns 429

# **8. Seller Flow**
## **8.1 Posting a Listing**
- Clicks 'List an Item' → 2-step modal
- Step 1: title, category, condition, price, negotiable toggle — all validated client-side on blur
- Step 2: 1–2 photos (compressed client-side before upload), description, WhatsApp number (only if not already saved)

`  `**CRITICAL: whatsappNumber stored on User with select:false. Never in any API response. Used server-side only to build wa.me link.**

- Images compressed to max 800px wide, quality 0.8, JPEG — before upload
- Listing saved as status: pending — AI check runs in background

`  `**CRITICAL: If AI is unavailable: listing is flagged (aiFlagged:true, aiUnavailable:true) and sent to admin queue. Never auto-approved.**

- AI-flagged listings are NOT shown in any feed until admin explicitly approves

## **8.2 Managing Listings (My Dashboard)**
- Tabs: Active, Pending, Sold, Expired
- Edit: reopens modal pre-filled
- Bump: once per 7 days per listing, max 3 lifetime, resets 60-day expiry clock
- Mark as Sold, Delete (Confirm Modal required)

## **8.3 Email Notifications**

|**Trigger**|**Content**|
| :- | :- |
|Listing rejected|Rejection reason + resubmit CTA|
|Listing deleted by admin|Deletion reason + link to /contact for appeal|
|Listing expired (60 days)|Expiry notice + re-list CTA|
|Account banned|Ban reason + link to /contact for appeal|
|Account deleted|Confirmation all data permanently removed|
|Welcome|What UniDeal is + browse/list CTAs|
|Contact form auto-reply|Acknowledgement + 48hr response promise|

`  `*Note: No email is sent when a listing is approved. Sellers check status in My Dashboard.*

# **9. Admin Flow**
## **9.1 Access & Isolation**
Admin panel is completely isolated from the main app. The only entry point is a single 'Admin Panel' button on the logged-in admin's profile page. The panel has its own sidebar layout. Non-admins accessing /admin/\* receive 403. Same session — no re-login.

## **9.2 Admin Listing Deletion — Hard Delete**
`  `**CRITICAL: Admin deletion of a listing is a HARD DELETE. Document removed from MongoDB, Cloudinary images purged, seller emailed with reason.**

- No isDeleted flag for admin actions — the Listing document is permanently removed from MongoDB
- Cloudinary images deleted via API after listing document deletion
- Mandatory reason required — emailed to seller — logged to audit
- Confirm Modal shown before execution — cannot be undone

## **9.3 Banned User Listing Visibility**
`  `**CRITICAL: On ban: User.isActive=false + bulk update all seller listings: sellerBanned=true (atomic transaction). Redis cache flushed immediately.**

- sellerBanned field is denormalised onto every Listing document
- On ban: User.isActive=false + Listing.sellerBanned=true for all seller's listings — single atomic MongoDB transaction
- On unban: reverse of above — listings immediately visible again
- Every feed/search/profile query includes sellerBanned:false as a mandatory filter

## **9.4 AI-Flagged Listing Visibility**
`  `**CRITICAL: AI-flagged listings are NEVER shown in any public feed, search result, or public profile until admin explicitly approves them.**

- aiFlagged:true → listing stays pending → not visible anywhere public
- aiUnavailable:true also sets aiFlagged:true — AI being down is treated as a flag, not a pass
- Admin approves from queue → clears aiFlagged → listing goes live → cache flushed

## **9.5 Category Deletion — Conflict Resolution**
`  `**CRITICAL: Category deletion is never immediate when listings exist. Two-path resolution required.**

- System checks listing count for the category across all statuses before showing delete option
- If listings exist: Conflict Resolution Modal with two options
- Option A — Reassign: pick a target category → all listings.category updated in bulk → category deleted
- Option B — Delete all: type 'DELETE' to confirm → all listings hard deleted + Cloudinary purged + sellers emailed → category deleted
- If no listings: simple Confirm Modal — one click

## **9.6 Confirm Modals for Serious Actions**
`  `**CRITICAL: No browser alert() or confirm() anywhere. All destructive/serious actions use an inline Confirm Modal with explicit confirmation button and optional Cancel.**

|**Action**|**Modal Content**|**Confirm Input**|
| :- | :- | :- |
|Admin delete listing|Permanent deletion notice + mandatory reason dropdown|Click 'Delete permanently'|
|Admin ban user|Ban notice + listings hidden + mandatory reason dropdown|Click 'Ban user'|
|Admin delete user account|Full cascade warning|Type DELETE + click confirm|
|Admin delete category (no listings)|Simple deletion confirmation|Click 'Delete category'|
|Admin delete category (has listings)|Conflict resolution — Option A or B|Option B requires typing DELETE|
|Seller delete own listing|Permanent removal warning|Click 'Yes, delete'|
|User delete own account|Full cascade + cannot be undone|Type DELETE + click confirm|
|Admin role change|Confirmation of role change|Click 'Confirm'|

# **10. Profile**
## **10.1 Profile Fields**
- Username: auto-set from Google email prefix — editable (2–50 chars, alphanumeric/dots/underscores)
- Email: from Google — read-only
- Profile photo: from Google — displayed, not editable in V1
- Bio: optional free text — max 200 chars
- Delete account button: red — bottom of profile — Confirm Modal with type-DELETE required

`  `**CRITICAL: WhatsApp number is NOT shown on the profile page. It is stored server-side only (User.whatsappNumber, select:false). Users cannot view or edit it after saving. It is collected once at listing time if not already set.**

## **10.2 WhatsApp Number Collection**
- When 'List an Item' is opened, server checks via /api/user/whatsapp-status → returns { hasWhatsapp: boolean } only
- If hasWhatsapp:false — Step 2 shows WhatsApp number input field (required)
- If hasWhatsapp:true — no phone field shown in Step 2
- On listing submit — number validated (10-digit Indian mobile) — saved to User.whatsappNumber server-side only
- Number never returned in any API response — never visible in any UI

# **11. Input Validation & Injection Protection**
`  `**CRITICAL: All user inputs are validated AND sanitised on the client side before any API request is made. This is the first line of defence.**

|**Field**|**Client-Side Rules**|
| :- | :- |
|Title|Min 3, max 100 chars. Strip HTML tags. Block <script> patterns.|
|Description|Min 10, max 2000 chars. Strip HTML tags. No script/iframe tags.|
|Price|Positive number, max 999999, max 2 decimal places. Non-numeric blocked.|
|WhatsApp number|Exactly 10 digits. Must start with 6, 7, 8, or 9. No letters/symbols/spaces.|
|Category|Must match a valid ObjectId from server-provided list. Not free text.|
|Condition|Enum — enforced by select dropdown, not free text input.|
|Search query|Max 100 chars. Regex special chars escaped before use in URL param.|
|Username|2–50 chars. Alphanumeric, dots, underscores only.|
|Bio|Max 200 chars. Strip HTML.|
|Contact message|Min 10, max 1000 chars. Strip HTML.|

Server-side re-validation via Zod schemas is the second line of defence — independent of client validation. Client validation is UX; server validation is security.

# **12. Image Handling**

|**Rule**|**Detail**|
| :- | :- |
|Max images per listing|2|
|Max size per image|5MB before compression|
|Max total per listing|10MB before compression|
|Client-side compression|browser-image-compression library — max 800px wide, quality 0.8, normalise to JPEG|
|Server-side compression|Cloudinary: quality:auto, f\_auto on ingestion|
|Browse thumbnail|w\_400,h\_400,c\_fill,q\_auto,f\_auto|
|Listing detail|w\_900,c\_limit,q\_auto,f\_auto|
|Accepted formats|JPEG, PNG, WebP — magic byte validated server-side|
|Moderation|aws\_rek runs on upload — flags inappropriate content → aiFlagged:true|

# **13. Layout & Design Rules**
- Traditional desktop-first layout — no mobile-first drawer or tab-bar patterns
- Navbar on every page: logo (left), search bar (center), profile icon/dropdown (right)
- Hamburger menu on screens < 768px — collapses navbar links into slide-in panel
- No sidebar anywhere in the main app
- Admin panel: completely isolated — own sidebar, own layout, own entry point
- Primary color: #2D9A54 throughout all UI
- Minimal, work-focused aesthetic — no gradients, no decorative elements

# **14. Screen Inventory**
## **14.1 Student-Facing Screens**

|**ID**|**Screen**|**Access**|
| :- | :- | :- |
|S-00|Onboarding / Landing|Guest only|
|S-01|Login (Google OAuth only)|Guest only|
|S-02|Register (Google OAuth only)|Guest only|
|S-03|Homepage (hero + listings)|All users|
|S-04|Browse / Search results|All users|
|S-05|Listing detail (full page)|All users — contact requires login|
|S-06|Post / Edit listing modal|Logged in|
|S-07|My Dashboard|Logged in|
|S-08|Profile & Settings|Logged in|
|S-09|Public profile (seller view)|All users|
|S-10|Report listing modal|Logged in|
|S-11|Contact page (/contact)|All users|
|S-12|Privacy Policy (/privacy)|All users|
|S-13|Empty states / 404|All users|

## **14.2 Admin Screens (Isolated)**

|**ID**|**Screen**|**Key Content**|
| :- | :- | :- |
|A-01|Overview & stats|Stats, mode switcher, pending queue preview, recent activity|
|A-02|Moderation queue|Pending + flagged + AI-unavailable listings — approve/reject/delete|
|A-03|Reports review|Open reports — dismiss/resolve|
|A-04|User management|Ban/unban/role change/delete users|
|A-05|Category management|Add/hide/reorder — conflict resolution on delete|
|A-06|Audit log|All admin actions — read-only — paginated|
|A-07|Settings|Maintenance mode, allow new listings toggles|
|A-08|Contact inbox|All ContactMessage submissions — mark resolved|

# **15. Moderation Modes**

|**Mode**|**Behaviour**|
| :- | :- |
|Auto-approve|Listings go live unless AI flags them. AI-flagged always go to queue regardless of mode.|
|AI-flagging (default)|Listings auto-approve unless AI confidence > 0.8. Flagged + AI-unavailable go to queue.|
|Manual|Every listing requires admin approval. Highest control.|

`  `**CRITICAL: If AI is unavailable: listing is flagged (aiFlagged:true, aiUnavailable:true) and sent to admin queue. Never auto-approved.**

# **16. Success Metrics**

|**Metric**|**30-Day Target**|**90-Day Target**|
| :- | :- | :- |
|Registered users|100|500|
|Active listings|50|300|
|Contact reveals per day|10|75|
|Listings approved < 24 hrs|90%|95%|
|Fake listing reports|< 5%|< 2%|
|Mobile session share|> 60%|> 70%|
|Browse feed P95 load time|< 800ms|< 500ms|

# **17. Constraints**
- Zero monthly budget — all infrastructure on free tiers
- Solo developer — sprint-based build
- No mobile app for V1 — responsive web only
- No payment processing — WhatsApp off-platform
- Firebase free: 10,000 users/month | MongoDB Atlas M0: 512MB | Gemini: 1M tokens/month
- Vercel + MongoDB Atlas in ap-south-1 (Mumbai) for low latency
- Resend: 3,000 emails/month — covers all trigger types
- Max 2 images per listing, compressed before upload
- Every API response returns only the fields needed for that specific view
- All list endpoints paginated, API-protected, rate-limited
UniDeal PRD v2.1 — Confidential    |    Page 

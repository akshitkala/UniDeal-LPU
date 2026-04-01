**UniDeal**

UI Screen Design Document

Version 2.1  |  March 2026

# **Design System**

|**Token**|**Value**|
| :- | :- |
|Primary|#2D9A54 — buttons, links, badges, active states, navbar accent|
|Background|#FFFFFF|
|Surface|#F9F9F9 — card and input backgrounds|
|Border|#E5E5E5|
|Text primary|#1A1A1A|
|Text secondary|#666666|
|Text muted|#999999|
|Error/Destructive|#D32F2F|
|Typography|System font stack — no custom font import — fast load|
|Border radius|8px cards/inputs — 4px badges — 999px pills|
|Navbar height|64px fixed|
|Max content width|1280px centered|
|Card grid|4 desktop (1280px+) — 3 tablet (768px) — 2 mobile (480px) — 1 small|
|Card height|Fixed 280px — image 180px + info 100px|
|Breakpoints|sm:480px, md:768px, lg:1024px, xl:1280px|
|Aesthetic|Minimal, work-focused — no gradients, no decorative animations|

# **Global Component: Confirm Modal**
`  `**CRITICAL: No browser alert() or confirm() anywhere. All destructive/serious actions use an inline Confirm Modal with explicit confirmation button and optional Cancel.**

- Centered overlay — max 480px wide — white background — blurred backdrop
- Header: bold action title (e.g. 'Delete this listing?')
- Body: clear description of consequence — 'This cannot be undone.'
- Reason dropdown (admin actions): mandatory for ban, delete listing, reject listing, role change
- Type-to-confirm field (high-stakes): 'Type DELETE to confirm' — for account deletion and category cascade
- Action button: red/destructive — disabled until condition met (reason selected OR DELETE typed)
- Cancel button: grey — always enabled — closes without action
- Escape key or backdrop click → closes with Cancel behaviour

# **Global Components**
## **Navbar — On Every Main App Page**
- Height 64px — white — bottom border 1px #E5E5E5
- Left: UniDeal logo in #2D9A54
- Center: search bar max 480px — magnifier icon inside right edge
- Right: 'List an Item' button (green solid) + profile avatar/icon
- Profile dropdown (logged in): My Dashboard, Profile & Settings, Admin Panel (admin only), Logout
- Profile dropdown (guest): Login, Register
- Mobile < 768px: hamburger — slide-in panel from right — 280px wide
- Hamburger contains: search, nav links, List an Item, Login/Profile options

`  `*Note: No password reset link anywhere. Google OAuth only.*

## **Footer — Homepage, Browse, Contact, Privacy**
- 4-column desktop — stacked mobile
- Col 1: logo + 'Your campus marketplace'
- Col 2: Browse, List an Item, Login
- Col 3: LPU, About
- Col 4: Contact (/contact), Privacy Policy (/privacy)
- Bottom bar: © 2026 UniDeal — LPU Campus

## **Listing Card — All Grids**
- Fixed 280px — image 180px (Cloudinary c\_fill, max 2 images) — info 100px
- Category badge: top-left of image — green pill — white text — 11px
- Condition badge: top-right — grey pill — 11px
- Title: 14px semi-bold — 2 lines max — ellipsis
- Price: 16px bold — #2D9A54 — 'Negotiable' grey tag if applicable
- Seller + posted date: 12px muted — bottom of info area
- Full card clickable → /listing/[slug]

# **Student-Facing Screens**
`  `**S-00 — Onboarding / Landing  |  Guest only — logged-in redirect to homepage**
### **Purpose**
First impression. Communicates value, drives sign-up.
### **Layout**
- Split desktop: left brand panel — right auth panel. Mobile: stacked.
### **Left Panel**
- UniDeal logo — Headline: 'Buy and sell anything on campus'
- Subheadline: 'LPU's campus marketplace for second-hand goods'
- 3 trust points: Verified students / Contact via WhatsApp / Free to use
### **Right Panel**
- 'Continue with Google' button — full width — the ONLY auth option
- 'Already have an account? Sign in' link

`  `**CRITICAL: No email/password fields. No 'Forgot password' link. Google is the only option.**

`  `**S-01 — Login  |  Guest only**

- Centered card — no navbar — no footer
- UniDeal logo — 'Sign in' heading
- 'Continue with Google' — full width — only option
- 'New to UniDeal? Get started' → S-00

`  `*Note: No email/password form. No password reset link. No 'Forgot password'.*

`  `**S-02 — Register  |  Guest only**

- Same centered card — 'Join UniDeal' heading
- 'Continue with Google' — full width — only option
- Username auto-set from email prefix after registration — editable in profile

`  `**S-03 — Homepage  |  All users**
### **Sections**
- Navbar
- Hero: headline, subheadline, 'Browse Listings' + 'List an Item' CTAs — text only, no image
- How It Works: 3 steps — Post / Browse / Connect
- Latest listings: 20 cards in 4-column grid
- List an Item CTA section: grey bg — description + CTA
- Footer

`  `*Note: Feed shows only listings matching all four conditions: approved + !isDeleted + !sellerBanned + !aiFlagged*

`  `**S-04 — Browse / Search Results  |  All users**
### **Filter Bar**
- Sticky — category chips (horizontal scroll, each shows count) — condition dropdown — price min/max — sort select — active filter count badge — 'Clear all' link
### **Grid**
- 4-col desktop — listing card component — results count above — 'Load more' pagination
### **Empty State**
- Icon + 'No listings found' + 'Clear filters' button

`  `*Note: URL params preserve filter state: ?category=&condition=&sort=&q=*

`  `**S-05 — Listing Detail Page  |  All users — contact requires login**
### **Layout**
- Two-column desktop: left 60% images, right 40% info. Single column mobile.
### **Left — Images**
- Max 2 images — main image (object-fit: contain) + 1 thumbnail below
- Mobile: swipe carousel between 2 images
### **Right — Info Panel**
- Category breadcrumb — title (24px bold) — price (28px #2D9A54) — Negotiable badge if applicable
- Condition badge (colour-coded: New=green, Like New=teal, Good=blue, Used=amber, Damaged=red)
- Posted date — view count
- Full description (15px, line-height 1.6)
- Seller row: avatar + username + 'View profile' link
- Contact Seller button: full width green 48px — sticky at bottom on mobile
- 'Report this listing' grey link below button

|**Contact State**|**Appearance**|**Behaviour**|
| :- | :- | :- |
|Guest|Green + lock icon|→ /login?returnTo=/listing/[slug]|
|Logged in|'Contact Seller' green|POST /contact → window.open(waLink) — number never in DOM|
|Rate limited (50/day)|Grey disabled|'Daily limit reached. Try again tomorrow'|
|No number saved|Grey disabled|'Contact not available'|

`  `**S-06 — Post / Edit Listing Modal  |  Logged in**
### **Layout**
- Desktop: centered dialog max 560px. Mobile: bottom sheet 90dvh.
### **Step 1 of 2**
- Title, Category dropdown, Condition select, Price input (₹ prefix), Negotiable toggle
- All fields validated client-side on blur — inline error messages
- 'Next' disabled until all required fields pass validation
### **Step 2 of 2**
- Photo upload: exactly 2 slots — first is 'Add photo' — uploaded images show with X remove
- Images compressed client-side (max 800px, quality 0.8, JPEG) before upload
- WhatsApp number field: shown ONLY if server returns hasWhatsapp:false from /api/user/whatsapp-status
- WhatsApp validation: 10-digit Indian mobile — on blur — inline error
- Description textarea: min 10, max 2000 chars — char counter shown
- Submit: 'Uploading...' spinner — success: modal closes + toast 'Listing submitted for review'

`  `**CRITICAL: WhatsApp number saved server-side only. Never echoed back. Field disappears after first submission.**

`  `**S-07 — My Dashboard  |  Logged in**

- Navbar — 'My listings' heading — '+ List an item' button
- Tabs: Active / Pending / Sold / Expired — each with count badge
- 3-col desktop — action buttons below each card
### **Card Actions by Status**

|**Status**|**Actions**|
| :- | :- |
|Active|Bump (with cooldown state) — Edit — Mark Sold — Delete|
|Pending|'Under review' badge — Edit — Delete|
|Sold|'Sold' badge — Delete|
|Expired|'Expired' badge — Re-list (opens modal fresh) — Delete|
### **Delete Listing**
- Click Delete → Confirm Modal: 'Delete this listing? It will be permanently removed.' — 'Yes, delete' (red) + 'Cancel' — NO browser alert
### **Bump States**
- Available: 'Bump listing' green outline — shows 'X bumps remaining'
- On cooldown: 'Bump in X days' — grey — disabled
- Max reached: 'Max bumps used' — grey — disabled

`  `**S-08 — Profile & Settings  |  Logged in**
### **Profile Header**
- Google profile photo — username (editable) — email (read-only) — member since
### **Editable Fields**
- Username: text input — 2–50 chars, alphanumeric/dots/underscores — validated on blur
- Bio: textarea — optional — max 200 chars
- Email: read-only from Google — not editable

`  `**CRITICAL: WhatsApp number is NOT shown anywhere on this page. It is stored server-side only. Users cannot view it.**
### **Admin Section (admin-role only)**
- 'Open Admin Panel' — green button — links to /admin/overview
### **Danger Zone**
- 'Delete my account' — red button — opens Confirm Modal
- Modal: 'This will permanently delete your account and all your listings. This cannot be undone.' — user types DELETE — clicks 'Delete my account' (red)

`  `**S-09 — Public Profile (Seller View)  |  All users**

- Seller Google photo — username — member since — bio if set
- Active listings grid — same card component — cursor paginated
- No WhatsApp shown — contact via listing detail only

`  `*Note: Feed applies four-condition filter — banned/flagged/deleted listings not shown*

`  `**S-10 — Report Listing Modal  |  Logged in**

- Trigger: 'Report this listing' link on listing detail
- Reason dropdown (required): Fake listing / Wrong price / Inappropriate / Already sold / Spam / Other
- Description (optional): max 500 chars — HTML stripped
- Submit → toast: 'Report submitted. We'll review it shortly.'

`  `**S-11 — Contact Page (/contact)  |  All users**

- Navbar + Footer
- 'Contact Us' heading — 'Have a question or complaint? We respond within 48 hours.'
- Name: pre-filled from displayName if logged in
- Email: pre-filled if logged in — read-only if logged in
- Subject dropdown: Bug report / Ban appeal / Listing dispute / General enquiry / Other
- Message: min 10, max 1000 chars — HTML stripped — validated client-side
- 'Send message' green button
- Rate limit: 3/day — 4th shows '429: Too many messages. Try again tomorrow.'
- Success: green banner 'Message sent. We'll get back to you within 48 hours.'

`  `*Note: This page is linked in footer and in ban + admin-deletion emails.*

`  `**S-12 — Privacy Policy (/privacy)  |  All users**

- Navbar + Footer — static page — no dynamic data
- 'Privacy Policy' heading — 'Last updated: March 2026'
### **8 Sections**
- 1. What we collect: Google name/email/photo, WhatsApp number (server-side only), listing content, usage data
- 2. How we use data: power the marketplace, listing communications, enforce platform rules
- 3. What we don't do: sell data, expose WhatsApp numbers publicly, use advertising cookies
- 4. Third-party services: Firebase, Cloudinary, Resend, Upstash, MongoDB Atlas, Sentry
- 5. Data retention: retained while account active — deleted within 24hrs of account deletion
- 6. Cookies: HTTP-only session cookies only — no tracking or advertising cookies
- 7. Your rights: delete account and all data anytime from Profile → Delete my account
- 8. Contact: privacy concerns via /contact

`  `**S-13 — Empty States & 404  |  All users**

- 404: Navbar — large '404' in #2D9A54 — 'Page not found' — 'Go to homepage' green button
- Browse empty: icon + 'No listings found' + 'Clear filters' button
- Search empty: 'No results for [query]' + 'Try a different search'
- Dashboard empty (Active tab): 'No active listings' + 'List your first item' CTA

# **Admin Panel Screens — Isolated Layout**
`  `*Note: Completely isolated. Own sidebar layout. Only entry: Profile → Open Admin Panel. Non-admins get 403.*
## **Admin Layout**
- Left sidebar: 240px fixed — white — right border 1px #E5E5E5
- Top: UniDeal logo + 'Admin' red badge
- Nav links: Overview, Queue (count), Reports (count), Users, Categories, Audit Log, Settings, Contacts (count)
- Bottom: 'Back to app' arrow link
- Main content: remaining width — #F5F5F5 background — 32px padding
- Mobile: sidebar collapses to top hamburger — same content

`  `**A-01 — Overview & Stats  |  Admin only**

- 4 stat cards: Total Users / Active Listings / Pending Review / Open Reports
- Mode switcher: Auto / AI-flagging / Manual — green=active — instant on click + logged
- Pending queue preview: 5 listings — aiFlagged in orange, aiUnavailable in amber
- Recent activity: last 10 audit entries — compact rows

`  `**A-02 — Moderation Queue  |  Admin only**

- Filter: Pending / AI-flagged / AI-unavailable / All — default: Pending
- Sort: oldest first (default), newest, flagged first
- AI-flagged rows: orange left border — confidence score + reason shown
- aiUnavailable rows: amber badge 'AI was down at submission — manual review required'
- Approve: one click — clears aiFlagged — status:approved — cache flushed
- Reject: mandatory reason dropdown → Confirm Modal → email to seller — logged
- Hard delete: mandatory reason dropdown → Confirm Modal → Cloudinary purge → email — logged

`  `**CRITICAL: Reject and delete both require mandatory reason AND Confirm Modal. Never a direct action.**

`  `**A-03 — Reports Review  |  Admin only**

- Table: listing title — reason — reporter email — date — status — actions
- Dismiss (optional note) / Resolve (optional note) — no Confirm Modal needed (non-destructive)
- Link to listing detail in each row

`  `**A-04 — User Management  |  Admin only**

- Table: avatar + username — email — role badge — join date — listing count — status — actions
- Search by email — above table
- Ban: mandatory reason dropdown → Confirm Modal ('This will ban [email] and hide all their listings') → atomic transaction → email
- Unban: direct — no confirm needed — reverse atomic
- Role change: Confirm Modal → logged
- Delete: type DELETE in Confirm Modal → 8-step cascade → logged

`  `**CRITICAL: On ban: User.isActive=false + bulk update all seller listings: sellerBanned=true (atomic transaction). Redis cache flushed immediately.**

`  `**A-05 — Category Management  |  Admin only**

- Table: drag handle — emoji icon — name — listing count — active toggle — edit — delete
- Toggle isActive: immediate — no confirm needed
- Delete (no listings): Confirm Modal — 'Delete category [name]?' — 'Delete' button
- Delete (has listings): Conflict Resolution Modal appears instead
### **Conflict Resolution Modal**
- Header: 'Category [name] has [N] listings'
- Option A — 'Reassign listings': select target category dropdown → 'Reassign and delete category' button
- Option B — 'Delete all listings': 'This will permanently delete [N] listings and notify sellers.' → type DELETE → red 'Delete all and remove category' button
- Option B emails every affected seller before executing

`  `**A-06 — Audit Log  |  Admin only**

- Table: timestamp — actor — action pill (colour-coded) — target — reason — IP masked
- Action pills: green=created/approved, blue=updated, orange=flagged, red=deleted/banned
- Filter: action type, actor email, date range
- Cursor paginated — 50 per page — newest first
- Read-only — no edit or delete controls

`  `**A-07 — System Settings  |  Admin only**

- Maintenance mode toggle: 'Show maintenance banner to all users. Your admin access is unaffected.'
- Allow new listings toggle: 'Disable to prevent any new listings from being posted.'
- Both: instant effect — SystemConfig singleton updated — audit logged

`  `**A-08 — Contact Inbox  |  Admin only**

- Table: name — email — subject — date — status (open/resolved) — actions
- Click row: view full message in expanded panel
- 'Mark resolved' button — no Confirm Modal (non-destructive)
- Filter: open / resolved — default: open
- Count badge on sidebar link shows open count
UniDeal UI v2.1    |    Page 

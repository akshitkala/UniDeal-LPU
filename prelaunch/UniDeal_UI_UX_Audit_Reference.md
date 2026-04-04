# UniDeal — UI/UX & Content Audit Reference

| Field | Value |
|---|---|
| Purpose | Visual + content audit reference — check against every screen before launch |
| Design System | Minimal, white-dominant, Shopcart-inspired — brand green `#16a34a` |
| Breakpoints | 375px (mobile) · 768px (tablet) · 1440px (desktop) |

---

## Design System Rules

### Typography — Never Violate

| Element | Mobile | Desktop |
|---|---|---|
| Hero headline | `text-3xl font-bold` | `text-5xl font-bold` |
| Page title | `text-xl font-semibold` | `text-2xl font-semibold` |
| Section heading | `text-base font-semibold` | `text-lg font-semibold` |
| Card title | `text-sm font-semibold` | `text-sm font-semibold` |
| Body text | `text-sm leading-6` | `text-sm leading-6` |
| Secondary / meta | `text-xs text-gray-500` | `text-xs text-gray-500` |
| Badge / pill | `text-xs font-medium` | `text-xs font-medium` |

> **⚠ NEVER USE:** `text-4xl+` outside hero · `font-black` outside hero/stats · uppercase on names/buttons/titles · ALL CAPS anywhere

### Button Scale — Never Violate

| Type | Size | Style |
|---|---|---|
| Primary action | `h-10 px-5 text-sm rounded-full` | `bg-[#16a34a] text-white` |
| Secondary action | `h-10 px-5 text-sm rounded-full` | `border border-gray-200 bg-white` |
| Destructive action | `h-9 px-4 text-sm rounded-full` | `border border-red-200 text-red-500` |
| Icon button | `w-9 h-9 rounded-full` | `hover:bg-gray-100` |
| Small card action | `h-7 px-2.5 text-xs rounded-full` | context-dependent |
| Tab (active) | `h-8 px-3 text-xs rounded-full` | `bg-gray-900 text-white` |
| Tab (inactive) | `h-8 px-3 text-xs rounded-full` | `bg-gray-100 text-gray-600` |
| Filter chip (active) | `h-8 px-3 text-xs rounded-full uppercase` | `bg-gray-900 text-white` |
| Filter chip (inactive) | `h-8 px-3 text-xs rounded-full uppercase` | `bg-gray-100 text-gray-600` |

### Layout Rules

| Element | Rule |
|---|---|
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-6` |
| Navbar | `h-16 fixed top` → `pt-16` on all pages |
| Tab bar | `h-14 fixed bottom` — mobile only (`md:hidden`) → `pb-16` on mobile pages |
| Admin sidebar | `w-60` desktop / hamburger overlay mobile |
| All modals | Bottom sheet mobile (90dvh) / centered dialog desktop |

### Listing Card — Single Component Used Everywhere

```
Image:  aspect-square bg-gray-50 object-contain p-3
Body:   p-2.5 sm:p-3
Row 1:  category (text-xs text-gray-400) + condition badge
Row 2:  title (text-sm font-semibold line-clamp-2)
Row 3:  price (text-base font-bold) + negotiable badge
Row 4:  seller name + timestamp (ONLY shown if < 6 days old, nothing after 6 days)
```

### Responsive Grids

```
Listing grid:  grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
Stats grid:    grid-cols-2 lg:grid-cols-4
Admin stats:   grid-cols-2 lg:grid-cols-4
```

---

## Screen-by-Screen Audit

### `/` — Homepage

| Check Item | Priority | Done |
|---|---|---|
| Hero headline: `Buy and sell on campus.` — exact text | HIGH | `[ ]` |
| Hero subtext: `List what you have. Find what you need. Connect directly on WhatsApp.` | HIGH | `[ ]` |
| Hero has no campus photo — white/light background only | HIGH | `[ ]` |
| `Browse listings` (primary green) + `Start selling →` (secondary outline) CTAs | MEDIUM | `[ ]` |
| Latest Listings section shows 8+ listing cards in correct `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` grid | MEDIUM | `[ ]` |
| Footer links: About · Browse · Contact · Privacy | HIGH | `[ ]` |
| Footer disclaimer: `© 2026 UniDeal. Not affiliated with any university.` | HIGH | `[ ]` |
| How it works: 3 steps shown — Post → Find → Connect | MEDIUM | `[ ]` |

### `/browse` — Browse Page

| Check Item | Priority | Done |
|---|---|---|
| Filter chips horizontal scroll row — all active categories visible | HIGH | `[ ]` |
| Condition dropdown present | MEDIUM | `[ ]` |
| Price range inputs present | MEDIUM | `[ ]` |
| Sort dropdown: Newest / Oldest / Price Low–High / Price High–Low | MEDIUM | `[ ]` |
| Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` | HIGH | `[ ]` |
| Infinite scroll via IntersectionObserver — **no** Load More button | HIGH | `[ ]` |
| Empty state: `Nothing found.` + clear filters CTA when no results | HIGH | `[ ]` |
| URL params update on filter change — shareable filtered URL | MEDIUM | `[ ]` |
| Search bar: debounced 400ms — updates results without page reload | MEDIUM | `[ ]` |

### `/listing/[slug]` — Listing Detail

| Check Item | Priority | Done |
|---|---|---|
| Full page — **no** drawer, **no** bottom sheet | CRITICAL | `[ ]` |
| Max 2 images displayed — carousel or main + thumbnail | HIGH | `[ ]` |
| Contact Seller button sticky at bottom on mobile | HIGH | `[ ]` |
| Guest sees lock icon on Contact — tapping redirects to `/login?returnTo=/listing/[slug]` | HIGH | `[ ]` |
| Non-approved listing shows neutral `No such listing available` — not 404, not error page | HIGH | `[ ]` |
| Owner sees status banner (Under Review / Rejected / Sold / Expired) — NOT the neutral page | HIGH | `[ ]` |
| Share: native share on mobile, copy URL on desktop | MEDIUM | `[ ]` |
| Report icon: opens modal — logged-in only | MEDIUM | `[ ]` |

### `/listing/[slug]/edit` — Edit Listing

| Check Item | Priority | Done |
|---|---|---|
| Edit page loads only for listing owner — 403 for others | CRITICAL | `[ ]` |
| Form pre-filled with current listing data | HIGH | `[ ]` |
| Max 2 images enforced — existing images shown with remove X | HIGH | `[ ]` |
| On save: status resets to `pending` — AI check fires again | HIGH | `[ ]` |
| Cancel returns to listing page without saving | MEDIUM | `[ ]` |

### `/dashboard` — My Dashboard

| Check Item | Priority | Done |
|---|---|---|
| 4 tabs: Active \| Under Review \| Rejected \| Sold — counts in parentheses | HIGH | `[ ]` |
| Active card shows: Bump \| Edit \| Mark as sold \| Delete | HIGH | `[ ]` |
| Bump button shows cooldown timer OR `Max bumps reached` — correctly per state | HIGH | `[ ]` |
| Under Review card shows: Delete only + `Under review` label | HIGH | `[ ]` |
| Rejected card shows: rejection reason + `Edit and resubmit` (green) + Delete | HIGH | `[ ]` |
| Sold card is read-only — no actions shown | MEDIUM | `[ ]` |
| All destructive actions use Confirm Modal — **no** `alert()` | CRITICAL | `[ ]` |
| Empty Active tab: `You haven't listed anything yet.` + List an Item CTA | HIGH | `[ ]` |

### `/profile` — Profile Page

| Check Item | Priority | Done |
|---|---|---|
| Title: `Profile` — Subtitle: `Manage your account` | MEDIUM | `[ ]` |
| Avatar: `w-16 h-16 rounded-full` — initial fallback if no photoURL | MEDIUM | `[ ]` |
| Display name: editable text input | HIGH | `[ ]` |
| Email: read-only, not editable | HIGH | `[ ]` |
| WhatsApp: input shown if not saved — `WhatsApp contact saved ✓` + Update link if saved | HIGH | `[ ]` |
| WhatsApp **number is never displayed** — only boolean state | CRITICAL | `[ ]` |
| Save button: `h-10 rounded-full` — right-aligned — not full width | MEDIUM | `[ ]` |
| Admin users see green `Admin Panel` button linking to `/admin/overview` | HIGH | `[ ]` |
| Delete account section — confirm modal requires typing `DELETE` | HIGH | `[ ]` |
| No `DANGER ZONE` heading | MEDIUM | `[ ]` |

### `/login` — Login Page

| Check Item | Priority | Done |
|---|---|---|
| Single button: `Sign in with Google` — no other sign-in options | CRITICAL | `[ ]` |
| No university email hint or LPU domain suggestion | HIGH | `[ ]` |
| Logged-in users redirected away from `/login` | HIGH | `[ ]` |
| `returnTo` param handled — returns user to original destination after login | HIGH | `[ ]` |

### `/contact` — Contact Page

| Check Item | Priority | Done |
|---|---|---|
| Form fields: Name, Email, Subject (dropdown), Message | MEDIUM | `[ ]` |
| Name and email pre-filled if user is logged in | LOW | `[ ]` |
| Rate limit: 3 submissions/day per IP — 4th shows error | HIGH | `[ ]` |
| Auto-reply email sent after submission | MEDIUM | `[ ]` |
| Admin receives email notification | MEDIUM | `[ ]` |

### Admin — `/admin/overview`

| Check Item | Priority | Done |
|---|---|---|
| Accessible only via Profile button — direct URL returns 403 for non-admins | CRITICAL | `[ ]` |
| Stats cards: Total Users, Active Listings, Pending Review, Open Reports | HIGH | `[ ]` |
| Approval mode switcher: 3 radio cards (Auto / AI Flagging / Manual) | HIGH | `[ ]` |
| Recent activity: last 10 audit entries | MEDIUM | `[ ]` |
| `Back to app` link in sidebar | MEDIUM | `[ ]` |

### Admin — `/admin/queue`

| Check Item | Priority | Done |
|---|---|---|
| AI-flagged listings shown first — `aiUnavailable` listings shown second | HIGH | `[ ]` |
| No AI mentions — listings shown as `Under review` only | HIGH | `[ ]` |
| `aiUnavailable` listings show amber badge: `Review required` (no AI mention) | HIGH | `[ ]` |
| Approve clears flag — listing appears in browse feed | CRITICAL | `[ ]` |
| Reject requires mandatory reason — rejection email sent | HIGH | `[ ]` |
| Hard delete removes from MongoDB + purges Cloudinary | CRITICAL | `[ ]` |

### Admin — `/admin/reports`

| Check Item | Priority | Done |
|---|---|---|
| Shows reporter: avatar + name + email + joined date | HIGH | `[ ]` |
| Shows reported listing: thumbnail + title + seller + status badge | HIGH | `[ ]` |
| Shows report reason as colored badge | HIGH | `[ ]` |
| Dismiss and Mark Reviewed actions with optional note | HIGH | `[ ]` |
| Handles deleted listings gracefully (`Listing no longer exists`) | MEDIUM | `[ ]` |

### Admin — `/admin/users`

| Check Item | Priority | Done |
|---|---|---|
| User list with email, role, join date, listing count, ban status | HIGH | `[ ]` |
| Ban requires mandatory reason from dropdown | HIGH | `[ ]` |
| Role change (user ↔ admin) with confirm modal | HIGH | `[ ]` |
| Delete user requires typing `DELETE` — triggers cascade | HIGH | `[ ]` |

### Admin — General

| Check Item | Priority | Done |
|---|---|---|
| No `GOVERNANCE`, `CMS`, `NETWORK STATUS`, `GLOBAL SYNCHRONIZED` text | HIGH | `[ ]` |
| No AI mentions anywhere in admin UI | HIGH | `[ ]` |
| No fake percentages or made-up stats | HIGH | `[ ]` |
| Admin sidebar: hamburger overlay on mobile | MEDIUM | `[ ]` |
| All destructive admin actions use Confirm Modal — no `alert()` | CRITICAL | `[ ]` |

---

## Content Rules Grep Checklist

Run these searches across the full codebase before launch:

| Grep Command | Expected Result | Priority | Done |
|---|---|---|---|
| `grep -r 'alert(' --include='*.tsx' --include='*.ts'` | ZERO results | CRITICAL | `[ ]` |
| `grep -r 'confirm(' --include='*.tsx' --include='*.ts'` | ZERO results | CRITICAL | `[ ]` |
| `grep -ri 'LPU\|Lovely Professional\|campus-verified\|LPU Verified'` | ZERO results | HIGH | `[ ]` |
| `grep -ri '\bAI\b\|artificial intelligence\|AI-flagged' in JSX strings` | ZERO results | HIGH | `[ ]` |
| `grep -ri 'verified student\|university verified'` | ZERO results | HIGH | `[ ]` |
| `grep -r 'whatsappNumber' in API response objects` | ZERO outside `select:false` definition | CRITICAL | `[ ]` |
| `grep -r 'new Redis(' --include='*.ts'` | ZERO outside `lib/cache/redis.ts` | HIGH | `[ ]` |
| `grep -r 'Not affiliated with any university'` | Appears in footer component | HIGH | `[ ]` |

---

## Accessibility Checklist

| Check Item | Priority | Done |
|---|---|---|
| All icon-only buttons have `aria-label` | HIGH | `[ ]` |
| Confirm modal: Escape key closes, Enter key confirms | HIGH | `[ ]` |
| Color contrast: `#16a34a` on white passes WCAG AA | HIGH | `[ ]` |
| Listing images have `alt={listing.title}` | MEDIUM | `[ ]` |
| Focus trap in modals — keyboard navigation doesn't escape | MEDIUM | `[ ]` |
| Form error messages are associated with inputs via `aria-describedby` | MEDIUM | `[ ]` |

---

## Empty States Reference

| Screen / State | Copy | CTA |
|---|---|---|
| Browse — no results | `Nothing found.` | Clear filters |
| Browse — no listings at all | `No listings yet.` | List an Item |
| Dashboard Active — empty | `You haven't listed anything yet.` | List an Item |
| Dashboard Under Review — empty | `No listings under review.` | — |
| Dashboard Rejected — empty | `No rejected listings.` | — |
| Dashboard Sold — empty | `No sold listings yet.` | — |
| Admin Queue — empty | `No pending listings. All clear.` | — |
| Admin Reports — pending empty | `No pending reports.` | — |
| Search — no results | `Nothing found for "{query}".` | Clear search |

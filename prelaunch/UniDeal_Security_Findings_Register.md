# UniDeal Pre-Launch: Security & Vulnerability Register

This document tracks all identified security issues, logic gaps, and policy violations discovered during the pre-production audit.

## Findings Summary

| Severity | Count | Fixed |
|---|---|---|
| **CRITICAL** | 1 | 1 |
| **HIGH** | 4 | 4 |
| **MEDIUM** | 8 | 8 |
| **LOW** | 1 | 1 |
| **Total** | 14 | 14 |

---

## Findings Registry

| ID | Severity | File / Location | Description | Fix | Rule Violated | Fixed |
|---|---|---|---|---|---|---|
| SEC-001 | CRITICAL | src/app/api/listings/[slug]/route.ts:38 | `whatsappNumber` is explicitly populated and returned in the listing detail response. | Remove `+whatsappNumber` from the populate selection. | 1, 42, 90 | [x] |
| SEC-002 | HIGH | next.config.ts | `Content-Security-Policy` header is missing from the global security headers configuration. | Add a robust `Content-Security-Policy` to the `headers()` array. | 117 | [x] |
| SEC-003 | MEDIUM | src/app/api/listings/route.ts:141 | Seller `email` is included in the browse feed response, which is unnecessary PII for the UI. | Remove `email` from the seller populate in the browse endpoint. | 7.2 | [x] |
| RACE-001 | HIGH | src/app/api/listings/[slug]/bump/route.ts | Read-then-write pattern allows bypassing bump limits and cooldowns via simultaneous requests. | Use atomic `findOneAndUpdate` with condition checks. | 186 | [x] |
| RACE-002 | MEDIUM | src/app/api/admin/users/[id]/route.ts | Ban operation is not atomic, leading to potential inconsistencies in cascading `sellerBanned` flags. | Use atomic `findOneAndUpdate` with condition checks for banning. | 4.3 | [x] |
| RACE-003 | MEDIUM | src/app/api/listings/[slug]/report/route.ts | Duplicate check followed by create allows multiple reports from the same user under race conditions. | Use atomic `updateOne` with `upsert:true`. | 4.2 | [x] |
| UI-001 | HIGH | src/app/api/user/profile/route.ts:21 | `isLpuVerified` field is exposed in the profile response, violating "No university name" rules. | Remove `isLpuVerified` from the selection projection. | 55, 301 | [x] |
| DB-001 | MEDIUM | src/lib/db/connect.ts:26 | `maxPoolSize: 10` exceeds the recommended limit of 5 for MongoDB Atlas M0 free tier. | Reduce `maxPoolSize` to 5. | 159 | [x] |
| DB-002 | MEDIUM | src/lib/db/models/SystemConfig.ts:37-39 | `getSystemConfig` uses `findById + create` which is not atomic for initial creation. | Use `findOneAndUpdate` with `upsert:true`. | 163 | [x] |
| DB-003 | MEDIUM | src/app/api/admin/categories/[id]/route.ts:39-58 | Listings are moved to 'miscellaneous' instead of being hard-deleted during category deletion. | Hard delete listings instead of moving them to comply with Rule 166. | 166 | [x] |
| UI-002 | LOW | src/components/listing/ListingCard.tsx:138 | Timestamp is hardcoded as "Now" instead of using relative time formatting (e.g., "2h ago"). | Implement `formatDistanceToNow` or similar utility for relative timestamps. | 9.2 | [x] |
| A11Y-001 | MEDIUM | src/components/listing/ListingCard.tsx:63 | Card is interactive but lacks `role="button"` and keyboard support (`onKeyDown`). | Add `role="button"`, `tabIndex={0}`, and `onKeyDown` listener for accessibility. | 10.1 | [x] |
| UI-003 | MEDIUM | src/app/listing/[slug]/page.tsx:177, 180 | Standard browser `alert()` used for error feedback instead of a toast or custom modal. | Replace `alert()` with a custom toast notification or inline error message. | 9.3, 106 | [x] |
| UI-004 | HIGH | src/app/listing/[slug]/page.tsx:338 | "LPU Campus" is hardcoded as the pickup location, violating university affiliation rules. | Remove university name; replace with generic "Campus Pickup" or dynamic location. | 55, 320 | [x] |

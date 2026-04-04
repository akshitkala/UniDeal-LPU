# UniDeal — Race Conditions & Logic Gaps Reference

| Field | Value |
|---|---|
| Purpose | Developer reference — fix patterns for every identified race condition and logic gap |
| Priority | Fix race conditions BEFORE deploying — they cause data corruption under real traffic |

---

## Race Conditions

### RC-01: Bump Race Condition

> **⚠ CRITICAL — Two simultaneous bump requests can bypass the max-3 and 7-day cooldown rules. This is the most exploitable race condition.**

**Scenario:** Two browser tabs both tap 'Bump' simultaneously. Both read `bumpCount=2`. Both pass the `< 3` check. Both increment. Result: `bumpCount` becomes 4, or cooldown is bypassed.

#### ❌ Wrong Pattern (Read-Then-Write)

```typescript
const listing = await Listing.findById(id);
if (listing.bumpCount >= 3) return res.status(400).json({ error: 'Max bumps reached' });
if (listing.lastBumpAt > sevenDaysAgo) return res.status(400).json({ error: 'Cooldown active' });

listing.bumpCount++;  // RACE: two requests both read bumpCount=2
await listing.save(); // Both write bumpCount=3, or one gets 3, one gets 4
```

#### ✅ Correct Pattern (Atomic Conditional Update)

```typescript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const now = new Date();

const updated = await Listing.findOneAndUpdate(
  {
    _id: listingId,
    seller: req.user._id,
    bumpCount: { $lt: 3 },
    $or: [
      { lastBumpAt: { $lt: sevenDaysAgo } },
      { lastBumpAt: { $exists: false } }
    ]
  },
  {
    $inc: { bumpCount: 1 },
    $set: {
      bumpedAt: now,
      lastBumpAt: now,
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    }
  },
  { new: true }
);

if (!updated) {
  // Condition failed — check which one to give correct error
  const listing = await Listing.findById(listingId);
  if (listing.bumpCount >= 3) return res.status(400).json({ error: 'Max bumps reached' });
  return res.status(400).json({ error: 'Cooldown active' });
}
```

---

### RC-02: Ban Race Condition

> **⚠ CRITICAL — If ban fails mid-operation (User updated but Listings not), banned user's listings remain visible in the feed.**

**Scenario:** Ban operation partially succeeds. `User.isActive=false` but `Listing.sellerBanned` not updated. Banned user's listings remain public.

#### ✅ Correct Pattern (MongoDB Transaction)

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  await User.findOneAndUpdate(
    { uid: targetUid },
    { isActive: false },
    { session }
  );

  await Listing.updateMany(
    { seller: userId },
    { sellerBanned: true },
    { session }
  );

  await session.commitTransaction();

  // Flush AFTER commit — cache reflects committed state
  await redis.del('feed:browse:*');
  await sendBanEmail(user.email, reason);
  await logAction('USER_BANNED', { actor, target: userId, reason });

} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

---

### RC-03: Duplicate Report Race Condition

**Scenario:** User double-taps 'Report'. Two simultaneous `POST /api/listings/[slug]/report` requests. Both pass the "has user reported this?" check. Two Report documents created for same user+listing.

#### ✅ Fix: Unique Compound Index + Insert-then-catch

```typescript
// In lib/db/indexes.ts — add this index
Report.collection.createIndex(
  { listing: 1, reportedBy: 1 },
  { unique: true }
);

// In POST /api/listings/[slug]/report
try {
  await Report.create({ listing, reportedBy, reason, description });
  return res.status(201).json({ success: true });
} catch (err) {
  if (err.code === 11000) {
    // Duplicate — user already reported this listing
    return res.status(409).json({ error: 'You have already reported this listing' });
  }
  throw err;
}
```

---

### RC-04: Concurrent Account Deletion vs Admin Approval

**Scenario:** User triggers account deletion. Admin simultaneously approves one of their listings. Listing may be approved and go public after user is deleted — orphaned listing with no seller.

#### ✅ Fix: Delete Listings Before User Document

```typescript
// CORRECT cascade order in DELETE /api/user/me:

// Step 1: Hard delete all listings FIRST (before user document deleted)
const listings = await Listing.find({ seller: userId });
for (const listing of listings) {
  await cloudinary.api.delete_resources(listing.images.map(getPublicId));
}
await Listing.deleteMany({ seller: userId });

// If admin approves between step 1 and 2, approval query finds no listing → fails gracefully

// Step 2: THEN delete user document
await User.findOneAndDelete({ uid });
```

---

## Logic Gaps

### LG-01: Banned User Pending Listings Pollute Queue

**Scenario:** Admin bans a user who has 3 pending listings. `sellerBanned:true` set on all. Pending listings remain in admin queue. Admin cannot approve them (would violate feed filter). Queue polluted indefinitely.

**Fix: Auto-reject pending listings on ban**

```typescript
// After ban transaction commits:
await Listing.updateMany(
  { seller: userId, status: 'pending' },
  {
    status: 'rejected',
    rejectionReason: 'Seller account has been banned'
  }
);
// These listings move out of the pending queue automatically
```

---

### LG-02: Approval Mode Change Retroactive Behavior

**Scenario:** Admin switches from `manual` to `auto-approve`. All currently pending listings should NOT be auto-approved. Mode should only affect new submissions going forward.

**Expected behavior:**

```typescript
// In POST /api/listings — check mode AT SUBMISSION TIME only:
const config = await SystemConfig.findById('global');
const initialStatus = config.approvalMode === 'automatic' ? 'approved' : 'pending';
// Save listing with status = initialStatus

// PATCH /api/admin/config (mode change) should NEVER touch existing listings
// Verify no updateMany({ status: 'pending' }, ...) runs on mode change
```

---

### LG-03: Category Delete Check Missing Non-Approved Listings

**Scenario:** The check endpoint counts only `approved` listings. `pending` and `rejected` listings under the deleted category become orphaned with a reference to a non-existent category ID.

**Fix: Count ALL non-deleted listings regardless of status**

```typescript
// GET /api/admin/categories/[id]/check
const affectedCount = await Listing.countDocuments({
  category: categoryId,
  isDeleted: false,
  // No status filter — count pending, approved, rejected, sold
});

return res.json({ canDelete: affectedCount === 0, affectedCount });
```

---

### LG-04: Listing Edit Mid-Review — Document Expected Behavior

**Scenario:** Admin is reviewing a pending listing. Seller edits it simultaneously. Status resets to pending. Admin was looking at old data.

**This is correct behavior — but it must be explicitly implemented:**

```typescript
// In PATCH /api/listings/[slug]:
// Always reset to pending on any edit
const updateData = {
  ...validatedFields,
  status: 'pending',       // Always reset
  aiFlagged: false,        // Clear previous AI flag
  aiUnavailable: false,    // Clear previous AI unavailable flag
  aiVerification: { checked: false } // Trigger AI recheck
};

await Listing.findOneAndUpdate(
  { slug, seller: req.user._id },
  updateData
);

// Then fire AI check again (same as on create)
checkListingAsync(listing);
```

---

### LG-05: Expiry Cron Hitting Non-Approved Listings

**Scenario:** If `expiresAt` is set on `pending` or `rejected` listings, the cron might expire them before they're ever reviewed.

**Fix: Expiry cron filters by `approved` status only**

```typescript
// /api/cron/expire-listings
const expiredListings = await Listing.find({
  status: { $in: ['approved'] }, // ONLY expire approved listings
  isDeleted: false,
  isExpired: false,
  expiresAt: { $lt: new Date() }
});

// Separate check: flag stale pending listings older than 7 days
const stalePending = await Listing.find({
  status: 'pending',
  createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
});
// Log these for admin attention — do not auto-reject
```

---

### LG-06: WhatsApp Number Missing After Listing Approved

**Scenario:** Seller submits listing without WhatsApp saved. Listing gets approved. Buyer cannot contact seller. Seller never knows — they only see `Active` in their dashboard with no indication buyers can't reach them.

**Fix: Surface the gap in the dashboard**

```typescript
// In GET /api/user/listings/counts — add a flag:
const hasApprovedWithNoContact = await Listing.exists({
  seller: userId,
  status: 'approved',
  isDeleted: false
}) && !(await User.exists({ uid: userId, whatsappNumber: { $exists: true, $ne: '' } }));

return res.json({
  active: N,
  pending: N,
  rejected: N,
  sold: N,
  hasApprovedWithNoContact // true if they have live listings but no WhatsApp
});

// In dashboard UI:
// If hasApprovedWithNoContact is true, show yellow banner:
// "Your listing is live but buyers can't contact you.
//  Add your WhatsApp number in Profile to enable contact."
```

---

### LG-07: Sold Listings Showing Edit/Bump Actions

**Scenario:** Sold tab in dashboard should be read-only. If edit or bump actions are rendered conditionally based on `status !== 'sold'` check missing, sellers can attempt to edit sold listings.

**Fix: Explicit read-only guard**

```typescript
// In dashboard card component:
const isReadOnly = listing.status === 'sold' || listing.status === 'expired';

// Only render actions if not read-only:
{!isReadOnly && listing.status === 'approved' && (
  <>
    <BumpButton listing={listing} />
    <EditButton listing={listing} />
    <MarkSoldButton listing={listing} />
    <DeleteButton listing={listing} />
  </>
)}

{!isReadOnly && listing.status === 'rejected' && (
  <>
    <EditResubmitButton listing={listing} />
    <DeleteButton listing={listing} />
  </>
)}

{!isReadOnly && listing.status === 'pending' && (
  <DeleteButton listing={listing} />
)}
// Sold and expired: nothing rendered
```

---

## Quick Reference — All Issues

| ID | Severity | Type | Title | Fixed |
|---|---|---|---|---|
| RACE-01 | CRITICAL | Race Condition | Bump non-atomic read-then-write | `[ ]` |
| RACE-02 | CRITICAL | Race Condition | Ban not wrapped in MongoDB transaction | `[ ]` |
| RACE-03 | HIGH | Race Condition | Duplicate reports via double-tap | `[ ]` |
| RACE-04 | HIGH | Race Condition | Orphaned listing on concurrent delete+approve | `[ ]` |
| LOGIC-01 | MEDIUM | Logic Gap | Banned user pending listings pollute queue | `[ ]` |
| LOGIC-02 | MEDIUM | Logic Gap | Mode change retroactively affects pending queue | `[ ]` |
| LOGIC-03 | MEDIUM | Logic Gap | Category delete check ignores non-approved listings | `[ ]` |
| LOGIC-04 | LOW | Logic Gap | Listing edit mid-review behavior undocumented | `[ ]` |
| LOGIC-05 | MEDIUM | Logic Gap | Expiry cron hits non-approved listings | `[ ]` |
| LOGIC-06 | HIGH | Logic Gap | No signal to seller when approved but no WhatsApp | `[ ]` |
| LOGIC-07 | MEDIUM | Logic Gap | Sold listings show edit/bump actions | `[ ]` |

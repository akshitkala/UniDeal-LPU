const mongoose = require('mongoose');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Listing = mongoose.models.Listing || mongoose.model('Listing', new mongoose.Schema({
    status: String,
    isDeleted: Boolean,
    sellerBanned: Boolean,
    aiFlagged: Boolean,
    isExpired: Boolean
  }));

  const total = await Listing.countDocuments({});
  const approved = await Listing.countDocuments({
      status: 'approved',
      isDeleted: false,
      sellerBanned: false,
      aiFlagged: false,
      isExpired: false
  });
  const pending = await Listing.countDocuments({ status: 'pending' });

  console.log(`TOTAL: ${total}`);
  console.log(`APPROVED (VISIBLE): ${approved}`);
  console.log(`PENDING: ${pending}`);
  process.exit(0);
}

debug().catch(err => {
    console.error(err);
    process.exit(1);
});

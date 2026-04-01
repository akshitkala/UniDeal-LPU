const mongoose = require('mongoose');

async function fixDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const ListingSchema = new mongoose.Schema({
    createdAt: Date,
    bumpedAt: Date,
  }, { strict: false });
  
  const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);

  const listings = await Listing.find({ bumpedAt: { $exists: false } });
  console.log(`Found ${listings.length} listings missing bumpedAt`);
  
  let updated = 0;
  for (const listing of listings) {
    listing.bumpedAt = listing.createdAt;
    await listing.save();
    updated++;
  }
  
  console.log(`Updated ${updated} listings.`);
  process.exit(0);
}

fixDB().catch(console.error);

// seed-fests.js
// Run ONCE to create the 4 Fest documents in MongoDB.
// Command: node seed-fests.js
//
// After running you'll see:
//   ✅ Fests seeded: Celesta, Infinito, Anwesha, TedX

require('dotenv').config();
const mongoose = require('mongoose');

// Use the same Fest model from your existing schema file
const { Fest } = require('./models/fest'); // adjust path if needed

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('🔗 Connected to MongoDB');

    const festNames = ['Celesta', 'Infinito', 'Anwesha', 'TedX'];

    for (const name of festNames) {
      // upsert: create if doesn't exist, skip if already there
      await Fest.findOneAndUpdate(
        { name },
        { name },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Fests seeded:', festNames.join(', '));
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
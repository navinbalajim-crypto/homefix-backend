require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster.wy3ngid.mongodb.net/homefix?retryWrites=true&w=majority';

async function fixUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete users with 'demo' role or fix them
    const result = await mongoose.connection.db.collection('users').deleteMany({ role: 'demo' });
    console.log(`Deleted ${result.deletedCount} users with role 'demo'`);
    
    // Also fix any remaining
    await mongoose.connection.db.collection('users').updateMany(
      { role: 'demo' },
      { $set: { role: 'user' } }
    );
    
    console.log('Done! Users fixed.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUsers();

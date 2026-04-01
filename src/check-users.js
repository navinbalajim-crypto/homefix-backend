require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster.wy3ngid.mongodb.net/homefix?retryWrites=true&w=majority';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users in database:', JSON.stringify(users, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();

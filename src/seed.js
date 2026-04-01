require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Category = require('./models/Category');
const { v4: uuidv4 } = require('uuid');

const categories = [
  { name: 'Plumbing', icon: 'water', description: 'Fix leaks, install pipes, unclog drains', basePrice: 300, popular: true },
  { name: 'Electrical', icon: 'flash', description: 'Wiring, switches, fans, AC repair', basePrice: 400, popular: true },
  { name: 'Carpentry', icon: 'hammer', description: 'Furniture repair, woodwork, polishing', basePrice: 350, popular: false },
  { name: 'Painting', icon: 'brush', description: 'Interior/exterior painting, textures', basePrice: 500, popular: false },
  { name: 'Cleaning', icon: 'sparkles', description: 'Deep cleaning, sanitization', basePrice: 250, popular: true },
  { name: 'AC Repair', icon: 'snow', description: 'AC installation, repair, gas refill', basePrice: 450, popular: true },
  { name: 'Appliance Repair', icon: 'tools', description: 'Refrigerator, washing machine, TV', basePrice: 350, popular: false },
  { name: 'Pest Control', icon: 'bug', description: 'Termite, cockroach, bedbug treatment', basePrice: 600, popular: false }
];

const workers = [
  { name: 'Rajesh Kumar', occupation: 'Plumbing', pricePerHour: 350, rating: 4.8, lat: 28.6139, lng: 77.2090 },
  { name: 'Amit Singh', occupation: 'Electrical', pricePerHour: 400, rating: 4.6, lat: 28.6280, lng: 77.2195 },
  { name: 'Suresh Patel', occupation: 'AC Repair', pricePerHour: 500, rating: 4.9, lat: 28.6350, lng: 77.2250 },
  { name: 'Vikram Sharma', occupation: 'Cleaning', pricePerHour: 280, rating: 4.5, lat: 28.6180, lng: 77.2080 },
  { name: 'Ravi Gupta', occupation: 'Carpentry', pricePerHour: 380, rating: 4.7, lat: 28.6220, lng: 77.2150 },
  { name: 'Mohammed Ali', occupation: 'Electrical', pricePerHour: 420, rating: 4.4, lat: 28.6300, lng: 77.2100 },
  { name: 'Sanjay Verma', occupation: 'Plumbing', pricePerHour: 320, rating: 4.3, lat: 28.6160, lng: 77.2200 },
  { name: 'Anil Yadav', occupation: 'Painting', pricePerHour: 450, rating: 4.6, lat: 28.6260, lng: 77.2050 }
];

async function seed() {
  try {
    const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster.wy3ngid.mongodb.net/homefix?retryWrites=true&w=majority';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log('Categories seeded');
    
    await Worker.deleteMany({});
    
    for (const w of workers) {
      const user = await User.create({
        uid: uuidv4(),
        name: w.name,
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'worker'
      });
      
      await Worker.create({
        workerId: uuidv4(),
        userId: user._id,
        name: w.name,
        phone: user.phone,
        occupation: w.occupation,
        description: `Experienced ${w.occupation} professional with 5+ years of experience`,
        pricePerHour: w.pricePerHour,
        rating: w.rating,
        experience: Math.floor(3 + Math.random() * 7),
        totalJobs: Math.floor(50 + Math.random() * 200),
        location: { type: 'Point', coordinates: [w.lng, w.lat] },
        skills: [w.occupation, 'Repair', 'Installation'],
        verified: true,
        blocked: false
      });
    }
    console.log('Workers seeded');
    
    console.log('Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

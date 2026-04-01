const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

// Public routes for demo (no auth required)
router.post('/create', bookingController.createBooking);
router.get('/user/:id', bookingController.getUserBookings);
router.get('/all', bookingController.getAllBookings);

// Simple test create booking - completely fresh user
router.post('/test-create', async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const Worker = require('../models/Worker');
    const User = require('../models/User');
    const { MongoClient } = require('mongodb');
    const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster.wy3ngid.mongodb.net/homefix?retryWrites=true&w=majority';
    
    // First, fix any invalid users using native driver
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('homefix');
    await db.collection('users').updateMany({ role: 'demo' }, { $set: { role: 'user' } });
    await client.close();
    
    const worker = await Worker.findOne();
    if (!worker) {
      return res.json({ success: false, message: 'No worker found' });
    }
    
    // Create a completely new user with unique phone
    const newPhone = '555' + Date.now();
    const user = await User.create({
      uid: require('uuid').v4(),
      name: 'Test Customer',
      phone: newPhone,
      role: 'user'
    });
    
    const booking = await Booking.create({
      bookingId: require('uuid').v4(),
      userId: user._id,
      userName: 'Test Customer',
      workerId: worker._id,
      serviceType: 'Test Service',
      description: 'Test booking',
      scheduledDate: new Date(),
      scheduledTime: '10:00',
      duration: 1,
      status: 'pending',
      price: {
        baseAmount: 350,
        serviceFee: 17,
        totalAmount: 367
      },
      address: 'Test Address',
      location: { type: 'Point', coordinates: [77.2090, 28.6139] },
      otp: '1234'
    });
    
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Test create error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Fix users endpoint
router.get('/fix-users', async (req, res) => {
  try {
    const { MongoClient } = require('mongodb');
    const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster.wy3ngid.mongodb.net/homefix?retryWrites=true&w=majority';
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('homefix');
    const result = await db.collection('users').updateMany(
      { role: 'demo' },
      { $set: { role: 'user' } }
    );
    await client.close();
    
    res.json({ success: true, message: `Fixed ${result.modifiedCount} users` });
  } catch (error) {
    console.error('Fix users error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Get all bookings (for admin/dashboard)
router.get('/', async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.find().sort({ createdAt: -1 }).populate('workerId', 'name phone occupation').lean();
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Protected routes
router.get('/worker', auth, bookingController.getWorkerBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/status', auth, bookingController.updateBookingStatus);
router.post('/accept', auth, bookingController.acceptBooking);
router.post('/reject', auth, bookingController.rejectBooking);
router.post('/start', auth, bookingController.startJob);
router.post('/complete', auth, bookingController.completeJob);
router.post('/cancel', auth, bookingController.cancelBooking);

module.exports = router;

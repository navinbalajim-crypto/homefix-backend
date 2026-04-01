const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const calculateDynamicPrice = (basePrice, scheduledTime, isEmergency = false) => {
  const time = parseInt(scheduledTime.split(':')[0]);
  const isNightTime = time >= 22 || time < 6;
  
  let total = basePrice;
  let nightCharge = 0;
  let emergencyCharge = 0;
  
  if (isNightTime) {
    nightCharge = basePrice * 0.2;
    total += nightCharge;
  }
  
  if (isEmergency) {
    emergencyCharge = basePrice * 0.3;
    total += emergencyCharge;
  }
  
  const serviceFee = total * 0.05;
  const totalAmount = total + serviceFee;
  
  return {
    baseAmount: basePrice,
    serviceFee: Math.round(serviceFee),
    totalAmount: Math.round(totalAmount),
    isNightTime,
    isEmergency,
    nightCharge: Math.round(nightCharge),
    emergencyCharge: Math.round(emergencyCharge)
  };
};

exports.createBooking = async (req, res) => {
  try {
    const { workerId, serviceType, description, scheduledDate, scheduledTime, duration, address, location, isEmergency, userId: reqUserId, userName: reqUserName } = req.body;
    
    // Find worker by ID
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    const basePrice = worker.pricePerHour * (duration || 1);
    const pricingDetails = calculateDynamicPrice(basePrice, scheduledTime || '10:00', isEmergency);
    
    // Use a unique userId for demo
    let userIdentifier = reqUserId || 'user_' + Date.now();
    let userFullName = reqUserName || 'Customer';
    
    // Find or create user
    let user = await User.findOne({ phone: userIdentifier });
    if (!user) {
      user = await User.create({
        uid: uuidv4(),
        name: userFullName,
        phone: userIdentifier,
        role: 'user'
      });
    }
    
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    const booking = new Booking({
      bookingId: uuidv4(),
      userId: user._id,
      userName: userFullName,
      workerId: worker._id,
      serviceType: serviceType || 'Service',
      description: description || '',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      scheduledTime: scheduledTime || '10:00',
      duration: duration || 1,
      status: 'pending',
      price: {
        baseAmount: pricingDetails.baseAmount,
        serviceFee: pricingDetails.serviceFee,
        totalAmount: pricingDetails.totalAmount
      },
      address: address || 'Address not provided',
      location: location ? { type: 'Point', coordinates: location.coordinates } : { type: 'Point', coordinates: [77.2090, 28.6139] },
      otp: otp
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        serviceType: booking.serviceType,
        description: booking.description,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        status: booking.status,
        price: booking.price,
        address: booking.address,
        workerId: { name: worker.name, occupation: worker.occupation, phone: worker.phone }
      },
      pricingBreakdown: pricingDetails
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Booking failed: ' + error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const userIdParam = req.params.id;
    
    let bookings;
    
    // First try to find by userName or phone (demo user)
    bookings = await Booking.find({ userName: userIdParam })
      .populate('workerId', 'name occupation rating pricePerHour phone')
      .sort({ createdAt: -1 })
      .lean();
    
    // If not found, try by userId
    if (bookings.length === 0) {
      let user = await User.findOne({ phone: userIdParam });
      if (user) {
        bookings = await Booking.find({ userId: user._id })
          .populate('workerId', 'name occupation rating pricePerHour phone')
          .sort({ createdAt: -1 })
          .lean();
      }
    }
    
    // If still not found, try ObjectId
    if (bookings.length === 0) {
      try {
        bookings = await Booking.find({ userId: userIdParam })
          .populate('workerId', 'name occupation rating pricePerHour phone')
          .sort({ createdAt: -1 })
          .lean();
      } catch (e) {
        bookings = [];
      }
    }
    
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }
    
    res.json({
      success: true,
      count: bookings.length,
      bookings: bookings.map(b => ({
        _id: b._id,
        bookingId: b.bookingId,
        serviceType: b.serviceType,
        description: b.description,
        scheduledDate: b.scheduledDate,
        scheduledTime: b.scheduledTime,
        duration: b.duration,
        status: b.status,
        price: b.price,
        address: b.address,
        createdAt: b.createdAt,
        workerId: b.workerId
      }))
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(200).json({ success: true, count: 0, bookings: [] });
  }
};

exports.getWorkerBookings = async (req, res) => {
  try {
    const { status } = req.query;
    
    const worker = await Worker.findOne({ userId: req.userId });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    const query = { workerId: worker._id };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('userId', 'name phone address')
      .sort({ scheduledDate: 1, scheduledTime: 1 });
    
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name phone address location')
      .populate('workerId', 'name occupation rating pricePerHour phone location');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const worker = await Worker.findOne({ userId: req.userId });
    
    if (status === 'accepted' || status === 'rejected' || status === 'in_progress' || status === 'completed' || status === 'cancelled') {
      booking.status = status;
      
      if (status === 'completed') {
        booking.completedAt = new Date();
        booking.paymentStatus = 'paid';
        
        if (worker) {
          worker.totalJobs += 1;
          await worker.save();
        }
      }
      
      await booking.save();
      
      return res.json({ success: true, message: `Booking ${status}`, booking });
    }
    
    res.status(400).json({ success: false, message: 'Invalid status' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking already processed' });
    }
    
    booking.status = 'accepted';
    await booking.save();
    
    res.json({ success: true, message: 'Booking accepted', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.status = 'rejected';
    await booking.save();
    
    res.json({ success: true, message: 'Booking rejected', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.startJob = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.status = 'in_progress';
    await booking.save();
    
    res.json({ success: true, message: 'Job started', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.completeJob = async (req, res) => {
  try {
    const { bookingId, otp } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    booking.status = 'completed';
    booking.completedAt = new Date();
    booking.paymentStatus = 'paid';
    await booking.save();
    
    const worker = await Worker.findById(booking.workerId);
    if (worker) {
      worker.totalJobs += 1;
      await worker.save();
    }
    
    res.json({ success: true, message: 'Job completed and paid', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ success: true, message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      success: true,
      bookings: bookings.map(b => ({
        _id: b._id,
        bookingId: b.bookingId,
        serviceType: b.serviceType,
        status: b.status,
        userId: b.userId,
        workerId: b.workerId,
        price: b.price,
        scheduledDate: b.scheduledDate,
        scheduledTime: b.scheduledTime,
        createdAt: b.createdAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(200).json({ success: true, bookings: [], pagination: { total: 0, page: 1, pages: 0 } });
  }
};

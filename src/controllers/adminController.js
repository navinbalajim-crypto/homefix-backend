const User = require('../models/User');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Category = require('../models/Category');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalWorkers = await Worker.countDocuments();
    const verifiedWorkers = await Worker.countDocuments({ verified: true });
    const pendingWorkers = await Worker.countDocuments({ verified: false, blocked: false });
    const blockedWorkers = await Worker.countDocuments({ blocked: true });
    
    const bookings = await Booking.find().lean();
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid' && b.price?.totalAmount)
      .reduce((sum, b) => sum + (b.price?.totalAmount || 0), 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const monthlyBookings = bookings.filter(b => new Date(b.createdAt) >= thisMonth).length;
    const monthlyRevenue = bookings
      .filter(b => b.paymentStatus === 'paid' && new Date(b.createdAt) >= thisMonth && b.price?.totalAmount)
      .reduce((sum, b) => sum + (b.price?.totalAmount || 0), 0);
    
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      stats: {
        users: { total: totalUsers },
        workers: {
          total: totalWorkers,
          verified: verifiedWorkers,
          pending: pendingWorkers,
          blocked: blockedWorkers
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
          monthly: monthlyBookings
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue
        },
        recentBookings: recentBookings.map(b => ({
          _id: b._id,
          bookingId: b.bookingId,
          serviceType: b.serviceType,
          status: b.status,
          userId: b.userId,
          workerId: b.workerId,
          price: b.price,
          createdAt: b.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(200).json({ 
      success: true, 
      stats: {
        users: { total: 0 },
        workers: { total: 0, verified: 0, pending: 0, blocked: 0 },
        bookings: { total: 0, completed: 0, pending: 0, monthly: 0 },
        revenue: { total: 0, monthly: 0 },
        recentBookings: []
      }
    });
  }
};

exports.getAllWorkers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status === 'verified') query.verified = true;
    if (status === 'pending') query.verified = false;
    if (status === 'blocked') query.blocked = true;
    
    const workers = await Worker.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Worker.countDocuments(query);
    
    res.json({
      success: true,
      workers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin getAllWorkers error:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

exports.verifyWorker = async (req, res) => {
  try {
    const { workerId, verified } = req.body;
    
    const worker = await Worker.findByIdAndUpdate(
      workerId,
      { verified, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    res.json({ success: true, message: `Worker ${verified ? 'verified' : 'unverified'}`, worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.blockWorker = async (req, res) => {
  try {
    const { workerId, blocked } = req.body;
    
    const worker = await Worker.findByIdAndUpdate(
      workerId,
      { blocked, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    res.json({ success: true, message: `Worker ${blocked ? 'blocked' : 'unblocked'}`, worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getWorkerDetails = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('userId', 'name phone email address');
    
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    const reviews = await Review.find({ workerId: worker._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    const bookings = await Booking.find({ workerId: worker._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      worker,
      reviews,
      recentBookings: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, icon, description, basePrice } = req.body;
    
    const category = await Category.create({
      name,
      icon,
      description,
      basePrice
    });
    
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { paymentStatus: 'paid' };
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const bookings = await Booking.find(query)
      .populate('workerId', 'name')
      .populate('userId', 'name');
    
    const totalRevenue = bookings.reduce((sum, b) => sum + b.price.totalAmount, 0);
    const serviceFees = bookings.reduce((sum, b) => sum + b.price.serviceFee, 0);
    
    const byService = {};
    bookings.forEach(b => {
      if (!byService[b.serviceType]) {
        byService[b.serviceType] = { count: 0, revenue: 0 };
      }
      byService[b.serviceType].count++;
      byService[b.serviceType].revenue += b.price.totalAmount;
    });
    
    res.json({
      success: true,
      report: {
        totalRevenue,
        serviceFees,
        netRevenue: totalRevenue - serviceFees,
        totalBookings: bookings.length,
        byService
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { v4: uuidv4 } = require('uuid');

exports.addReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, punctuality, professionalism, quality } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }
    
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Already reviewed' });
    }
    
    const review = await Review.create({
      reviewId: uuidv4(),
      bookingId,
      userId: req.userId,
      workerId: booking.workerId,
      rating,
      comment,
      punctuality,
      professionalism,
      quality
    });
    
    const workerReviews = await Review.find({ workerId: booking.workerId });
    const avgRating = workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length;
    
    await Worker.findByIdAndUpdate(booking.workerId, {
      rating: Math.round(avgRating * 10) / 10
    });
    
    res.status(201).json({ success: true, message: 'Review added', review });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getWorkerReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ workerId: req.params.workerId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ workerId: req.params.workerId });
    
    const stats = await Review.aggregate([
      { $match: { workerId: require('mongoose').Types.ObjectId(req.params.workerId) } },
      { $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        avgPunctuality: { $avg: '$punctuality' },
        avgProfessionalism: { $avg: '$professionalism' },
        avgQuality: { $avg: '$quality' },
        total: { $sum: 1 }
      }}
    ]);
    
    res.json({
      success: true,
      reviews,
      stats: stats[0] || { avgRating: 0, total: 0 },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.userId })
      .populate('workerId', 'name occupation')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

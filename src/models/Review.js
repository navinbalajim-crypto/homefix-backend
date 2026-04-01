const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewId: { type: String, required: true, unique: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  punctuality: { type: Number, min: 1, max: 5 },
  professionalism: { type: Number, min: 1, max: 5 },
  quality: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ workerId: 1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  message: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'location'], default: 'text' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  lastMessage: { type: String },
  lastMessageAt: { type: Date, default: Date.now },
  messages: [messageSchema]
});

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);

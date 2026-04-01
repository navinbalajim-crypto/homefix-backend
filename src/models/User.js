const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'worker', 'admin', 'demo'], default: 'user' }
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);

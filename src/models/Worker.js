const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  occupation: { type: String, required: true },
  description: { type: String },
  pricePerHour: { type: Number, required: true },
  experience: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalJobs: { type: Number, default: 0 },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },

  serviceArea: { type: Number, default: 10 },

  availability: {
    monday: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" },
      enabled: { type: Boolean, default: true }
    },
    tuesday: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" },
      enabled: { type: Boolean, default: true }
    },
    wednesday: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" },
      enabled: { type: Boolean, default: true }
    },
    thursday: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" },
      enabled: { type: Boolean, default: true }
    },
    friday: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" },
      enabled: { type: Boolean, default: true }
    },
    saturday: {
      start: { type: String, default: "10:00" },
      end: { type: String, default: "16:00" },
      enabled: { type: Boolean, default: true }
    },
    sunday: {
      start: { type: String, default: "10:00" },
      end: { type: String, default: "16:00" },
      enabled: { type: Boolean, default: false }
    }
  },

  verified: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  skills: [{ type: String }],
  documents: [{ type: String }],
  avatar: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

workerSchema.index({ location: '2dsphere' });
workerSchema.index({ occupation: 1 });
workerSchema.index({ rating: -1 });

module.exports = mongoose.model('Worker', workerSchema);
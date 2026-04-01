const Worker = require('../models/Worker');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateRecommendationScore = (worker, distance, userLocation) => {
  const RATING_WEIGHT = 0.4;
  const DISTANCE_WEIGHT = -0.3;
  const PRICE_WEIGHT = -0.2;
  
  const normalizedDistance = Math.min(distance / 10, 1);
  const normalizedPrice = Math.min(worker.pricePerHour / 1000, 1);
  
  const score = 
    (worker.rating / 5) * RATING_WEIGHT +
    normalizedDistance * DISTANCE_WEIGHT +
    normalizedPrice * PRICE_WEIGHT +
    (worker.verified ? 0.1 : 0);
  
  return score;
};

exports.registerWorker = async (req, res) => {
  try {
    const { name, phone, occupation, description, pricePerHour, experience, skills, location } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let worker = await Worker.findOne({ userId: user._id });
    
    if (worker) {
      Object.assign(worker, {
        name, phone, occupation, description, pricePerHour, experience, skills,
        location: location ? { type: 'Point', coordinates: location.coordinates } : user.location
      });
      await worker.save();
    } else {
      worker = await Worker.create({
        workerId: uuidv4(),
        userId: user._id,
        name,
        phone,
        occupation,
        description,
        pricePerHour,
        experience,
        skills: skills || [],
        location: location ? { type: 'Point', coordinates: location.coordinates } : user.location,
        verified: false
      });
    }
    
    user.role = 'worker';
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Worker registration submitted',
      worker
    });
  } catch (error) {
    console.error('Worker register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getNearbyWorkers = async (req, res) => {
  try {
    const { lat, lng, occupation, maxDistance = 10 } = req.query;
    
    const query = {
      verified: true,
      blocked: false
    };
    
    if (occupation) {
      query.occupation = occupation;
    }
    
    let workers;
    
    if (lat && lng) {
      workers = await Worker.find({
        ...query,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(maxDistance) * 1000
          }
        }
      }).limit(20);
    } else {
      workers = await Worker.find(query).limit(20);
    }
    
    const workersWithDistance = workers.map(worker => {
      let distance = 0;
      if (lat && lng && worker.location?.coordinates) {
        distance = calculateDistance(
          parseFloat(lat), parseFloat(lng),
          worker.location.coordinates[1], worker.location.coordinates[0]
        );
      }
      return {
        ...worker.toObject(),
        distance: distance.toFixed(1)
      };
    });
    
    if (lat && lng) {
      workersWithDistance.sort((a, b) => {
        const scoreA = calculateRecommendationScore(a, parseFloat(a.distance));
        const scoreB = calculateRecommendationScore(b, parseFloat(b.distance));
        return scoreB - scoreA;
      });
    }
    
    res.json({
      success: true,
      count: workersWithDistance.length,
      workers: workersWithDistance
    });
  } catch (error) {
    console.error('Get nearby workers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    res.json({ success: true, worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const updates = req.body;
    
    const worker = await Worker.findOneAndUpdate(
      { userId: req.userId },
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    res.json({ success: true, message: 'Worker updated', worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    
    const worker = await Worker.findOneAndUpdate(
      { userId: req.userId },
      { availability, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json({ success: true, message: 'Availability updated', worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    const worker = await Worker.findOneAndUpdate(
      { userId: req.userId },
      { 'location.coordinates': coordinates },
      { new: true }
    );
    
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    res.json({ success: true, message: 'Location updated', worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.userId });
    
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({
      workerId: worker._id,
      status: 'completed'
    });
    
    const totalEarnings = bookings.reduce((sum, b) => sum + b.price.totalAmount, 0);
    const thisMonth = bookings.filter(b => {
      const date = new Date(b.completedAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    res.json({
      success: true,
      earnings: {
        total: totalEarnings,
        thisMonth: thisMonth.reduce((sum, b) => sum + b.price.totalAmount, 0),
        totalJobs: worker.totalJobs,
        pendingJobs: await Booking.countDocuments({ workerId: worker._id, status: 'pending' }),
        completedJobs: bookings.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRecommendedWorkers = async (req, res) => {
  try {
    const { lat, lng, serviceType } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location required' });
    }
    
    const workers = await Worker.find({
      verified: true,
      blocked: false,
      occupation: serviceType || { $exists: true }
    }).limit(50);
    
    const scoredWorkers = workers.map(worker => {
      const distance = worker.location?.coordinates
        ? calculateDistance(parseFloat(lat), parseFloat(lng), worker.location.coordinates[1], worker.location.coordinates[0])
        : 999;
      
      const score = calculateRecommendationScore(worker, distance);
      
      return {
        ...worker.toObject(),
        distance: distance.toFixed(1),
        recommendationScore: (score * 100).toFixed(1)
      };
    });
    
    scoredWorkers.sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    res.json({
      success: true,
      workers: scoredWorkers.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.emergencyRequest = async (req, res) => {
  try {
    const { lat, lng, serviceType } = req.body;
    
    const workers = await Worker.find({
      verified: true,
      blocked: false,
      occupation: serviceType
    }).limit(10);
    
    const availableWorkers = workers.map(worker => {
      const distance = worker.location?.coordinates
        ? calculateDistance(parseFloat(lat), parseFloat(lng), worker.location.coordinates[1], worker.location.coordinates[0])
        : 999;
      
      return { ...worker.toObject(), distance };
    });
    
    availableWorkers.sort((a, b) => a.distance - b.distance);
    
    res.json({
      success: true,
      message: 'Emergency workers notified',
      nearestWorkers: availableWorkers.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        uid: user.uid,
        name: user.name,
        phone: user.phone,
        email: user.email,
        location: user.location,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, address, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, email, address, location },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        uid: user.uid,
        name: user.name,
        phone: user.phone,
        email: user.email,
        location: user.location,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { 'location.coordinates': coordinates },
      { new: true }
    );
    
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

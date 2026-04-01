const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Worker = require('../models/Worker');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'homefix_secret_key_2024';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const user = await User.findOne({ phone });
    
    if (user) {
      user.otp = otp;
      user.otpExpiry = Date.now() + 300000;
      await user.save();
    } else {
      await User.create({
        uid: uuidv4(),
        phone,
        name: '',
        role: 'user'
      });
    }

    console.log(`OTP for ${phone}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      otp: otp,
      phone
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }

    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name && !user.name) {
      user.name = name;
      await user.save();
    }

    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        uid: user.uid,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    let user = await User.findOne({ phone });
    
    if (user) {
      user.name = name;
      user.email = email;
      await user.save();
    } else {
      user = await User.create({
        uid: uuidv4(),
        name,
        phone,
        email
      });
    }
    
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        uid: user.uid,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        uid: user.uid,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === 'admin' && (password === 'homefix2024' || password === 'admin123')) {
      const token = generateToken('admin');
      return res.json({
        success: true,
        token,
        user: { uid: 'admin', name: 'Admin', role: 'admin' }
      });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

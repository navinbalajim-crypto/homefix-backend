const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Worker = require('../models/Worker');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'homefix_secret_key_2024';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, address, role } = req.body;
    
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await User.findOne({ phone });
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }
    
    const user = await User.create({
      uid: uuidv4(),
      name,
      phone,
      email: email || '',
      password,
      address: address || '',
      role: role === 'worker' ? 'worker' : 'user'
    });
    
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
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }
    
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Phone number not registered. Please sign up first.' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
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
    
    if (username === 'admin' && password === 'admin123') {
      const token = generateToken('admin');
      return res.json({
        success: true,
        token,
        user: { uid: 'admin', name: 'Admin', role: 'admin' }
      });
    }
    
    if (username !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid admin username' });
    }
    
    if (password !== 'admin123') {
      return res.status(401).json({ success: false, message: 'Incorrect admin password' });
    }
    
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
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
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }

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
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

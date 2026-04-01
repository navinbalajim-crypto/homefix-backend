require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/homefix'
)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes (load after mongoose connection)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workerRoutes = require('./routes/workers');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const categoryRoutes = require('./routes/categories');
const socketHandler = require('./socket/socketHandler');

// ✅ Initialize socket
socketHandler.init(io);

// ✅ Test route
app.get('/', (req, res) => {
  res.json({
    message: 'HomeFix Hub API',
    version: '1.0.0',
    status: 'running'
  });
});

// ✅ Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test OK' });
});

// ✅ Database test endpoint
app.get('/api/dbtest', async (req, res) => {
  try {
    const Worker = require('./models/Worker');
    const workers = await Worker.find().limit(1).lean();
    res.json({ success: true, workers, dbStatus: 'connected' });
  } catch (err) {
    res.json({ success: false, error: err.message, dbStatus: 'error' });
  }
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/categories', categoryRoutes);

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`HomeFix Hub server running on port ${PORT}`);
});

module.exports = { app, server, io };
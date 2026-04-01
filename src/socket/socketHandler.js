const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

let io;

exports.init = (socketIO) => {
  io = socketIO;
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join', (data) => {
      socket.join(`user_${data.userId}`);
      socket.join(`worker_${data.workerId}`);
      socket.join(`booking_${data.bookingId}`);
      console.log(`Socket joined: user_${data.userId}, worker_${data.workerId}, booking_${data.bookingId}`);
    });
    
    socket.on('location:update', async (data) => {
      const { workerId, lat, lng, bookingId } = data;
      
      await Worker.findByIdAndUpdate(workerId, {
        'location.coordinates': [lng, lat]
      });
      
      if (bookingId) {
        io.to(`booking_${bookingId}`).emit('worker:location', {
          workerId,
          lat,
          lng,
          timestamp: Date.now()
        });
      }
    });
    
    socket.on('booking:status', (data) => {
      const { bookingId, status, userId, workerId } = data;
      
      io.to(`user_${userId}`).emit('booking:updated', { bookingId, status });
      io.to(`worker_${workerId}`).emit('booking:updated', { bookingId, status });
    });
    
    socket.on('chat:message', (data) => {
      const { bookingId, senderId, receiverId, message } = data;
      
      io.to(`user_${senderId}`).emit('chat:received', data);
      io.to(`worker_${senderId}`).emit('chat:received', data);
      io.to(`user_${receiverId}`).emit('chat:received', data);
      io.to(`worker_${receiverId}`).emit('chat:received', data);
    });
    
    socket.on('emergency:request', (data) => {
      const { serviceType, lat, lng, userId } = data;
      
      io.emit('emergency:alert', {
        serviceType,
        lat,
        lng,
        userId
      });
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  
  return io;
};

exports.emit = (event, room, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

exports.simulateMovement = async (bookingId, destination) => {
  const booking = await Booking.findById(bookingId);
  if (!booking || !booking.workerId) return;
  
  let currentLat = destination.lat - 0.05;
  let currentLng = destination.lng - 0.05;
  
  const interval = setInterval(async () => {
    currentLat += 0.002;
    currentLng += 0.002;
    
    io.to(`booking_${bookingId}`).emit('worker:location', {
      workerId: booking.workerId,
      lat: currentLat,
      lng: currentLng,
      timestamp: Date.now()
    });
    
    const distance = Math.sqrt(
      Math.pow(currentLat - destination.lat, 2) +
      Math.pow(currentLng - destination.lng, 2)
    );
    
    if (distance < 0.001) {
      clearInterval(interval);
      io.to(`booking_${bookingId}`).emit('worker:arrived', {
        workerId: booking.workerId
      });
    }
  }, 2000);
};

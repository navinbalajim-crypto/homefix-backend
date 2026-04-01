const Chat = require('../models/Chat');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, bookingId, message, type } = req.body;
    
    let chat = await Chat.findOne({
      participants: { $all: [req.userId, receiverId] }
    });
    
    if (!chat) {
      chat = await Chat.create({
        participants: [req.userId, receiverId],
        bookingId,
        messages: [{
          senderId: req.userId,
          receiverId,
          message,
          type: type || 'text'
        }],
        lastMessage: message,
        lastMessageAt: new Date()
      });
    } else {
      chat.messages.push({
        senderId: req.userId,
        receiverId,
        message,
        type: type || 'text'
      });
      chat.lastMessage = message;
      chat.lastMessageAt = new Date();
      await chat.save();
    }
    
    res.status(201).json({ success: true, message: chat.messages[chat.messages.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.userId })
      .populate('participants', 'name')
      .populate('bookingId')
      .sort({ lastMessageAt: -1 });
    
    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name')
      .populate('bookingId');
    
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    
    chat.messages.forEach(msg => {
      if (msg.receiverId.toString() === req.userId && !msg.read) {
        msg.read = true;
      }
    });
    await chat.save();
    
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

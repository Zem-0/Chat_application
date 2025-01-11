import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('login', (username) => {
    users.set(socket.id, username);
    io.emit('userList', Array.from(users.values()));
  });

  socket.on('message', (message) => {
    io.emit('message', {
      user: users.get(socket.id),
      text: message,
      time: new Date().toISOString()
    });
  });

  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('userTyping', {
      user: users.get(socket.id),
      isTyping
    });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('userList', Array.from(users.values()));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
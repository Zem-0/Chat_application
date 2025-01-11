import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';

const PORT = process.env.PORT || 10000;

const app = express();
app.use(cors());

const httpServer = createServer(app);

// Basic routes
app.get('/', (req, res) => {
  res.send('Chat server is running');
});

// Health check endpoint with more details
app.get('/health', (req, res) => {
  try {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      socketConnections: io.engine.clientsCount,
      activeUsers: users.size
    };
    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      message: 'Service Unavailable',
      error: error.message
    });
  }
});

// Add a test endpoint to check CORS
app.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS is working',
    origin: req.headers.origin
  });
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.headers.origin || 'Unknown Origin'}`);
  next();
});

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://chat-application-2-9h07.onrender.com",
      "https://chat-app-client.vercel.app",
      "*"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store connected users
const users = new Map();
const userCredentials = new Map();

// Add message history
const messageHistory = [];
const MESSAGE_HISTORY_LIMIT = 50;
const TYPING_TIMEOUT = 3000;

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Add this helper function
const broadcastUserStatus = () => {
  const userStatuses = Array.from(users.values()).map(({ username, status }) => ({
    username,
    status
  }));
  io.emit('userStatuses', userStatuses);
};

io.on('connection', (socket) => {
  console.log('New connection established:', socket.id);
  
  socket.emit('userList', Array.from(users.values()));

  socket.on('login', ({ username, password }) => {
    console.log('Login attempt received for:', username);
    const hashedPassword = hashPassword(password);
    
    if (!userCredentials.has(username)) {
      console.log('Creating new user:', username);
      userCredentials.set(username, hashedPassword);
    } 
    else if (userCredentials.get(username) !== hashedPassword) {
      console.log('Invalid password for user:', username);
      socket.emit('loginError', 'Invalid password');
      return;
    }

    const existingSocket = Array.from(users.entries())
      .find(([_, user]) => user.username === username);
    
    if (existingSocket) {
      const [existingSocketId] = existingSocket;
      if (existingSocketId !== socket.id) {
        console.log('Disconnecting existing session for:', username);
        const existingSocketInstance = io.sockets.sockets.get(existingSocketId);
        if (existingSocketInstance) {
          existingSocketInstance.disconnect();
        }
        users.delete(existingSocketId);
      }
    }

    users.set(socket.id, { 
      username, 
      status: 'online',
      lastTyping: Date.now() 
    });
    
    broadcastUserStatus();
    socket.emit('messageHistory', messageHistory);
    socket.emit('loginSuccess');
  });

  socket.on('message', (message) => {
    const user = users.get(socket.id);
    if (!user) return;

    const messageObject = {
      user: user.username,
      text: message,
      time: new Date().toISOString()
    };
    
    messageHistory.push(messageObject);
    if (messageHistory.length > MESSAGE_HISTORY_LIMIT) {
      messageHistory.shift();
    }
    
    io.emit('message', messageObject);
  });

  socket.on('typing', (isTyping) => {
    const user = users.get(socket.id);
    if (!user) return;

    user.lastTyping = Date.now();
    
    if (isTyping) {
      socket.broadcast.emit('userTyping', {
        user: user.username,
        isTyping: true
      });

      setTimeout(() => {
        const currentUser = users.get(socket.id);
        if (currentUser && Date.now() - currentUser.lastTyping >= TYPING_TIMEOUT) {
          socket.broadcast.emit('userTyping', {
            user: currentUser.username,
            isTyping: false
          });
        }
      }, TYPING_TIMEOUT);
    } else {
      socket.broadcast.emit('userTyping', {
        user: user.username,
        isTyping: false
      });
    }
  });

  socket.on('setStatus', (status) => {
    const user = users.get(socket.id);
    if (user) {
      user.status = status;
      broadcastUserStatus();
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      broadcastUserStatus();
    }
  });
});

// Enhanced logging for server startup
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('CORS origins:', io.origins());
  console.log('Available endpoints:');
  console.log('- GET /');
  console.log('- GET /health');
  console.log('- GET /test-cors');
  console.log('=================================');
}); 
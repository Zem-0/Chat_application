import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());

const httpServer = createServer(app);

// Add a basic route to test if server is running
app.get('/', (req, res) => {
  res.send('Chat server is running');
});

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
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
const TYPING_TIMEOUT = 3000; // 3 seconds

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Add this function to broadcast user list
const broadcastUserList = () => {
  const userList = Array.from(users.values());
  console.log('Broadcasting updated user list:', userList);
  io.emit('userList', userList);
};

// Add this helper function
const broadcastUserStatus = () => {
  const userStatuses = Array.from(users.values()).map(({ username, status }) => ({
    username,
    status
  }));
  io.emit('userStatuses', userStatuses);
};

// Add connection event handler
io.on('connection', (socket) => {
  console.log('New connection established:', socket.id);
  
  // Send current user list to newly connected client
  socket.emit('userList', Array.from(users.values()));

  socket.on('login', ({ username, password }) => {
    console.log('Login attempt received for:', username);
    const hashedPassword = hashPassword(password);
    
    // If user doesn't exist, create new account
    if (!userCredentials.has(username)) {
      console.log('Creating new user:', username);
      userCredentials.set(username, hashedPassword);
    } 
    // If user exists, verify password
    else if (userCredentials.get(username) !== hashedPassword) {
      console.log('Invalid password for user:', username);
      socket.emit('loginError', 'Invalid password');
      return;
    }

    // Check if user is already logged in
    const existingSocket = Array.from(users.entries())
      .find(([_, name]) => name === username);
    
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

    // Add user with status
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
    const messageObject = {
      user: users.get(socket.id),
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

      // Clear typing status after timeout
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

// Update the server startup
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 
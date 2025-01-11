import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styled from 'styled-components';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';

console.log('Attempting to connect to:', process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  autoConnect: true,
  debug: true
});

socket.on('error', (error) => {
  console.error('Socket Error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection Error:', error);
});

function App() {
  const [username, setUsername] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    console.log('Initial socket state:', {
      connected: socket.connected,
      id: socket.id
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnectionError(false);
      setIsConnected(true);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError(true);
    });

    socket.on('loginError', (error) => {
      console.log('Login error:', error);
      setLoginError(error);
    });

    socket.on('loginSuccess', () => {
      console.log('Login successful');
      setLoggedIn(true);
      setLoginError('');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setLoggedIn(false);
      setIsConnected(false);
    });

    // Initial connection status
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('loginError');
      socket.off('loginSuccess');
      socket.off('disconnect');
    };
  }, []);

  const handleLogin = (name, password) => {
    console.log('Login attempt:', { name, password });
    console.log('Socket state during login:', {
      connected: socket.connected,
      id: socket.id
    });
    
    if (!socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      socket.connect();
      setLoginError('Connecting to server...');
      return;
    }

    setUsername(name);
    socket.emit('login', { username: name, password });
  };

  return (
    <AppContainer>
      {!isConnected && (
        <ErrorMessage>
          Connecting to server...
        </ErrorMessage>
      )}
      {connectionError && (
        <ErrorMessage>
          Unable to connect to chat server. Please try again later.
        </ErrorMessage>
      )}
      {loginError && (
        <ErrorMessage>
          {loginError}
        </ErrorMessage>
      )}
      {!loggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <ChatRoom socket={socket} username={username} />
      )}
    </AppContainer>
  );
}

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0;
    justify-content: flex-start;
    background: white;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ff6b6b;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
`;

export default App; 
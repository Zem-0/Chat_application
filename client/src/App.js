import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styled from 'styled-components';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';

const socket = io('http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = (name) => {
    setUsername(name);
    setLoggedIn(true);
    socket.emit('login', name);
  };

  return (
    <AppContainer>
      {!loggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <ChatRoom socket={socket} username={username} />
      )}
    </AppContainer>
  );
}

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
`;

export default App; 
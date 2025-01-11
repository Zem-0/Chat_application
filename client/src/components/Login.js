import React, { useState } from 'react';
import styled from 'styled-components';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    if (trimmedUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setError('');
    onLogin(trimmedUsername, password);
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <h2>Join Chat</h2>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit">Join</Button>
      </LoginForm>
    </LoginContainer>
  );
}

const LoginContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: #0056b3;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
`;

export default Login; 
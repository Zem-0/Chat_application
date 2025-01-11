import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

function ChatRoom({ socket, username }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('userList', (users) => {
      setOnlineUsers(users);
    });

    socket.on('userTyping', ({ user, isTyping }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(user);
        } else {
          newSet.delete(user);
        }
        return newSet;
      });
    });

    return () => {
      socket.off('message');
      socket.off('userList');
      socket.off('userTyping');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit('message', newMessage);
      setNewMessage('');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    socket.emit('typing', e.target.value.length > 0);
  };

  return (
    <ChatContainer>
      <OnlineUsers>
        <h3>Online Users</h3>
        {onlineUsers.map((user, index) => (
          <UserItem key={index}>{user}</UserItem>
        ))}
      </OnlineUsers>

      <ChatMain>
        <MessagesContainer>
          {messages.map((msg, index) => (
            <Message key={index} isOwn={msg.user === username}>
              <Username>{msg.user}</Username>
              <MessageText>{msg.text}</MessageText>
              <TimeStamp>{new Date(msg.time).toLocaleTimeString()}</TimeStamp>
            </Message>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {typingUsers.size > 0 && (
          <TypingIndicator>
            {Array.from(typingUsers).join(', ')} is typing...
          </TypingIndicator>
        )}

        <MessageForm onSubmit={handleSend}>
          <Input
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
          />
          <Button type="submit">Send</Button>
        </MessageForm>
      </ChatMain>
    </ChatContainer>
  );
}

const ChatContainer = styled.div`
  display: flex;
  width: 90%;
  max-width: 1200px;
  height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const OnlineUsers = styled.div`
  width: 200px;
  padding: 1rem;
  border-right: 1px solid #ddd;
  overflow-y: auto;
`;

const UserItem = styled.div`
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: #f8f9fa;
  border-radius: 4px;
`;

const ChatMain = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const Message = styled.div`
  margin: 0.5rem 0;
  padding: 0.5rem;
  border-radius: 8px;
  max-width: 70%;
  ${({ isOwn }) => isOwn ? 'margin-left: auto;' : 'margin-right: auto;'}
  background: ${({ isOwn }) => isOwn ? '#007bff' : '#e9ecef'};
  color: ${({ isOwn }) => isOwn ? 'white' : 'black'};
`;

const Username = styled.div`
  font-weight: bold;
  font-size: 0.8rem;
`;

const MessageText = styled.div`
  margin: 0.25rem 0;
`;

const TimeStamp = styled.div`
  font-size: 0.7rem;
  opacity: 0.7;
`;

const TypingIndicator = styled.div`
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #6c757d;
`;

const MessageForm = styled.form`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

export default ChatRoom; 
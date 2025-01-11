import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';

function ChatRoom({ socket, username }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef(null);
  const [userStatuses, setUserStatuses] = useState([]);

  useEffect(() => {
    socket.on('messageHistory', (history) => {
      setMessages(history);
    });

    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('userList', (users) => {
      console.log('Received updated user list:', users);
      setOnlineUsers(users || []);
    });

    socket.emit('requestUserList');

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

    socket.on('userStatuses', (statuses) => {
      setUserStatuses(statuses);
    });

    return () => {
      socket.off('messageHistory');
      socket.off('message');
      socket.off('userList');
      socket.off('userTyping');
      socket.off('userStatuses');
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
      <MobileToggle onClick={() => setShowUserList(!showUserList)}>
        {showUserList ? '✕' : '👥'} {!showUserList && `(${onlineUsers.length})`}
      </MobileToggle>

      <OnlineUsers show={showUserList}>
        <OnlineUsersHeader>
          <h3>Online Users ({onlineUsers.length})</h3>
          <CloseButton onClick={() => setShowUserList(false)}>✕</CloseButton>
        </OnlineUsersHeader>
        {onlineUsers.map((user, index) => {
          const userStatus = userStatuses.find(s => s.username === user);
          const isTyping = Array.from(typingUsers).includes(user);
          
          return (
            <UserItem 
              key={index} 
              isCurrentUser={user === username}
              status={userStatus?.status || 'offline'}
              isTyping={isTyping}
            >
              {user} {user === username ? '(You)' : ''}
            </UserItem>
          );
        })}
      </OnlineUsers>

      <ChatMain>
        <MessagesContainer>
          {messages.map((msg, index) => (
            <Message key={index} isOwn={msg.user === username}>
              <MessageContent isOwn={msg.user === username}>
                <Username isOwn={msg.user === username}>{msg.user}</Username>
                <MessageText>{msg.text}</MessageText>
                <TimeStamp isOwn={msg.user === username}>
                  {new Date(msg.time).toLocaleTimeString()}
                </TimeStamp>
              </MessageContent>
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
  width: 95%;
  max-width: 1400px;
  height: 88vh;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);

  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    border-radius: 0;
  }
`;

const MobileToggle = styled.button`
  display: none;
  position: absolute;
  top: 1.2rem;
  left: 1.2rem;
  z-index: 1000;
  padding: 0.6rem;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const OnlineUsers = styled.div`
  width: 280px;
  padding: 1.5rem;
  background: #f8fafc;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(to bottom, 
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.8) 50%,
      rgba(255,255,255,0) 100%);
  }

  @media (max-width: 768px) {
    position: absolute;
    left: ${props => props.show ? '0' : '-100%'};
    top: 0;
    bottom: 0;
    width: 85%;
    max-width: 320px;
    z-index: 100;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
    background: white;
  }
`;

const OnlineUsersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eaeaea;

  h3 {
    font-size: 1.1rem;
    color: #1a1a1a;
    font-weight: 600;
  }
`;

const UserItem = styled.div`
  padding: 1rem 1.2rem;
  margin: 0.2rem 0;
  background: ${props => props.isCurrentUser ? 'rgba(74, 144, 226, 0.1)' : 'white'};
  border-radius: 12px;
  font-weight: ${props => props.isCurrentUser ? '600' : '400'};
  color: ${props => props.isCurrentUser ? '#1565c0' : '#2c3e50'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => {
      switch(props.status) {
        case 'online': return '#4caf50';
        case 'away': return '#ff9800';
        case 'offline': return '#9e9e9e';
        default: return '#4caf50';
      }
    }};
    box-shadow: ${props => {
      const color = props.status === 'online' ? '76, 175, 80' : 
                   props.status === 'away' ? '255, 152, 0' : '158, 158, 158';
      return `0 0 0 2px rgba(${color}, 0.2)`;
    }};
    margin-right: 8px;
    transition: all 0.3s ease;
  }

  ${props => props.isTyping && css`
    &::after {
      content: '...';
      position: absolute;
      right: 1rem;
      font-weight: bold;
      animation: typing 1.4s infinite;
    }

    @keyframes typing {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60%, 100% { content: '...'; }
    }
  `}
`;

const ChatMain = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;

  @media (max-width: 768px) {
    padding-top: 4rem;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #ffffff;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Message = styled.div`
  margin: 0.3rem 0;
  display: flex;
  justify-content: ${({ isOwn }) => isOwn ? 'flex-end' : 'flex-start'};
  padding: 0 1rem;
`;

const MessageContent = styled.div`
  padding: 1rem 1.2rem;
  border-radius: 16px;
  max-width: 70%;
  background: ${({ isOwn }) => 
    isOwn ? 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)' : '#f8fafc'};
  color: ${({ isOwn }) => isOwn ? 'white' : '#2c3e50'};
  box-shadow: ${({ isOwn }) => 
    isOwn ? '0 4px 12px rgba(74, 144, 226, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)'};
  transition: all 0.2s ease;
  position: relative;
  
  ${({ isOwn }) => isOwn ? `
    border-bottom-right-radius: 4px;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: -8px;
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, #357abd 0%, #357abd 50%, transparent 50%, transparent 100%);
      transform: rotate(45deg);
    }
  ` : `
    border-bottom-left-radius: 4px;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: -8px;
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, transparent 0%, transparent 50%, #f8fafc 50%, #f8fafc 100%);
      transform: rotate(45deg);
    }
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ isOwn }) => 
      isOwn ? '0 6px 16px rgba(74, 144, 226, 0.25)' : '0 6px 16px rgba(0, 0, 0, 0.08)'};
  }

  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

const Username = styled.div`
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
  color: ${({ isOwn }) => isOwn ? 'rgba(255, 255, 255, 0.9)' : '#666'};
  text-align: ${({ isOwn }) => isOwn ? 'right' : 'left'};
`;

const MessageText = styled.div`
  margin: 0.25rem 0;
  word-break: break-word;
  line-height: 1.4;
  font-size: 0.95rem;
`;

const TimeStamp = styled.div`
  font-size: 0.7rem;
  opacity: 0.8;
  margin-top: 0.3rem;
  text-align: ${({ isOwn }) => isOwn ? 'right' : 'left'};
`;

const TypingIndicator = styled.div`
  padding: 0.8rem 1.2rem;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  background: #f8fafc;
  border-radius: 8px;
  margin: 0.5rem 1rem;
  animation: fadeIn 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const MessageForm = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, 
      rgba(0,0,0,0) 0%,
      rgba(0,0,0,0.08) 50%,
      rgba(0,0,0,0) 100%);
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 24px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.2s ease;
  color: #2c3e50;

  &::placeholder {
    color: #a0aec0;
  }

  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const Button = styled.button`
  padding: 1rem 1.8rem;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0));
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
    
    &::after {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

const CloseButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

export default ChatRoom; 
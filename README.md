# Real-Time Chat Application

A real-time chat application built with React.js and Socket.IO that allows users to communicate instantly, see online users, and typing indicators.

## Features

- 🚀 Real-time messaging
- 👥 User authentication
- 🟢 Online status indicators
- ⌨️ Typing indicators
- 📱 Responsive design
- 📜 Message history
- 🕒 Message timestamps
- 🔒 Password protection

## Tech Stack

- **Frontend:**
  - React.js
  - Socket.IO Client
  - Styled Components
  - Environment Variables

- **Backend:**
  - Node.js
  - Express
  - Socket.IO
  - CORS

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18.x recommended)
- npm (comes with Node.js)
- Git

## Installation

1. Clone the repository:
```

2. Install dependencies for both client and server:
```

3. Create environment files:

For the client (`client/.env`):
```env
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Running Locally

1. Start the server:
```bash
cd server
npm start
```

2. In a new terminal, start the client:
```bash
cd client
npm start
```

3. Visit `http://localhost:3000` in your browser

## Deployment

### Backend Deployment (Render.com)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `server`
   - Environment Variable: `PORT=10000`

### Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy the client:
```bash
cd client
vercel --prod
```

3. Update the environment variable with your deployed backend URL

## Project Structure

```
Chat_application/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Entry point
│   └── package.json
│
└── server/                 # Backend Node.js application
    ├── src/
    │   └── index.js       # Server entry point
    └── package.json
```

## Usage

1. Open the application in your browser
2. Enter a username and password to log in
3. Start chatting!
4. See who's online in the sidebar
5. Watch for typing indicators when others are composing messages

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Socket.IO for real-time communication
- React.js community
- Styled Components for styling

## Contact

Project Link: [https://github.com/your-username/Chat_application](https://github.com/your-username/Chat_application)
```

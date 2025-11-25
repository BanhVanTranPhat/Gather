# Gather Town Clone

A production-ready 2D virtual meeting space application built with the MERN stack, featuring real-time avatar movement, proximity-based video/audio chat using WebRTC.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Phaser.js
- **Backend**: Node.js + Express.js + Socket.IO
- **Database**: MongoDB + Mongoose
- **Real-time Communication**: Socket.IO
- **Video/Audio**: WebRTC (simple-peer)

## Features

- 🎮 2D tile-based world with pixel-art style
- 👤 Avatar movement with keyboard controls (WASD/Arrow keys)
- 📡 Real-time position synchronization via Socket.IO
- 🎥 Proximity-based video/audio chat using WebRTC
- 👥 User list with online/offline status
- 🎨 Modern UI with sidebar and control bar

## Project Structure

```
.
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Room.js
│   ├── server.js
│   └── package.json
├── src/
│   ├── components/
│   │   ├── GameScene.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ControlBar.tsx
│   │   └── VideoChat.tsx
│   ├── contexts/
│   │   ├── SocketContext.tsx
│   │   └── WebRTCContext.tsx
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v20.19.0 or higher recommended)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gather-town
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Start MongoDB (if running locally):
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Install dependencies (from project root):
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
VITE_SERVER_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Enter your username and optionally a room ID
3. Click "Join Room"
4. Use **WASD** or **Arrow keys** to move your avatar
5. When you get close to other users (within 200 pixels), video/audio chat will automatically activate
6. Use the control bar to toggle video/audio

## Controls

- **W/↑**: Move up
- **S/↓**: Move down
- **A/←**: Move left
- **D/→**: Move right
- **Video Button**: Toggle video
- **Audio Button**: Toggle audio

## Development

### Backend Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

### Frontend Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Architecture

### Real-time Communication Flow

1. **User Movement**: 
   - Client sends position updates via Socket.IO
   - Server broadcasts to other users in the same room
   - Other clients update their Phaser sprites

2. **WebRTC Connection**:
   - When users are within proximity (200px), WebRTC connections are established
   - Signaling is handled via Socket.IO
   - Video/audio streams are peer-to-peer

### Proximity Detection

The system automatically detects when users are within 200 pixels of each other and establishes WebRTC connections. When users move apart, connections are automatically closed.

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Multiple rooms/spaces
- [ ] Text chat
- [ ] Screen sharing
- [ ] Custom avatars
- [ ] Room customization
- [ ] Persistent user data
- [ ] Mobile support

## License

ISC


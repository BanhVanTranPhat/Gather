# Tổng quan dự án Gather Town Clone

## ✅ Đã hoàn thành

### Backend (Node.js + Express + Socket.IO + MongoDB)
- ✅ Server Express với Socket.IO
- ✅ MongoDB connection và models (User, Room)
- ✅ Real-time communication handlers:
  - User join/leave room
  - Avatar movement synchronization
  - WebRTC signaling (offer/answer/ICE candidates)
- ✅ CORS và security configuration

### Frontend (React + TypeScript + Phaser.js)
- ✅ React app với TypeScript
- ✅ Phaser.js game scene với 2D world
- ✅ Avatar movement (WASD/Arrow keys)
- ✅ Real-time position sync qua Socket.IO
- ✅ WebRTC integration với simple-peer
- ✅ Proximity-based video/audio chat (tự động khi < 200px)
- ✅ UI Components:
  - Sidebar với user list
  - Control bar với video/audio controls
  - Video chat overlay
  - Join screen

### Features chính
1. **2D Virtual World**: Tile-based world với Phaser.js
2. **Avatar Movement**: Di chuyển mượt mà với keyboard
3. **Real-time Sync**: Vị trí avatar được sync real-time
4. **Proximity Chat**: Video/audio tự động khi gần nhau
5. **User Management**: Online/offline status, user list
6. **WebRTC**: Peer-to-peer video/audio streaming

## 📁 Cấu trúc Project

```
capstone/
├── backend/
│   ├── models/
│   │   ├── User.js          # MongoDB User model
│   │   └── Room.js          # MongoDB Room model
│   ├── server.js            # Express + Socket.IO server
│   ├── package.json
│   └── .env.example
│
├── src/
│   ├── components/
│   │   ├── GameScene.tsx    # Phaser game scene
│   │   ├── Sidebar.tsx      # User list sidebar
│   │   ├── ControlBar.tsx   # Video/audio controls
│   │   └── VideoChat.tsx    # WebRTC video display
│   │
│   ├── contexts/
│   │   ├── SocketContext.tsx    # Socket.IO context
│   │   └── WebRTCContext.tsx    # WebRTC context
│   │
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # React entry point
│   └── index.css
│
├── package.json             # Frontend dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── eslint.config.js         # ESLint config
├── README.md                # Full documentation
├── SETUP.md                 # Setup instructions
└── QUICKSTART.md            # Quick start guide
```

## 🚀 Cách chạy

### Backend
```bash
cd backend
npm install
# Tạo .env file
npm run dev
```

### Frontend
```bash
npm install
# Tạo .env file với VITE_SERVER_URL=http://localhost:5000
npm run dev
```

## 🔧 Technologies Used

- **Frontend**: React 19, TypeScript, Vite, Phaser.js 3.80
- **Backend**: Node.js, Express 4.18, Socket.IO 4.7
- **Database**: MongoDB với Mongoose 8.0
- **Real-time**: Socket.IO cho signaling
- **Video/Audio**: WebRTC với simple-peer 9.11
- **Styling**: CSS (có thể thêm Tailwind nếu cần)

## 📝 Notes

- WebRTC chỉ hoạt động trên HTTPS hoặc localhost
- Cần cho phép camera/microphone trong trình duyệt
- MongoDB phải đang chạy trước khi start backend
- Proximity threshold: 200 pixels

## 🎯 Next Steps (Optional Enhancements)

- [ ] User authentication (JWT)
- [ ] Multiple rooms/spaces
- [ ] Text chat
- [ ] Screen sharing
- [ ] Custom avatars
- [ ] Room customization
- [ ] Mobile responsive
- [ ] Better graphics với tilemaps


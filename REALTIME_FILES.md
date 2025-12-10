# Danh sách các file liên quan đến Realtime

## Backend - Socket.IO Server

### Core Server Files

1. **`backend/server.ts`**
   - Socket.IO server setup và configuration
   - User join/leave events (`user-join`, `user-left`)
   - Room management (`room-users` event)
   - Player movement events (`playerMovement`, `playerMoved`)
   - WebRTC signaling events
   - Disconnect handling với status updates
   - API endpoint: `/api/rooms/:roomId/users`

### Chat Controller

2. **`backend/controllers/chatController.js`**
   - Chat message handling (`chat-message` event)
   - Message reactions (`message-reaction`, `message-reaction-updated`)
   - Message edits (`edit-message`, `message-edited`)
   - Message deletes (`delete-message`, `message-deleted`)
   - Group chat creation (`create-group-chat`)
   - Broadcast logic cho tất cả message types

## Frontend - Socket Contexts

### Core Socket Context

3. **`src/contexts/SocketContext.tsx`**
   - Socket connection management
   - User status events (`user-joined`, `user-left`, `room-users`)
   - Player position updates (`allPlayersPositions`, `playerMoved`)
   - Room info updates (`room-info`)
   - User list management với online/offline status

### Chat Context

4. **`src/contexts/ChatContext.tsx`**
   - Chat message handling (`chat-message` event)
   - Message reactions (`message-reaction-updated`)
   - Message edits (`message-edited`)
   - Message deletes (`message-deleted`)
   - Channel management
   - Voice channel management
   - Message filtering và display

### Other Contexts

5. **`src/contexts/NotificationContext.tsx`**

   - Notification events từ socket
   - User join/leave notifications
   - Message notifications
   - Event notifications

6. **`src/contexts/WebRTCContext.tsx`**

   - WebRTC signaling events
   - Peer connection management
   - Audio/video stream handling

7. **`src/contexts/ObjectContext.tsx`**

   - Object placement events (nếu có realtime)

8. **`src/contexts/EventContext.tsx`**
   - Event creation/updates (nếu có realtime)

## Frontend - Components

### Game/Map Components

9. **`src/components/GameScene.tsx`**

   - Player movement realtime updates
   - User join/leave trên map
   - Chat message bubbles trên map
   - Socket events: `allPlayersPositions`, `user-joined`, `user-left`, `chat-message`

10. **`src/components/Sidebar.tsx`**
    - User list display với online/offline status
    - Real-time status updates từ SocketContext

### Chat Components

11. **`src/components/Chat.tsx`**

    - Nearby chat component
    - Socket events cho nearby messages

12. **`src/components/chat/ChatArea.tsx`**

    - Chat message display
    - Message input và sending
    - Real-time message updates

13. **`src/components/chat/MessageItem.tsx`**

    - Individual message display
    - Reactions, edits, deletes

14. **`src/components/chat/UserList.tsx`**
    - User list với online/offline status
    - Real-time status updates

### Other Components

15. **`src/components/Reactions.tsx`**

    - Reaction bubbles trên map
    - Socket events: `reaction`

16. **`src/components/VideoChat.tsx`**
    - Video chat với WebRTC
    - Socket signaling

## Frontend - Pages

17. **`src/pages/App.tsx`**

    - Main app với SocketProvider
    - Component routing

18. **`src/pages/ChatPage.tsx`**
    - Chat page với realtime messages
    - Channel management
    - User list integration

## Socket Events Summary

### User Status Events

- `user-join` - User joins room
- `user-joined` - Broadcast khi user join
- `user-left` - Broadcast khi user leave
- `room-users` - Broadcast danh sách users với status
- `room-info` - Room information updates

### Chat Events

- `chat-message` - Broadcast messages
- `message-reaction` - User reacts to message
- `message-reaction-updated` - Broadcast reaction updates
- `edit-message` - User edits message
- `message-edited` - Broadcast edit updates
- `delete-message` - User deletes message
- `message-deleted` - Broadcast delete updates

### Game/Map Events

- `playerMovement` - Player moves
- `playerMoved` - Broadcast movement
- `allPlayersPositions` - Broadcast all positions
- `reaction` - User reaction trên map

### WebRTC Events

- `webrtc-offer` - WebRTC offer
- `webrtc-answer` - WebRTC answer
- `webrtc-ice-candidate` - ICE candidate

## Key Features

1. **User Status Realtime**

   - Online/offline status updates
   - Room member list synchronization
   - Status persistence trong database

2. **Chat Realtime**

   - Instant message delivery
   - Reactions, edits, deletes
   - Channel-based messaging

3. **Game/Map Realtime**

   - Player movement synchronization
   - User presence trên map
   - Reaction bubbles

4. **WebRTC Realtime**
   - Audio/video chat
   - Proximity-based connections

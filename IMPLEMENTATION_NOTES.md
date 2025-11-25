# Ghi chú Implementation theo yêu cầu

## ✅ Đã hoàn thành các yêu cầu

### 1. Di chuyển trong Phaser.js Scene

**File: `src/components/GameScene.tsx`**

- ✅ **Tải tileset**: Đã tạo tileset với pattern checkered (32x32 pixels)
  - `tile_grass` và `tile_floor` được load trong `preload()`
  - Tileset được vẽ trong `create()` với pattern checkered

- ✅ **Tải spritesheet**: Đã tạo spritesheet cho avatar
  - `avatar` spritesheet với frame size 32x32
  - Fallback nếu spritesheet không load được

- ✅ **Di chuyển bằng phím mũi tên**: 
  - Hỗ trợ cả Arrow keys và WASD
  - Code trong `updatePlayerPosition()` method

- ✅ **Emit vị trí (x, y) qua Socket.IO**:
  ```typescript
  socket.emit('playerMovement', {
    x: this.playerPosition.x,
    y: this.playerPosition.y,
    position: this.playerPosition,
    direction,
  });
  ```

### 2. Đồng bộ vị trí trên Server

**File: `backend/server.js`**

- ✅ **Lắng nghe sự kiện "playerMovement"**:
  ```javascript
  socket.on('playerMovement', (data) => {
    // Xử lý vị trí
  });
  ```

- ✅ **Lưu trữ vị trí của tất cả người chơi**:
  - Vị trí được lưu trong `connectedUsers` Map
  - Mỗi user có `position: { x, y }`

- ✅ **Phát (broadcast) vị trí cho mọi client trong room**:
  ```javascript
  // Lấy tất cả người chơi trong room
  const allPlayersInRoom = Array.from(roomUsers.get(user.roomId) || [])
    .map(id => {
      const u = connectedUsers.get(id);
      return {
        userId: u.userId,
        username: u.username,
        avatar: u.avatar,
        position: u.position,
        direction: u.direction
      };
    })
    .filter(Boolean);

  // Broadcast cho tất cả client khác
  socket.to(user.roomId).emit('allPlayersPositions', allPlayersInRoom);
  
  // Gửi lại cho chính người chơi đó
  socket.emit('allPlayersPositions', allPlayersInRoom);
  ```

### 3. WebRTC với Proximity Detection

**File: `src/contexts/WebRTCContext.tsx`**

- ✅ **Tính toán khoảng cách**:
  ```typescript
  const distance = Math.sqrt(
    Math.pow(user.position.x - currentUser.position.x, 2) +
    Math.pow(user.position.y - currentUser.position.y, 2)
  );
  ```

- ✅ **Khoảng cách < 150 pixels → Bắt đầu WebRTC signaling**:
  ```typescript
  if (distance < 150) {
    const peer = createPeer(user.userId, true);
    // Khởi tạo PeerConnection
  }
  ```

- ✅ **Khoảng cách > 150 pixels → Đóng PeerConnection**:
  ```typescript
  if (distance >= 150) {
    peerConn.peer.destroy();
    // Đóng kết nối
  }
  ```

## Cấu trúc Event Flow

### Client → Server
1. `playerMovement` - Gửi vị trí (x, y) khi di chuyển

### Server → Client
1. `allPlayersPositions` - Nhận danh sách vị trí của tất cả người chơi

### WebRTC Signaling
- `webrtc-offer` - Gửi offer
- `webrtc-answer` - Gửi answer
- `webrtc-ice-candidate` - Gửi ICE candidate

## Thông số kỹ thuật

- **Tile size**: 32x32 pixels
- **Proximity threshold**: 150 pixels
- **Movement speed**: 100 pixels/second
- **Update frequency**: Mỗi 50ms (20 FPS)

## Lưu ý

1. Tileset và spritesheet hiện tại dùng placeholder images. Để sử dụng assets thật:
   - Thêm file tileset vào `public/` folder
   - Thêm spritesheet vào `public/` folder
   - Cập nhật đường dẫn trong `preload()`

2. WebRTC chỉ hoạt động khi:
   - Khoảng cách < 150 pixels
   - Cả 2 users đều có camera/microphone enabled
   - Đang ở cùng một room

3. Server broadcast tất cả vị trí mỗi khi có người di chuyển để đảm bảo đồng bộ.


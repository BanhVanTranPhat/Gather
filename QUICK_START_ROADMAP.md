# 🚀 Quick Start Roadmap - Bắt đầu từ đâu?

## 📍 Bạn đang ở đâu?

**Trạng thái hiện tại**:

- ✅ Basic 2D world với Phaser
- ✅ Avatar movement & sync
- ✅ Proximity video/audio chat
- ✅ Text chat (Nearby/Global/DM)
- ✅ Screen sharing
- ✅ Reactions
- ✅ Login/Register/Lobby

**Còn thiếu**:

- ❌ Map editor & custom maps
- ❌ Interactive objects
- ❌ Private spaces
- ❌ User settings
- ❌ Space management
- ❌ Calendar & events

---

## 🎯 Bước tiếp theo ngay lập tức (Tuần 1-2)

### Option A: Bắt đầu với Map System (Khuyến nghị)

**Lý do**: Map system là foundation cho mọi tính năng khác

#### Day 1-2: Setup Tileset System

```bash
# 1. Tạo tileset assets
mkdir -p public/assets/tilesets
# Download hoặc tạo tileset 32x32 hoặc 64x64

# 2. Tạo Map model
# backend/models/Map.js

# 3. Tạo map routes
# backend/routes/mapRoutes.js
```

#### Day 3-5: Basic Map Editor

```typescript
// src/components/MapEditor.tsx
// - Grid overlay
// - Tile selection panel
// - Click to place tiles
// - Save to database
```

#### Day 6-7: Load Map từ Database

```typescript
// Update GameScene.tsx
// - Load map data từ API
// - Render tiles từ map data
// - Collision detection với map
```

---

### Option B: Bắt đầu với Interactive Objects (Nhanh hơn)

**Lý do**: Dễ implement, impact cao, users thấy ngay giá trị

#### Day 1-2: Object Detection

```typescript
// src/components/InteractiveObject.tsx
// - Detect khi avatar < 50px từ object
// - Show "Press X" prompt
// - Highlight object
```

#### Day 3-4: Object Frame Modal

```typescript
// src/components/ObjectFrame.tsx
// - Modal overlay
// - Support iframe (website/video)
// - Close button
```

#### Day 5-7: Whiteboard Component

```typescript
// src/components/Whiteboard.tsx
// - Canvas drawing
// - Multiple users cùng vẽ
// - Save drawing
```

---

## 📋 Checklist hàng ngày

### Tuần 1: Foundation

- [ ] **Day 1**: Setup tileset system, create Map model
- [ ] **Day 2**: Basic map editor UI
- [ ] **Day 3**: Save/load map từ database
- [ ] **Day 4**: Render map trong GameScene
- [ ] **Day 5**: Collision detection với map
- [ ] **Day 6**: Test & fix bugs
- [ ] **Day 7**: Documentation & code review

### Tuần 2: Interactive Objects

- [ ] **Day 1**: Object detection system
- [ ] **Day 2**: Object frame modal
- [ ] **Day 3**: Website/video embed
- [ ] **Day 4**: Whiteboard component
- [ ] **Day 5**: Object placement trong map editor
- [ ] **Day 6**: Multi-user support cho objects
- [ ] **Day 7**: Testing & polish

---

## 🛠️ Code Templates để bắt đầu

### 1. Map Model (backend/models/Map.js)

```javascript
import mongoose from "mongoose";

const MapSchema = new mongoose.Schema({
  mapId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  spaceId: { type: String, required: true },
  width: { type: Number, default: 50 }, // tiles
  height: { type: Number, default: 50 },
  tiles: [[Number]], // 2D array
  objects: [
    {
      id: String,
      type: String,
      x: Number,
      y: Number,
      properties: mongoose.Schema.Types.Mixed,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Map", MapSchema);
```

### 2. Map Editor Component (src/components/MapEditor.tsx)

```typescript
import { useState, useEffect } from "react";
import Phaser from "phaser";

const MapEditor = ({ spaceId, onSave }) => {
  const [selectedTile, setSelectedTile] = useState(0);
  const [mapData, setMapData] = useState(null);

  // TODO: Implement map editor
  return (
    <div className="map-editor">
      <div className="tile-palette">{/* Tile selection */}</div>
      <div className="map-canvas">{/* Phaser canvas for editing */}</div>
      <button onClick={handleSave}>Save Map</button>
    </div>
  );
};
```

### 3. Interactive Object Component (src/components/InteractiveObject.tsx)

```typescript
import { useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";

const InteractiveObject = ({ object, position }) => {
  const { currentUser } = useSocket();
  const [isNearby, setIsNearby] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check distance từ currentUser đến object
    if (currentUser) {
      const distance = Math.sqrt(
        Math.pow(currentUser.position.x - position.x, 2) +
          Math.pow(currentUser.position.y - position.y, 2)
      );
      setIsNearby(distance < 50);
    }
  }, [currentUser, position]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "x" && isNearby) {
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isNearby]);

  return (
    <>
      {isNearby && <div className="interact-prompt">Press X to interact</div>}
      {isOpen && (
        <ObjectFrame object={object} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};
```

---

## 🎨 Assets cần chuẩn bị

### Tileset:

- [ ] Download tileset miễn phí từ:
  - [OpenGameArt.org](https://opengameart.org/)
  - [itch.io](https://itch.io/game-assets/free)
  - Hoặc tạo bằng [Tiled Map Editor](https://www.mapeditor.org/)

### Sprites:

- [ ] Avatar spritesheet (4 directions)
- [ ] Object sprites (furniture, decorations)
- [ ] UI icons

---

## 📚 Resources học tập

### Phaser.js:

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser Examples](https://phaser.io/examples)

### WebRTC:

- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Simple-peer Documentation](https://github.com/feross/simple-peer)

### Pathfinding:

- [EasyStar.js](https://github.com/prettymuchbryce/easystarjs)

---

## ⚠️ Common Pitfalls & Solutions

### 1. Map quá lớn → Performance issues

**Solution**:

- Chunk system (load visible chunks only)
- Object pooling
- LOD (Level of Detail)

### 2. WebRTC không connect

**Solution**:

- Check TURN server
- Test trên HTTPS/localhost
- Check firewall settings

### 3. Avatar movement không mượt

**Solution**:

- Interpolation
- Client-side prediction
- Server reconciliation

---

## 🎯 Milestone Goals

### Milestone 1 (Week 2): Map System

- ✅ Map editor hoạt động
- ✅ Save/load map
- ✅ Render map trong game

### Milestone 2 (Week 4): Interactive Objects

- ✅ Object detection
- ✅ Website/video embed
- ✅ Whiteboard

### Milestone 3 (Week 6): Private Spaces

- ✅ Zone system
- ✅ Audio isolation
- ✅ Zone management

---

## 💡 Tips để thành công

1. **Start small**: Implement từng feature nhỏ, test kỹ trước khi tiếp tục
2. **Version control**: Commit thường xuyên với messages rõ ràng
3. **Test early**: Test ngay từ đầu, không đợi đến cuối
4. **Document**: Viết comments và docs khi code
5. **Ask for help**: Không ngại hỏi khi stuck

---

**Chúc bạn coding vui vẻ! 🚀**

_Nếu có câu hỏi, xem DEVELOPMENT_ROADMAP.md để biết chi tiết hơn._

# 🗺️ Map System - Hướng dẫn sử dụng

## ✅ Đã hoàn thành

Map System đã được implement với các tính năng:

1. **Map Model**: Lưu map data trong database
2. **Map API**: GET/PUT endpoints để quản lý maps
3. **Map Context**: React context để quản lý map state
4. **Map Rendering**: GameScene tự động load và render map từ database
5. **Collision Detection**: Avatar không thể đi qua walls
6. **Default Map**: Tự động tạo default map nếu chưa có

---

## 🚀 Cách hoạt động

### 1. Map Structure

Map được lưu trong database với cấu trúc:
```javascript
{
  mapId: "map-roomId-timestamp",
  roomId: "default-room",
  name: "Default Map",
  width: 50,  // tiles
  height: 50, // tiles
  tileSize: 32, // pixels
  tiles: [[Number]], // 2D array: 0 = floor, 1 = wall
  collision: [[Boolean]], // 2D array: true = impassable
  zones: [] // For future private spaces
}
```

### 2. Tile Types

- **0**: Floor tile (passable)
- **1**: Wall tile (impassable)
- **2+**: Custom tiles (có thể mở rộng sau)

### 3. Auto-load

Khi user vào room:
1. MapContext tự động fetch map từ API
2. Nếu chưa có map, backend tự động tạo default map
3. GameScene render map khi có data
4. Collision detection hoạt động tự động

---

## 📋 API Endpoints

### GET `/api/maps/room/:roomId`
Lấy map của room (tự động tạo nếu chưa có)

**Response**:
```json
{
  "mapId": "map-default-room-1234567890",
  "roomId": "default-room",
  "name": "Default Map",
  "width": 50,
  "height": 50,
  "tileSize": 32,
  "tiles": [[0, 0, 1, ...], ...],
  "collision": [[false, false, true, ...], ...]
}
```

### PUT `/api/maps/room/:roomId`
Update map

**Body**:
```json
{
  "tiles": [[0, 0, 1, ...], ...],
  "collision": [[false, false, true, ...], ...],
  "name": "Updated Map Name"
}
```

### POST `/api/maps`
Tạo map mới (nếu chưa có)

---

## 🎨 Map Rendering

### Current Implementation:
- **Floor tiles**: Checkered pattern (2 màu)
- **Wall tiles**: Brown rectangles với border
- **Grid lines**: Subtle grid overlay
- **Collision**: Avatar không thể đi qua walls

### Future Enhancements:
- Custom tileset images
- Multiple tile layers
- Animated tiles
- Decorative objects

---

## 🔧 Collision Detection

### How it works:
1. Player position được convert sang tile coordinates
2. Check collision map tại tile đó
3. Nếu collision = true, revert position
4. Smooth movement với collision prevention

### Collision Map:
- `collision[y][x] = true` → Impassable
- `collision[y][x] = false` → Passable
- Default map có walls ở edges và một số interior walls

---

## 🛠️ Technical Details

### Backend:
- `backend/models/Map.js` - Map schema
- `backend/controllers/mapController.js` - CRUD operations
- `backend/routes/mapRoutes.js` - API routes
- Auto-create default map nếu chưa có

### Frontend:
- `src/contexts/MapContext.tsx` - Map state management
- `src/components/GameScene.tsx` - Map rendering và collision
- Auto-load khi vào room
- Re-render khi map data thay đổi

---

## 🎯 Default Map Features

Default map được tạo tự động có:
- **Size**: 50x50 tiles (1600x1600 pixels)
- **Walls**: Border walls + một số interior walls
- **Floor**: Checkered pattern
- **Collision**: Proper collision map

---

## 🐛 Troubleshooting

### Map không load
1. Check MapContext có được wrap trong App không
2. Check API response trong Network tab
3. Check console logs

### Collision không hoạt động
1. Check collision map có được load không
2. Check tile coordinates calculation
3. Check player position bounds

### Map không render
1. Check mapData có trong context không
2. Check tiles array có valid không
3. Check GameScene có re-render khi mapData thay đổi không

---

## 🎯 Next Steps

1. **Map Editor**: UI để edit map (place walls, floors)
2. **Custom Tilesets**: Import tileset images
3. **Multiple Layers**: Floor, walls, decorations layers
4. **Zones**: Private spaces với audio isolation
5. **Map Templates**: Pre-built maps để chọn

---

## 📝 Code Structure

### Map Data Flow:
1. User joins room → MapContext fetches map
2. Map data stored in context
3. GameScene reads from context
4. Render tiles và setup collision
5. Player movement checks collision map

### Key Functions:
- `renderMap()`: Render tiles từ map data
- `renderDefaultMap()`: Fallback rendering
- `renderGrid()`: Grid overlay
- Collision check trong `updatePlayerPosition()`

---

**Map System đã sẵn sàng! Maps sẽ tự động load khi vào room. 🗺️**


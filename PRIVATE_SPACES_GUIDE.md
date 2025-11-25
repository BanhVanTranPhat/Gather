# 🚪 Private Spaces System - Hướng dẫn sử dụng

## ✅ Đã hoàn thành

Private Spaces system đã được implement với các tính năng:

1. **Zone System**: Tạo và quản lý zones trên map
2. **Audio Isolation**: Users trong cùng zone mới nghe thấy nhau
3. **Visual Boundaries**: Hiển thị zone boundaries trên map
4. **Zone Detection**: Tự động detect khi avatar vào/ra zone
5. **WebRTC Integration**: Chỉ connect với users trong cùng zone

---

## 🚀 Cách hoạt động

### 1. Zone Concept

- **Zone**: Một vùng hình chữ nhật trên map
- **Private Space**: Users trong zone chỉ nghe thấy nhau
- **Public Area**: Users ngoài zones nghe thấy tất cả nearby users

### 2. Audio Isolation Logic

```
IF users trong cùng zone:
  → WebRTC connect (nếu < 150px)
ELSE IF users khác zone:
  → NO WebRTC connection (dù có gần nhau)
ELSE IF cả 2 ngoài zones:
  → WebRTC connect (public area)
```

### 3. Zone Detection

- Check zone membership mỗi khi avatar di chuyển
- Update WebRTC connections khi zone thay đổi
- Smooth transition khi vào/ra zone

---

## 📋 Cách sử dụng

### 1. Tạo Zone

1. Click button 🗺️ trong ControlBar → Map Editor
2. Click "Manage Private Spaces"
3. Click "+ Create Zone"
4. Click trên map để set start point
5. Click lại để set end point
6. Nhập zone name và max users
7. Click "Create Zone"

### 2. Test Private Spaces

1. Tạo 2 zones khác nhau
2. User A vào zone 1
3. User B vào zone 2
4. Di chuyển gần nhau (< 150px)
5. **Kết quả**: Không nghe thấy nhau (khác zone)

### 3. Test Same Zone

1. User A và B cùng vào zone 1
2. Di chuyển gần nhau (< 150px)
3. **Kết quả**: Nghe thấy nhau (cùng zone)

---

## 🎨 Visual Features

### Zone Boundaries
- **Dashed border**: Purple (#4f46e5)
- **Semi-transparent background**: Highlight zone area
- **Zone name label**: Hiển thị trên top-left
- **Pulse animation**: Subtle animation để dễ nhìn

### Zone Editor
- List tất cả zones
- Create/Delete zones
- Visual placement với click on map
- Zone info (bounds, size, max users)

---

## 🔧 Technical Details

### Zone Data Structure
```typescript
{
  id: string;
  name: string;
  bounds: {
    x1: number; // Start X
    y1: number; // Start Y
    x2: number; // End X
    y2: number; // End Y
  };
  maxUsers?: number;
}
```

### Zone Detection Algorithm
```typescript
// Check if point is in zone
isPointInZone(x, y, zone) {
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

// Get zone for position
getZoneForPosition(x, y, zones) {
  return zones.find(zone => isPointInZone(x, y, zone))?.id || null;
}

// Check if users in same zone
areUsersInSameZone(user1Pos, user2Pos, zones) {
  const zone1 = getZoneForPosition(user1Pos.x, user1Pos.y, zones);
  const zone2 = getZoneForPosition(user2Pos.x, user2Pos.y, zones);
  return zone1 === zone2; // null === null = true (public area)
}
```

### WebRTC Integration
- Check zone membership trước khi create peer
- Disconnect peers khi users vào khác zone
- Reconnect khi users vào cùng zone lại

---

## 📊 API Endpoints

### Update Zones (via Map API)
```bash
PUT /api/maps/room/:roomId
Body: {
  zones: [
    {
      id: "zone-123",
      name: "Meeting Room 1",
      bounds: { x1: 100, y1: 100, x2: 400, y2: 300 },
      maxUsers: 10
    }
  ]
}
```

---

## 🎯 Use Cases

### 1. Meeting Rooms
- Tạo zones cho các phòng họp
- Users trong phòng chỉ nghe thấy nhau
- Privacy cho meetings

### 2. Private Conversations
- Tạo small zones cho 1-on-1 chats
- Isolated audio cho private talks

### 3. Open Office Layout
- Public area: Everyone can hear
- Private rooms: Isolated audio
- Flexible workspace design

---

## 🐛 Troubleshooting

### Users không nghe thấy nhau trong cùng zone
1. Check zones có được load không
2. Check zone bounds có đúng không
3. Check WebRTC connections trong console
4. Check distance < 150px

### Zone boundaries không hiển thị
1. Check ZonesLayer có được render không
2. Check mapData.zones có data không
3. Check browser console for errors

### Zone detection không hoạt động
1. Check zoneUtils functions
2. Check user positions có đúng không
3. Check zone bounds calculation

---

## 🎯 Future Enhancements

1. **Zone Permissions**: Access control cho zones
2. **Zone Templates**: Pre-built zone layouts
3. **Zone Animations**: Smooth transitions
4. **Zone Notifications**: Alert khi vào/ra zone
5. **Zone Capacity**: Visual indicator khi zone đầy

---

## 📝 Code Structure

### Utilities:
- `src/utils/zoneUtils.ts` - Zone detection functions

### Components:
- `src/components/ZoneEditor.tsx` - Zone management UI
- `src/components/ZonesLayer.tsx` - Visual zone boundaries
- `src/components/MapEditor.tsx` - Integration với map editor

### Contexts:
- `src/contexts/WebRTCContext.tsx` - Zone-aware WebRTC logic
- `src/contexts/MapContext.tsx` - Map data với zones

---

**Private Spaces đã sẵn sàng! Tạo zones để có audio isolation. 🚪**


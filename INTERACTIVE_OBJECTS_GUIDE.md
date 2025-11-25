# 🎯 Interactive Objects System - Hướng dẫn sử dụng

## ✅ Đã hoàn thành

Hệ thống Interactive Objects đã được implement với các tính năng:

1. **Object Detection**: Tự động phát hiện khi avatar đến gần object (< 50px)
2. **Multiple Object Types**:
   - 🌐 Website (iframe)
   - 🎥 Video (YouTube/Vimeo)
   - 📋 Whiteboard (placeholder, sẽ implement sau)
   - 🖼️ Image
   - 📄 Document
   - 🎮 Game
3. **Object Frame**: Modal overlay để hiển thị content
4. **Keyboard Interaction**: Nhấn `X` để mở, `ESC` để đóng

---

## 🚀 Cách sử dụng

### 1. Tạo Objects trong Database

#### Option A: Sử dụng API

```bash
# Tạo object mới
curl -X POST http://localhost:5000/api/objects \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "default-room",
    "type": "website",
    "name": "Google",
    "position": { "x": 300, "y": 200 },
    "properties": {
      "url": "https://www.google.com",
      "width": 800,
      "height": 600
    }
  }'
```

#### Option B: Sử dụng script (sẽ tạo sau)

```bash
# Tạo test objects
node scripts/createTestObject.js default-room
```

### 2. Test trong Game

1. **Start backend**: `cd backend && npm run dev`
2. **Start frontend**: `npm run dev`
3. **Login và vào room**
4. **Di chuyển avatar** đến vị trí object (xem trong database)
5. **Khi đến gần** (< 50px), sẽ thấy prompt "Press X to interact"
6. **Nhấn X** để mở object frame
7. **Nhấn ESC** hoặc click ngoài để đóng

---

## 📋 API Endpoints

### GET `/api/objects/room/:roomId`

Lấy tất cả objects trong room

**Response**:

```json
[
  {
    "objectId": "obj-123",
    "roomId": "default-room",
    "type": "website",
    "name": "Google",
    "position": { "x": 300, "y": 200 },
    "properties": {
      "url": "https://www.google.com",
      "width": 800,
      "height": 600
    }
  }
]
```

### POST `/api/objects`

Tạo object mới

**Body**:

```json
{
  "roomId": "default-room",
  "type": "video",
  "name": "YouTube Video",
  "position": { "x": 600, "y": 400 },
  "properties": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
}
```

### PUT `/api/objects/:objectId`

Update object

### DELETE `/api/objects/:objectId`

Xóa object (soft delete)

---

## 🎨 Object Types & Properties

### Website

```json
{
  "type": "website",
  "properties": {
    "url": "https://example.com",
    "width": 800,
    "height": 600,
    "allowFullscreen": true
  }
}
```

### Video (YouTube/Vimeo)

```json
{
  "type": "video",
  "properties": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
}
```

### Image

```json
{
  "type": "image",
  "properties": {
    "imageUrl": "https://example.com/image.jpg"
  }
}
```

### Whiteboard ✅ (Fully Implemented)

```json
{
  "type": "whiteboard",
  "properties": {
    "content": "", // Base64 image data (PNG)
    "width": 1200,
    "height": 800
  }
}
```

**Features**:

- ✅ Real-time collaborative drawing
- ✅ Pen tool với color picker
- ✅ Eraser tool
- ✅ Brush size adjustment
- ✅ Multi-user support với color coding
- ✅ Auto-save to database
- ✅ Clear canvas function

---

## 🔧 Cấu trúc Code

### Backend

- `backend/models/Object.js` - Object model
- `backend/controllers/objectController.js` - CRUD operations
- `backend/routes/objectRoutes.js` - API routes

### Frontend

- `src/contexts/ObjectContext.tsx` - Context để quản lý objects
- `src/components/InteractiveObject.tsx` - Component detect và interact
- `src/components/ObjectFrame.tsx` - Modal để hiển thị content
- `src/components/ObjectsLayer.tsx` - Render objects trên map

---

## 🐛 Troubleshooting

### Objects không hiển thị

1. Check xem objects có trong database không
2. Check `roomId` có đúng không
3. Check console logs để xem có lỗi API không

### Object detection không hoạt động

1. Check distance threshold (hiện tại là 50px)
2. Check `currentUser.position` có được update không
3. Check console logs

### Object frame không mở

1. Check keyboard event listener
2. Check `isNearby` state
3. Check console logs

---

## 🎯 Next Steps

1. ✅ **Whiteboard Component**: ✅ Implemented với real-time collaboration
2. **Object Placement UI**: Admin panel để đặt objects trên map
3. ✅ **Multi-user Support**: ✅ Đã có cho whiteboard, cần thêm cho các object types khác
4. **Object Animations**: Smooth transitions
5. **Object Permissions**: Access control cho objects
6. **Touch Support**: Mobile drawing cho whiteboard
7. **Shapes Tool**: Rectangle, circle, line tools cho whiteboard

---

## 📝 Notes

- Object detection distance: 50 pixels
- Objects được render trên map với icon và name label
- Object frame là modal overlay, có thể đóng bằng ESC hoặc click outside
- Video URLs tự động convert sang embed format (YouTube/Vimeo)

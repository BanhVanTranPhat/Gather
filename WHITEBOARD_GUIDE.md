# 🎨 Whiteboard Component - Hướng dẫn sử dụng

## ✅ Tính năng đã hoàn thành

Whiteboard component đã được implement đầy đủ với các tính năng:

1. **Real-time Collaboration**: Nhiều users có thể vẽ cùng lúc
2. **Drawing Tools**:
   - ✏️ Pen tool với color picker
   - 🧹 Eraser tool
   - Brush size adjustment (1-20px)
3. **Multi-user Support**: Mỗi user có màu riêng để phân biệt
4. **Auto-save**: Tự động lưu vào database khi vẽ
5. **Clear Canvas**: Xóa toàn bộ canvas
6. **Visual Feedback**: Hiển thị users đang vẽ

---

## 🚀 Cách sử dụng

### 1. Tạo Whiteboard Object

#### Option A: Sử dụng Script
```bash
node scripts/createWhiteboardObject.js default-room 500 400
```

#### Option B: Sử dụng API
```bash
curl -X POST http://localhost:5000/api/objects \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "default-room",
    "type": "whiteboard",
    "name": "My Whiteboard",
    "position": { "x": 500, "y": 400 },
    "properties": {
      "content": "",
      "width": 1200,
      "height": 800
    }
  }'
```

### 2. Sử dụng trong Game

1. **Di chuyển avatar** đến vị trí whiteboard object
2. **Khi đến gần** (< 50px), nhấn `X` để mở
3. **Vẽ** bằng cách click và drag trên canvas
4. **Chọn màu** từ color picker
5. **Điều chỉnh brush size** bằng slider
6. **Chuyển sang eraser** bằng nút eraser
7. **Clear canvas** nếu cần
8. **Save** để lưu vào database (tự động khi vẽ)

---

## 🎨 Drawing Tools

### Pen Tool ✏️
- Vẽ với màu đã chọn
- Brush size: 1-20px
- Smooth strokes với lineCap="round"

### Eraser Tool 🧹
- Xóa bằng cách vẽ màu trắng
- Size tự động x2 để dễ xóa
- Có thể điều chỉnh size

### Color Picker
- Chọn màu từ color picker
- Disabled khi dùng eraser
- Mỗi user có màu riêng khi collaborate

---

## 👥 Multi-user Collaboration

### How it works:
1. **Real-time sync**: Mỗi stroke được broadcast qua Socket.IO
2. **Color coding**: Mỗi user có màu riêng (8 màu rotation)
3. **Visual indicator**: Toolbar hiển thị users đang vẽ
4. **Smooth drawing**: Strokes được sync real-time

### User Colors:
- Red, Blue, Green, Magenta, Cyan, Orange, Purple, Pink
- Colors được assign dựa trên userId

---

## 💾 Save & Load

### Auto-save:
- Tự động save sau mỗi stroke
- Lưu dưới dạng Base64 PNG image
- Lưu vào `object.properties.content`

### Load:
- Tự động load khi mở whiteboard
- Load từ `object.properties.content`
- Render image lên canvas

---

## 🔧 Technical Details

### Socket.IO Events:

**Emit** (`whiteboard-draw`):
```javascript
{
  objectId: string,
  userId: string,
  username: string,
  type: "start" | "draw" | "end",
  x: number,
  y: number,
  color: string,
  brushSize: number
}
```

**Listen** (`whiteboard-draw`):
- Nhận events từ users khác
- Render strokes real-time
- Update user indicators

### Canvas API:
- HTML5 Canvas với 2D context
- Size: 1200x800 pixels
- Background: White (#FFFFFF)
- Image format: PNG (Base64)

---

## 🐛 Troubleshooting

### Whiteboard không sync
1. Check Socket.IO connection
2. Check `objectId` có đúng không
3. Check console logs để xem events

### Drawing không mượt
1. Check browser performance
2. Reduce brush size nếu cần
3. Check network latency

### Canvas không load
1. Check `initialContent` có đúng format không
2. Check image data có valid không
3. Check console errors

---

## 🎯 Future Enhancements

1. **Shapes Tool**: Rectangle, circle, line
2. **Text Tool**: Add text labels
3. **Undo/Redo**: History management
4. **Touch Support**: Mobile drawing
5. **Export**: Download as PNG/PDF
6. **Layers**: Multiple drawing layers
7. **Stickers**: Pre-made shapes và icons

---

## 📝 Code Structure

### Components:
- `src/components/Whiteboard.tsx` - Main component
- `src/components/Whiteboard.css` - Styles
- `src/components/ObjectFrame.tsx` - Wrapper component

### Backend:
- `backend/server.js` - Socket.IO handlers
- `backend/controllers/objectController.js` - Save/load API
- `backend/models/Object.js` - Data model

---

**Whiteboard đã sẵn sàng để sử dụng! 🎨**


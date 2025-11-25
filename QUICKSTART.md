# Quick Start Guide

## Cài đặt nhanh (3 bước)

### 1. Backend
```bash
cd backend
npm install
# Tạo file .env với nội dung:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/gather-town
# JWT_SECRET=your-secret-key
# CLIENT_URL=http://localhost:5173
npm run dev
```

### 2. Frontend (terminal mới)
```bash
# Từ thư mục gốc
npm install
# Tạo file .env với nội dung:
# VITE_SERVER_URL=http://localhost:5000
npm run dev
```

### 3. Mở trình duyệt
- Truy cập: http://localhost:5173
- Nhập username và join room
- Di chuyển bằng WASD hoặc Arrow keys
- Video/audio tự động bật khi gần người khác (< 200px)

## Lưu ý quan trọng

1. **MongoDB phải đang chạy** trước khi start backend
2. **Cho phép camera/microphone** trong trình duyệt
3. **WebRTC chỉ hoạt động trên HTTPS hoặc localhost**

## Troubleshooting

- **Lỗi kết nối MongoDB**: Kiểm tra MongoDB service đã start chưa
- **Lỗi WebRTC**: Đảm bảo đang dùng localhost hoặc HTTPS
- **Lỗi Socket.IO**: Kiểm tra backend đang chạy trên port 5000


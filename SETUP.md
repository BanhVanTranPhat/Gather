# Hướng dẫn Setup Project Gather Town Clone

## Bước 1: Cài đặt MongoDB

### Windows:
1. Tải MongoDB từ https://www.mongodb.com/try/download/community
2. Cài đặt và chạy MongoDB service
3. Hoặc sử dụng MongoDB Atlas (cloud) - miễn phí

### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux:
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

## Bước 2: Setup Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gather-town
JWT_SECRET=your-secret-key-change-this
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Chạy backend:
```bash
npm run dev
```

## Bước 3: Setup Frontend

Từ thư mục gốc của project:
```bash
npm install
```

Tạo file `.env` trong thư mục gốc:
```
VITE_SERVER_URL=http://localhost:5000
```

Chạy frontend:
```bash
npm run dev
```

## Bước 4: Mở trình duyệt

Truy cập: http://localhost:5173

## Troubleshooting

### Lỗi MongoDB connection:
- Kiểm tra MongoDB đã chạy chưa
- Kiểm tra MONGODB_URI trong file .env
- Thử dùng MongoDB Atlas nếu local không hoạt động

### Lỗi WebRTC:
- Đảm bảo sử dụng HTTPS hoặc localhost (WebRTC yêu cầu secure context)
- Cho phép camera và microphone trong trình duyệt

### Lỗi Socket.IO connection:
- Kiểm tra backend đang chạy trên port 5000
- Kiểm tra VITE_SERVER_URL trong file .env của frontend


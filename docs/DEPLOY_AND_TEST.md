# Deploy (Netlify + Render) và Test

## Đã deploy: Frontend Netlify, Backend Render

- **Frontend**: build từ repo (Vite), host trên Netlify. Cần set biến môi trường `VITE_SERVER_URL` = URL backend (ví dụ `https://your-app.onrender.com`).
- **Backend**: Node server trên Render. Cần set:
  - `MONGODB_URI`, `CLIENT_URL` (URL frontend Netlify), `JWT_SECRET`, v.v.
  - **`BASE_URL`** = URL backend (ví dụ `https://your-app.onrender.com`) để link upload ảnh trả về full URL cho avatar.

---

## Nhiều người vào 1 phòng chat / call (tối thiểu 20 người)

- **Có**, kiến trúc hỗ trợ nhiều người trong cùng một phòng:
  - **Chat**: room-based, mỗi phòng có kênh text/voice, backend lưu tin nhắn và members.
  - **Call video/audio**: WebRTC qua SFU (trong `backend/webrtc/sfu.ts`), phòng có giới hạn **maxUsers** (20 hoặc 50 tùy loại phòng).
  - Khi tạo phòng có thể chọn sức chứa 20 (thường) hoặc 50 (premium).

**Lưu ý khi deploy:**

1. **Render free tier**: service có thể sleep sau khoảng 15 phút không có request. Lần đầu nhiều user vào có thể chậm (wake-up). Cân nhắc plan trả phí nếu cần ổn định.
2. **WebSocket/Socket.IO**: đảm bảo `CLIENT_URL` trên Render đúng URL frontend Netlify để CORS và kết nối socket không bị chặn.
3. **HTTPS**: Netlify và Render đều dùng HTTPS; WebRTC thường cần HTTPS (hoặc localhost) để hoạt động.

---

## Cách test role Admin sau khi đã deploy

Sau khi up lên production, role admin **không** có sẵn qua giao diện; cần gán trong database hoặc bằng script.

### Cách 1: MongoDB (Atlas / shell)

1. Vào MongoDB (Atlas Dashboard hoặc shell kết nối `MONGODB_URI`).
2. Tìm user theo email (user đã đăng ký/đăng nhập ít nhất một lần):
   ```javascript
   db.users.updateOne(
     { email: "email_cua_ban@gmail.com" },
     { $set: { role: "admin" } }
   )
   ```
3. User đó **đăng xuất** trên site rồi **đăng nhập lại** (hoặc refresh trang Dashboard). Frontend lấy lại `user.role` từ `/api/user/me`.
4. Vào **Trang quản trị**: sidebar dưới "Cài đặt" sẽ có **"Trang quản trị"** (chỉ khi đã admin), hoặc truy cập trực tiếp: `https://your-netlify-site.netlify.app/admin`. Nếu chưa đăng nhập hoặc không phải admin sẽ bị chuyển về trang chủ / dashboard.

### Cách 2: Script (chạy local, kết nối DB production)

Nếu bạn có script `scripts/set-admin.ts` (hoặc tương tự) và local có thể kết nối DB production:

1. Cấu hình `MONGODB_URI` trỏ tới database production.
2. Chạy:
   ```bash
   npx tsx scripts/set-admin.ts email_cua_ban@gmail.com
   ```
3. User đó đăng xuất rồi đăng nhập lại và vào `/admin` như trên.

**Tóm lại:** Gán `role: "admin"` trong DB (hoặc script) → user đăng nhập lại → vào `/admin` để test quản trị.

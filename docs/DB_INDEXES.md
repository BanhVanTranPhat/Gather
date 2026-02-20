# MongoDB indexes – Rà soát Bước 6

Các collection hay query theo `roomId` / `userId` đã có index phù hợp trong schema Mongoose. Không cần thêm index mới; chỉ cần đảm bảo index đã được tạo trên DB (MongoDB tạo khi khởi động hoặc khi dùng `syncIndexes()`).

## Đã có index

| Model | Index chính | Ghi chú |
|-------|-------------|--------|
| **Room** | `roomId` (unique), `createdBy`, `isPrivate`, `isActive` | Query `findOne({ roomId })` dùng unique index. |
| **RoomMember** | `(roomId, userId)` unique, `userId`, `(roomId, isOnline)`, `(roomId, role)`, `(isOnline, lastSeen)` | Query theo room/user đều có index. |
| **User** | `username` (unique), `email` (unique), `googleId` (unique), `currentRoom`, `role`, `lastSeen` | Auth và admin query đủ. |
| **Message** | `(roomId, timestamp)`, `(channelId, timestamp)`, `(roomId, messageId)` unique, … | Chat history theo room/channel. |
| **Notification** | `(userId, isRead, createdAt)`, `(userId, createdAt)` | Theo user. |
| **Session** | `userId`, `refreshToken` (unique), `(userId, refreshToken)` | Token lookup. |
| **OtpCode** | `email`, `(email, purpose, createdAt)` | OTP lookup. |
| **Event** | `(roomId, startTime)`, `createdBy`, `(startTime, endTime)` | Events theo room. |
| **Map** | `roomId` | Map theo room. |
| **Object** (world) | `(roomId, isActive)`, `createdBy`, `(type, roomId)` | Objects theo room. |
| **Analytics** | `eventType`, `userId`, `sessionId`, `timestamp`, TTL 90 ngày | Query analytics. |
| **Resource** | text index, `createdBy`, `isApproved` | Library/search. |
| **EventTemplate** | `(createdBy, isPublic)`, `category` | Templates. |

## Gợi ý

- Ở môi trường production, sau khi deploy có thể gọi `Model.syncIndexes()` một lần (hoặc để Mongoose tạo khi app khởi động) để đảm bảo index trùng với schema.
- Nếu thêm query mới theo field chưa có index (ví dụ filter theo `createdAt`), nên thêm index tương ứng trong model.

# Threat Model – Gather (High-Level)

Tài liệu mô tả ngắn gọn các vector tấn công và biện pháp giảm thiểu, thể hiện security mindset.

---

## STRIDE (subset áp dụng)

| Threat | Mô tả | Áp dụng hệ thống | Mitigation hiện có |
|--------|--------|-------------------|--------------------|
| **S**poofing | Giả mạo danh tính | User join room với username người khác | JWT auth; username unique trong room (server kiểm tra). Chưa có E2E verification danh tính. |
| **T**ampering | Sửa dữ liệu trên đường truyền | Sửa payload chat, position | HTTPS; server là source of truth (position/chat validate và persist từ server). |
| **R**epudiation | Chối bỏ hành động | User chối đã gửi message / kick | Message persist với senderId, timestamp. Log server; có thể bổ sung audit log. |
| **I**nformation disclosure | Lộ thông tin nhạy cảm | Lộ token, email, message private | Token trong header/localStorage; không log password; DM chỉ gửi cho recipient. |
| **D**enial of service | Từ chối dịch vụ | Spam socket / API làm nghẽn | Rate limiting (auth, API, chat-message, join-voice); spam window + temp mute. |
| **E**levation of privilege | Leo thang quyền | User thường tự gán admin | RBAC; admin endpoints requireAdmin; room admin từ DB/RoomMember. |

---

## Attack Vectors & Mitigations

### 1. Socket spam (chat / presence / voice)

- **Vector:** Client gửi rất nhiều event `chat-message`, `playerMovement`, `join-voice-channel` trong thời gian ngắn.
- **Impact:** Tốn tài nguyên server, ảnh hưởng người dùng khác, có thể DoS.
- **Mitigation:**
  - Rate limit per user: ví dụ `chat-message` 8 events / 3s; spam window 5 messages / 3s → temp mute 10s.
  - Movement: batch update theo interval (500ms/room), không forward từng event.
  - Voice: rate limit join/leave; max users per channel (20).
- **Ref:** `socketRateHit`, `recordMessageAndCheckSpam`, batch position updates.

### 2. Replay join

- **Vector:** Attacker ghi lại payload `user-join` (userId, username, roomId) và gửi lặp lại nhiều lần hoặc từ nhiều socket.
- **Impact:** Có thể tạo nhiều “session” cho cùng một user trong room, gây rối state.
- **Mitigation:**
  - Server áp dụng “one user = one connection” trong room: khi user-join, server remove mọi socket cũ cùng userId trong room đó, chỉ giữ socket mới.
  - Room capacity: không vượt quá `Room.maxUsers`.
- **Ref:** `roomHandlers.ts` (toRemove same userId).

### 3. Media hijack / abuse

- **Vector:** Gửi stream giả, chiếm băng thông, hoặc lạm dụng SFU (nhiều producer).
- **Impact:** Ảnh hưởng chất lượng voice/video của người khác, tốn server.
- **Mitigation:**
  - SFU (mediasoup) chỉ forward stream từ client đã được server chấp nhận (produce/consume có kiểm tra).
  - Giới hạn số user per voice channel (20); rate limit join.
  - Chưa có: explicit media permission per user (mute-by-admin ở tầng media).
- **Ref:** `webrtc/sfu.ts`, voice channel limits.

### 4. NoSQL injection / XSS

- **Vector:** Gửi body/query chứa object hoặc script (ví dụ `{ $gt: "" }`, `<script>` trong message).
- **Impact:** Bypass auth/query, lộ/chèn dữ liệu, XSS trong chat.
- **Mitigation:**
  - Sanitize body/query (middleware); validate ID là string đơn, không nhận object.
  - Message content: validate length, sanitize (frontend + backend); có thể escape HTML khi render.
- **Ref:** `middleware/security`, validation trong routes, REQUIREMENTS NFR-S1.

### 5. Token theft / session reuse

- **Vector:** Đánh cắp accessToken/refreshToken (XSS, network, device).
- **Impact:** Attacker hành động thay user.
- **Mitigation:**
  - Access token TTL ngắn (15 phút); refresh token lưu server (sessions), có thể revoke.
  - HTTPS; không log token; CORS hạn chế origin.
- **Ref:** Auth routes, Session model, JWT TTL.

---

## Tóm tắt

- **Đã có:** Rate limiting (socket + HTTP), one-connection-per-user-per-room, RBAC, sanitization, HTTPS, token TTL.
- **Có thể bổ sung:** Audit log cho hành động nhạy cảm, media mute-by-admin, CAPTCHA cho đăng ký/đăng nhập (đã có hook reCAPTCHA trong code).

Tài liệu này đủ cho mức “threat awareness” trong capstone; không cần triển khai hết mọi mitigation nâng cao.

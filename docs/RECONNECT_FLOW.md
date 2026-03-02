# Reconnect & Fault Tolerance – Demo và Luồng

Tài liệu mô tả ngắn cách hệ thống xử lý reconnect và cách demo cho hội đồng.

---

## 1. Các kịch bản cần demo

| Kịch bản | Mong đợi | Cách kiểm tra nhanh |
|----------|----------|----------------------|
| **Refresh browser** | User join lại với cùng userId; state room (members, map) đồng bộ; không duplicate message. | Refresh trang app → vẫn trong cùng room, danh sách user ổn, chat history load lại từ server. |
| **Tắt wifi 5s → bật lại** | Socket reconnect; presence (online/offline) cập nhật sau vài giây; media (voice/video) reconnect qua SFU. | Tắt wifi ~5s, bật lại → thấy “reconnecting” rồi “online”; vào lại voice channel nếu bị mất. |
| **Đóng tab rồi mở lại** | Coi như disconnect rồi join lại; server remove socket cũ (reconnect count tăng), một session mới. | Mở 2 tab cùng user → chỉ 1 session được giữ (one user = one connection per room). |

---

## 2. Luồng reconnect (high-level)

```
[Client]                    [Server]
   |                           |
   |  disconnect (refresh/      |
   |  wifi off/ close tab)     |
   |-------------------------->|  (socket disconnect)
   |                           |  pendingOfflineTimers (debounce 5s)
   |                           |  → user-left broadcast (sau debounce)
   |                           |
   |  connect (mới)            |
   |-------------------------->|
   |  user-join { userId,       |
   |    username, roomId }     |
   |-------------------------->|
   |                           |  Remove socket cũ cùng userId trong room
   |                           |  (incrementReconnectCount)
   |                           |  Upsert RoomMember, broadcast room-users, room-info
   |<--------------------------|  room-info, room-users, allPlayersPositions
   |                           |
   |  State đồng bộ (map,      |
   |  members từ server)       |
```

- **Debounce offline:** Server không emit `user-left` ngay khi disconnect mà chờ ~5s để tránh “flicker” (mất mạng tạm thời).
- **One connection per user per room:** Khi `user-join` với userId đã tồn tại trong room, server xóa socket cũ và gắn socket mới → không có 2 tab cùng user trong cùng room.

---

## 3. Media (voice/video) reconnect

- SFU (mediasoup): mỗi lần join voice channel, client gọi `sfu:join` → lấy `rtpCapabilities`, tạo transport, produce/consume.
- Sau khi socket reconnect, nếu user vẫn “trong” voice channel (state phía client có thể cần re-join), client gọi lại `join-voice-channel` + `sfu:joinRoom` + `sfu:join` để lấy lại stream.
- Khuyến nghị demo: vào voice channel → tắt wifi 5s → bật lại → vào lại channel (hoặc UI tự re-join) → nghe/thấy lại.

---

## 4. Metrics liên quan

- **Reconnect count** (trong Admin → Realtime Metrics): tăng mỗi khi có user join lại mà server phải remove socket cũ cùng userId trong room. Dùng làm evidence “reconnect được xử lý” và số lần xảy ra.

---

## 5. Checklist demo cho hội đồng

- [ ] Refresh browser khi đang trong room → kiểm tra vẫn trong room, danh sách user và chat ổn.
- [ ] Tắt wifi 5s rồi bật lại → kiểm tra socket reconnect, presence và (nếu có) voice re-join.
- [ ] Mở Admin → Realtime Metrics → xem Reconnects tăng sau các thao tác trên (nếu có).

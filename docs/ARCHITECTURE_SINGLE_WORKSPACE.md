# Kiến trúc đề xuất: Single Workspace

Tài liệu mô tả mô hình **Single Workspace** và flow người dùng chuẩn cho app virtual coworking.

---

## 1. Mô hình Single Workspace

**Ý tưởng:** Trang chủ = Workspace. Không tách riêng "trang vào phòng", "trang game", "trang chat".

- **Một layout duy nhất:**
  ```
  ------------------------------------------------
  Sidebar   |  Game canvas (giữa)  |  Chat panel (phải)
  ------------------------------------------------
  ```
- Vào trang chủ = vào phòng (sau khi có room).
- Chat hiển thị bên phải, toggle được bằng nút.
- Game ở giữa.
- **Không chuyển route** khi chuyển giữa game và chat — cùng một page.

Tham chiếu: Gather, Discord stage, Slack huddle.

---

## 2. Flow người dùng chuẩn

**Mục tiêu:** User A vào lần đầu làm xong trong vài giây, không bị đứt đoạn.

```
Login
  → Auto vào workspace (hoặc tạo phòng nhanh nếu chưa có)
  → Popup setup camera/mic
  → Hiện game canvas + chat panel bên phải
  → Done.
```

- **Không:** Trang chủ → Trang "Vào phòng" → Setup → Trang game → Trang chat.
- **Có:** Trang chủ = workspace; "Vào phòng ngay" = auto create room (nếu cần) → modal setup → nội dung workspace (game + chat) ngay trên cùng một trang.

---

## 3. Điều chỉnh routing / trang

| Hiện tại | Đề xuất |
|----------|---------|
| Trang vào phòng riêng | Bỏ; thay bằng modal setup khi "Vào phòng ngay" |
| `/app` = game, `/app/chat` = chat | Gộp: game + chat cùng một page; chat là panel bên phải, toggle bằng nút |
| Nhiều bước: Chủ → Vào phòng → Setup → Game | Một luồng: Chủ (workspace) → modal setup → game + chat |

---

## 4. Navigation nhất quán

- **Một hệ thống duy nhất:** Sidebar bên trái.
- Không dùng: nút "back", breadcrumb (trừ khi thật sự cần), hai kiểu nav trong cùng layout.
- Sidebar điều khiển nội dung hiển thị trong main area; cùng URL khi embed (dashboard).

---

## 5. Tên gọi thống nhất

Chỉ dùng **một** trong hai:

- **Room** — hoặc
- **Workspace**

Không lẫn lộn: Room, Space, Workspace, Virtual Office. Trong code/UI đã ưu tiên "phòng" (Room) cho user-facing text.

---

## 6. Trang chủ = Dashboard thực tế

- Giảm hero (khoảng 50%); không làm landing marketing.
- Nội dung thực tế: Start Session, Phòng đang mở, Bạn bè đang online (placeholder nếu chưa có API).

---

## 7. Cấu trúc trang tối giản (đích đến)

1. **Workspace (main)** — Trang chủ = workspace: game + chat một page.
2. **Library** — Thư viện tài nguyên.
3. **Events** — Sự kiện.
4. **Admin** — Theo role.
5. **Settings** — Account + Workspace (ẩn mục chưa làm).

Xóa hoặc gộp: trang "Vào phòng" riêng, trang chat riêng, hero lặp lại.

---

## 8. Tư duy: Flow-first

- **Feature-first:** Build đủ tính năng → nhiều route, nhiều bước.
- **Flow-first:** Thiết kế "User A vào lần đầu làm gì trong 10 giây?" → rút gọn bước, một workspace, một luồng.

Áp dụng: Mọi thay đổi route/UI nên kiểm tra lại flow từ Login → vào phòng → làm việc/chat trong một trang.

---

## 9. Refactor theo Technical Brief (Virtual Co-Working MVP)

**Checklist đầy đủ:** xem `docs/TECHNICAL_BRIEF_CHECKLIST.md`.

### Đã làm

- **Module `features/workspace/`**
  - `WorkspacePage.tsx` — Layout: Game canvas + Chat panel (dùng `RoomChatProvider`).
  - `WorkspaceChatPanel.tsx` — RoomHeader, Messages, Input, ParticipantList, Voice, modal Quản lý phòng (`RoomManagementModal`).
- **`RoomChatContext`** — Chat cấp phòng; không DM, không đa kênh.
- **`AppPage`** — Workspace dùng `WorkspacePage`; không ServerList/ChannelList ở màn chính.
- **Events** — EventCalendar, EventCard, MyBookings, RSVP, booking API; email confirmation + script reminder (1h trước).
- **Forum** — `features/forum/`, backend Thread/Post, topic + threaded replies, moderation (delete author/admin).
- **Library** — Resource model (guide/ebook/course/…), API; UI có trang Library.

### Chưa / một phần (theo brief)

- **Events:** capacity 20–100 rõ ràng trên event; breakout rooms trong event (Zoom hoặc custom) chưa có.
- **Library:** pagination, filter theo type, search rõ ràng trên UI.
- **Service directory:** chưa làm (chờ client duyệt).

# Kế hoạch tổ chức & tối ưu source code (Gather)

**Mục tiêu:** Tổ chức lại và tối ưu code, giữ nguyên project hoạt động bình thường.  
**Lưu ý:** Chỉ thực hiện khi bạn yêu cầu; không tự ý commit/push lên GitHub.

---

## 1. Chuẩn hóa cấu hình & hằng số

### 1.1 Base URL / API (Frontend)
- **Hiện trạng:** `VITE_SERVER_URL || "http://localhost:5001"` lặp lại ở nhiều file (SocketContext, auth forms, authFetch, storage, analytics, GeneralSettings, v.v.).
- **Đề xuất:** Dùng một nguồn duy nhất.
  - Tạo `src/config/env.ts` (hoặc mở rộng `src/utils/authFetch.ts` / `src/portal/shared/storage.ts`) export `getServerUrl()`.
  - Các file gọi API/socket thay vì `import.meta.env.VITE_SERVER_URL || "http://localhost:5001"` thì import và dùng `getServerUrl()`.
- **Rủi ro:** Thấp. Chỉ thay chuỗi bằng hàm, hành vi giữ nguyên.

### 1.2 Backend env
- **Hiện trạng:** Có `backend/.env` và `backend/env.example.txt` (và có thể `.env` ở root).
- **Đề xuất:** Một file mẫu chuẩn: `backend/env.example` (hoặc `env.example.txt`) liệt kê đủ biến (PORT, MONGODB_URI, JWT, EMAIL, CORS, WEBRTC, v.v.), kèm comment ngắn. Đảm bảo `server.ts` chỉ load `.env` từ thư mục backend (đã làm đúng).

---

## 2. Dọn code không dùng / trùng lặp

### 2.1 Entry point & luồng app
- **`src/GameApp.tsx`:** Có vẻ là luồng “clone” cũ (join room đơn giản, không qua Lobby/auth). Hiện router dùng `App` → `LegacyAuthFlow` / `Lobby` → `pages/App.tsx` (AppPage), không dùng `GameApp`.
  - **Đề xuất:** Nếu không còn dùng, có thể xóa `GameApp.tsx` và `components/GameScene.tsx` (wrapper cũ dùng bởi GameApp). Trước khi xóa: grep toàn project xem còn import `GameApp` hoặc `components/GameScene` không; nếu không thì an toàn.
- **`src/components/GameScene.tsx` vs `src/components/game/GameScene.tsx`:**
  - `game/GameScene.tsx`: scene Phaser chính, được dùng bởi `pages/App.tsx` (lazy import).
  - `components/GameScene.tsx`: wrapper dùng bởi `GameApp` (và import từ `./game`). Nếu bỏ GameApp thì có thể bỏ luôn wrapper này và giữ mỗi `game/GameScene.tsx`.

### 2.2 Trang / component có thể legacy
- **`src/pages/Login.tsx`, `Register.tsx`, `Homepage.tsx`:** Router hiện tại: `/login` → redirect `/`, `/` → `LegacyAuthFlow`. Các trang Login/Register/Homepage có thể không còn trong luồng chính.
  - **Đề xuất:** Kiểm tra route và link trong app. Nếu không còn route hoặc link tới các trang này, có thể đánh dấu deprecated hoặc xóa để tránh nhầm lẫn. Nếu vẫn giữ thì ghi chú rõ “legacy / backup”.
- **`src/VerifyCode.tsx`:** Không thấy trong `App.tsx` (router). Luồng OTP đang dùng `RegisterVerify` trong LegacyAuthFlow.
  - **Đề xuất:** Nếu không còn chỗ nào import `VerifyCode`, có thể xóa hoặc chuyển vào folder `features/auth` và đặt tên rõ (ví dụ `StandaloneVerifyCode.tsx`) nếu muốn giữ để tái sử dụng sau.

### 2.3 Console.log & debug (Frontend)
- **`src/main.tsx`:** Có nhiều `console.log` (Main.tsx: Starting execution, Imports done, Root element found, …) và một dòng log trùng.
  - **Đề xuất:** Xóa hoặc gói trong `if (import.meta.env.DEV)` để chỉ chạy khi dev, giảm rác log trên production.

---

## 3. Cấu trúc thư mục & tên file

### 3.1 Frontend
- **Router (App):** Có hai “App”: `src/App.tsx` (định nghĩa route) và `src/pages/App.tsx` (trang trong app – game/sidebar/chat). Dễ nhầm.
  - **Đề xuất:** Đổi tên một trong hai cho rõ. Ví dụ: giữ `App.tsx` là root router; đổi `pages/App.tsx` thành `pages/AppPage.tsx` hoặc `pages/InAppLayout.tsx` và cập nhật import trong `App.tsx`. Hoặc đổi `App.tsx` thành `Routes.tsx` / `AppRouter.tsx` và trong `main.tsx` import default từ đó. Chỉ cần một lần đổi tên + cập nhật import.
- **Components:** Đang có mix: một số component ở root `components/` (Header, Sidebar, ControlBar), một số trong `chat/`, `game/`, `modals/`, `ui/`. Cấu trúc này ổn.
  - **Đề xuất (tùy chọn):** Nếu muốn thống nhất, có thể nhóm thêm: ví dụ `components/layout/` cho Header, Sidebar, ControlBar. Không bắt buộc; chỉ nên làm nếu team muốn quy ước rõ “layout vs feature”.

### 3.2 Backend
- **`server.ts`:** File rất dài (1100+ dòng): Express setup, CORS, socket handlers (user-join, room, voice, movement, SFU, …).
  - **Đề xuất:** Tách từng nhóm handler ra file riêng, ví dụ:
    - `socket/handlers/roomHandlers.ts` (user-join, room-users, …)
    - `socket/handlers/voiceHandlers.ts` (join-voice-channel, leave-voice-channel)
    - `socket/handlers/movementHandlers.ts` (playerMovement, batch update)
    - `server.ts` chỉ: load env, tạo app, mount routes, tạo io, gọi các hàm đăng ký handler (registerRoomHandlers(io), registerVoiceHandlers(io), …).
  - **Rủi ro:** Trung bình. Cần đảm bảo thứ tự đăng ký và shared state (connectedUsers, roomUsers, …) được truyền đúng (ref hoặc đối tượng dùng chung).

---

## 4. Đồng nhất giao diện (UI) theo trang Welcome

**Mục tiêu:** Các trang hiện dùng nhiều palette khác nhau (tím gradient, xanh teal, xám Discord, …). Làm cho toàn bộ app đồng nhất theo **trang chủ / Welcome** (Dashboard sau đăng nhập): dark blue/teal hero, accent xanh lá, thẻ bo góc, typography sạch.

### 4.1 Chuẩn “trang Welcome” (tham chiếu)
- **Hero / vùng chính:** Nền dark blue/teal (vd. `#1a2a3a`), chữ trắng, câu nhấn mạnh màu xanh lá (vd. `#1abc9c`).
- **Nút CTA chính:** Nền xanh lá, chữ trắng, bo góc.
- **Nút phụ:** Nền xám đậm (vd. `#34495e`), chữ trắng.
- **Thẻ nội dung:** Nền trắng hoặc xám rất nhạt, bo góc, có shadow nhẹ.
- **Toàn trang:** Nền tổng thể sáng (off-white / xám rất nhạt) hoặc dark thống nhất; tránh mỗi trang một màu nền khác nhau.
- **Typography:** Sans-serif, tiêu đề đậm, body regular, khoảng cách thống nhất.

### 4.2 Các trang cần chỉnh cho đồng bộ
| Trang | Hiện trạng | Hướng chỉnh |
|-------|------------|-------------|
| **Dashboard (Welcome)** | Đã đúng – dùng làm chuẩn | Giữ nguyên; ghi lại biến màu/class (hoặc token) dùng chung. |
| **Lobby** (`/lobby`) | Nền tím gradient, thẻ trắng lớn, nút đen | Đổi nền và accent theo theme Welcome (dark blue/teal + xanh lá); nút primary dùng xanh lá, thẻ giữ bo góc. |
| **Virtual Office** (`/app`) | Sidebar tím đậm, map pixel art | Sidebar dùng cùng dark blue/teal + xanh lá (active/hover) như Welcome; không đổi style map game. |
| **Chat** (`/app/chat`) | Xám Discord (#2f3136, #36393f), accent tím | Chuyển nền/ sidebar sang bảng màu Welcome; accent chính là xanh lá thay vì tím. |
| **Thư viện** (`/library`) | Nền #1A202C, accent teal #2DD4BF | Thống nhất teal với Welcome (hoặc dùng đúng xanh lá #1abc9c); nền dark thống nhất với Dashboard. |
| **Admin** (`/admin`) | Dark blue/purple, nút/active tím | Dùng cùng dark blue/teal + xanh lá cho active và nút; giữ layout, đổi palette. |
| **Quản lý Spaces** (`/app/chat` tab Spaces) | Tím, xanh lá đã có nhưng khác tone | Đồng bộ mã màu với theme chung (xanh lá CTA, dark blue/teal nền). |

### 4.3 Cách làm kỹ thuật
- **Bước 1 – Design token / CSS variables:** Trong `index.css` (hoặc file theme chung) định nghĩa biến cho:
  - `--color-bg-hero` (dark blue/teal),
  - `--color-accent-primary` (xanh lá),
  - `--color-bg-page` (nền trang),
  - `--color-card`, `--color-button-secondary`, `--radius-card`, `--font-heading`, v.v.
- **Bước 2 – Áp dụng lên Dashboard/Welcome:** Đảm bảo trang Welcome dùng đúng các biến này (refactor nếu đang hardcode).
- **Bước 3 – Từng trang khác:** Lần lượt Lobby → Sidebar/App → Chat → Library → Admin → Spaces, thay màu/class hiện tại bằng token (class hoặc Tailwind theme nếu dùng Tailwind). Ưu tiên nền trang, sidebar, nút chính, thẻ.
- **Bước 4 – Dark mode (nếu có):** Nếu app hỗ trợ dark/light, đảm bảo theme Welcome có bản dark và các trang dùng chung token dark/light đó.

### 4.4 File / vùng code cần sửa (gợi ý)
- **Layout / theme chung:** `index.css`, `Tailwind` config (nếu có), `ThemeContext` hoặc nơi đổi theme.
- **Trang Welcome/Dashboard:** `pages/DashboardLayout.tsx`, component thẻ hero/welcome.
- **Lobby:** `pages/Lobby.tsx` (nền, thẻ, nút).
- **Sidebar & app shell:** `components/Sidebar.tsx`, layout chứa Virtual Office.
- **Chat:** `pages/ChatPage.tsx`, `components/chat/*` (ChannelList, ChatArea, …).
- **Library:** `pages/Library.tsx`.
- **Admin:** `portal/admin/*`, `portal/components/AdminSidebar.tsx`.
- **Spaces:** `components/chat/SpacesManager.tsx` (và view Quản lý Spaces).

### 4.5 Rủi ro và lưu ý
- **Rủi ro:** Trung bình. Đổi màu/class có thể ảnh hưởng contrast (a11y) hoặc chỗ responsive. Sau mỗi trang nên kiểm tra nhanh trên vài kích thước màn hình.
- **Giữ nguyên:** Vùng game (pixel art map), cấu trúc layout và luồng; chỉ thống nhất màu sắc, bo góc, typography và component (nút, thẻ) theo Welcome.

---

## 5. Tối ưu hiệu năng (giữ hành vi)

### 5.1 Frontend
- **Lazy load:** `pages/App.tsx` đã lazy load GameScene, Sidebar, ControlBar, VideoChat, Chat, MapLayers, ChatPage, EventsPage, ProfilePage. Giữ nguyên.
- **Bundle:** Kiểm tra xem có dependency nặng nào import “cả cụm” không (ví dụ import toàn bộ thư viện thay vì path con). Có thể rà bằng build và phân tích bundle (vite build --mode production, hoặc plugin phân tích).
- **Context:** Nhiều provider (Socket, WebRTC, Chat, Map, Object, Event, Notification, Theme). Ổn nếu mỗi context chỉ re-render khi value thay đổi. Có thể kiểm tra từng context: value có được memo/useMemo hợp lý không, tránh tạo object/array mới mỗi lần render không cần thiết.

### 5.2 Backend
- **Rate limit:** Đã có; giữ nguyên.
- **SFU (mediasoup):** Đã tách trong `webrtc/sfu.ts`. Giữ nguyên.
- **DB:** Các query trong socket handler (Room, RoomMember, User) có thể kiểm tra index MongoDB (roomId, userId, …) để tránh full collection scan khi room/user nhiều.

---

## 6. Polyfills & shims

- **Hiện trạng:** `src/polyfills/` (module, process, stream, events, …) và `src/shims/` (react-icons, jsx-runtime, react-oauth-google). Trước đây dùng cho simple-peer; giờ chỉ SFU (mediasoup).
  - **Đề xuất:** Rà lại từng file polyfill/shim: file nào không còn được import hoặc không cần cho build chạy nữa thì có thể xóa. Giữ lại những gì Vite/React/mediasoup vẫn cần. Tránh xóa hàng loạt trước khi chạy đủ test (build + vài flow chính).

---

## 7. Thứ tự thực hiện đề xuất

1. **An toàn, ít đụng chạm**
   - Tạo `getServerUrl()` dùng chung và thay thế các chỗ lặp `VITE_SERVER_URL || "http://localhost:5001"`.
   - Dọn console.log trong `main.tsx` (xóa hoặc gói trong DEV).
   - Chuẩn hóa `backend/env.example` (một file mẫu đủ biến).

2. **Đồng nhất UI theo trang Welcome**
   - Định nghĩa design token (CSS variables) từ trang Welcome; áp dụng lần lượt Lobby → Sidebar/Chat → Library → Admin → Spaces (xem **§4**).

3. **Dọn code chết (sau khi kiểm tra kỹ)**
   - Xác nhận không còn import `GameApp`, `VerifyCode`, `Login`, `Register`, `Homepage` (hoặc chỉ dùng trong route không dùng nữa).
   - Nếu đúng: xóa hoặc đánh dấu deprecated (ví dụ comment ở đầu file + không export trong index).

4. **Đặt tên rõ ràng**
   - Đổi tên `pages/App.tsx` → `AppPage.tsx` (hoặc tên khác rõ nghĩa) và cập nhật import trong `App.tsx`.

5. **Tách server (nếu muốn dễ bảo trì)**
   - Tách socket handlers trong `server.ts` ra các file trong `socket/handlers/` (hoặc tương đương), giữ shared state rõ ràng.

6. **Tùy chọn**
   - Rà polyfills/shim và xóa cái không dùng.
   - Rà index DB backend cho các collection hay query theo roomId/userId.

---

## 8. Kiểm tra sau mỗi bước

- `pnpm run build` (frontend) và chạy backend (ví dụ `node backend/server.ts` hoặc script start) không lỗi.
- Test nhanh: vào app → đăng nhập / lobby → vào phòng → voice/call (nếu có) → rời kênh. Đảm bảo không vỡ so với trước khi đổi.

---

**Tóm tắt:** Ưu tiên chuẩn hóa config (server URL, env) và **đồng nhất UI theo trang Welcome** (design token + áp dụng cho Lobby, Chat, Library, Admin, Spaces); tiếp theo dọn code chết, log debug, đặt tên file rõ ràng; sau đó mới cân nhắc tách `server.ts` và dọn polyfills. Mỗi bước nên làm xong, test ổn rồi hãy sang bước tiếp theo; không commit/push lên GitHub trừ khi bạn yêu cầu.

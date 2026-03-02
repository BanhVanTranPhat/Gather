## Frontend structure (React / Vite)

- **Entry**
  - `src/main.tsx` → mount React, wrap `ToastProvider`, `BrowserRouter`.
  - `src/App.tsx` → define all routes:
    - `/` landing, `/auth/*`, `/home` (dashboard), `/settings`, `/app/*` (workspace + game + chat), `/dashboard`, `/admin`.

- **App shell & workspace**
  - `pages/AppPage.tsx`
    - Lấy `username` + `roomId` từ `localStorage` / user profile.
    - Bọc toàn bộ workspace bằng:
      - `SocketProvider` (Socket.IO client)
      - `MapProvider` (Phaser map state)
      - `WebRTCProvider` (voice/video)
      - `ChatProvider`, `ObjectProvider`, `EventProvider`, `NotificationProvider`, `ThemeProvider`.
    - Lazy load:
      - `components/Sidebar` – thanh trái (people, invite, notifications).
      - `features/workspace/WorkspacePage` – game + chat panel.
      - `pages/ChatPage` – full-screen chat.
      - `pages/EventsPage`, `pages/ProfilePage`.

- **Realtime / state contexts**
  - `contexts/SocketContext.tsx`
    - Tạo Socket.IO client (`io(getServerUrl())`).
    - Sự kiện chính:
      - `user-join`, `room-users`, `user-joined`, `user-left`, `reaction`, `kicked-from-room`.
    - Giữ `users`, `currentUser`, `isConnected`.
    - Merge list từ REST (`GET /api/rooms/:roomId/users`) + Socket events.
  - `contexts/WebRTCContext.tsx`
    - Quản lý WebRTC + SFU signalling (join voice, toggle mic/cam, media state).
  - `contexts/ChatContext.tsx`
    - Chat messages, channels, DM/group, reactions, edit/delete.
  - `contexts/MapContext.tsx` / `features/workspace/*`
    - Trạng thái bản đồ, vị trí player, object interactions (whiteboard, TV, desk…).

- **UI chính**
  - `components/Sidebar.tsx`
    - Tabs: **People** / **Chat**.
    - People tab:
      - Lấy `users` từ `SocketContext`.
      - Dùng `UserAvatarDisplay` để hiện avatar (Google URL / preset / chữ cái).
      - Invite card, search, online/offline list.
  - `pages/ChatPage.tsx`
    - Bên trái: danh sách channel, user, voice channel.
    - Giữa: `ChatArea` (messages, input, reactions).
    - Bên phải (nếu embed): `UserList` – danh sách online/offline trong room.
  - `components/game/*`
    - `GameScene.tsx` – Phaser 3 scene (map, player, NPC, objects).
    - `AssetLoader.ts` – load tileset, characters, objects, `map_layered.json`.

- **Auth / Profile**
  - `features/auth/AuthPage.tsx` – email + OTP + Google login.
  - `features/auth/SetNamePage.tsx` – đặt `displayName`.
  - `features/auth/AvatarSelection.tsx` – chọn avatar preset, lưu `avatarConfig` + `displayName`.
  - `pages/DashboardLayout.tsx` – trang `/home` (portal nhỏ: spaces, events, library).

- **Portal & Admin**
  - `portal/dashboard/PortalDashboard.tsx`
    - Dashboard đơn giản điều hướng: Rooms (forum), Lobby (app).
  - `portal/admin/AdminDashboard.tsx`
    - `/admin` – RequireAdmin.
    - Tabs: Overview (analytics + realtime metrics), Rooms, Users, Library.
    - Gọi:
      - `/api/admin/metrics` → `onlineUsers`, `activeRooms`, `activeVoiceChannels`, `reconnectCount`.
      - `/api/analytics/summary` → event stats.

---

## Backend structure (Express / Socket.IO / SFU)

- **Entry**
  - `backend/server.ts`
    - Load `.env`, connect MongoDB.
    - Khởi tạo `express`, `httpServer`, `Socket.IO`.
    - Middleware: `cors`, `sanitizeBody`, `sanitizeQuery`, `apiRateLimiter`, `requestLogger`, `errorHandler`.
    - REST routes:
      - `/api/auth`, `/api/users`, `/api/spaces`, `/api/world`, `/api/chat`, `/api/uploads`,
        `/api/resources`, `/api/notifications`, `/api/search`, `/api/forum`, `/api/admin`, `/api/analytics`.
    - Socket state:
      - `connectedUsers: Map<socketId, ConnectedUser>`
      - `roomUsers: Map<roomId, Set<socketId>>`
      - `voiceChannels: Map<channelId, Set<userId>>`
    - Đăng ký handlers:
      - `registerRoomHandlers`, `registerMovementHandlers`, `registerVoiceHandlers`, `registerChatHandlers`, `registerSFUHandlers`.
    - Metrics:
      - Gọi `setRealtimeState` cho `metricsStore` → `/api/admin/metrics`.

- **Socket handlers**
  - `socket/handlers/roomHandlers.ts`
    - Sự kiện `user-join`, `reaction`, kick user, transfer admin, disconnect debounce.
    - Get-or-create room race-safe (`findOneAndUpdate` + `$setOnInsert`).
    - Duy trì:
      - `roomUsers` (map room → socket set)
      - `RoomMember` trong Mongo (online/offline, role).
  - `socket/handlers/movementHandlers.ts`
    - `playerMovement`, batch vị trí qua `createBatchUpdater`.
  - `socket/handlers/voiceHandlers.ts`
    - Join/leave voice channel (logic channel membership, max users, rate limit).
  - `webrtc/sfu.ts`
    - Mediasoup SFU: create router, transports, producers/consumers.
    - Socket events: `sfu:join`, `sfu:createTransport`, `sfu:produce`, `sfu:consume`, `sfu:mediaState`, …

- **Chat controller**
  - `controllers/chatController.ts`
    - Socket event `chat-message`:
      - Rate limiting, spam window, temp mute.
      - Types: `global`, `nearby`, `dm`, `group`.
      - Persist `Message` với `messageId` ổn định.
      - Broadcast tới đúng recipients (nearby, group, dm).
    - Socket events: reactions, edit/delete message.

- **Admin & Analytics**
  - `routes/adminRoutes.ts`
    - `/api/admin/rooms`, `/api/admin/users`, `/api/admin/resources` (RBAC: `requireAdmin`).
    - `/api/admin/metrics` → lấy snapshot từ `services/metricsStore`.
  - `routes/analyticsRoutes.ts` + `models/Analytics.ts`
    - `/api/analytics/track` – ghi event.
    - `/api/analytics/summary` – thống kê theo type, unique users/sessions, top events.

- **Services & utils**
  - `services/metricsStore.ts`
    - In-memory metrics: `onlineUsers`, `activeRooms`, `activeVoiceChannels`, `reconnectCount`.
  - `utils/logger.ts`
    - Logger trung tâm (INFO/WARN/ERROR/DEBUG) cho HTTP + DB + Socket.

---

## Testing & Evidence

- **Load test**
  - `backend/scripts/loadTest.ts`
    - Spawn N Socket.IO clients → join room → gửi chat → đo latency (min/max/avg/p95/p99).
    - Output `LOAD_TEST_RESULT.csv`.
  - Doc: `docs/LOAD_TEST.md`.

- **Threat model & reconnect**
  - `docs/THREAT_MODEL.md` – STRIDE + attack vectors (socket spam, replay join, media abuse, NoSQL/XSS, token).
  - `docs/RECONNECT_FLOW.md` – luồng reconnect + checklist demo.


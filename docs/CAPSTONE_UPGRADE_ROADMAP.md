# Capstone Upgrade Roadmap – Engineering Depth & Điểm số

> Mục tiêu: nâng từ **8–8.5** lên **9–9.5** kỹ thuật qua **Technical Depth**, **System Thinking**, **Measurable Evidence** — không thêm feature lặt vặt.

---

## 🥇 Nhóm 1 – Technical Depth (đắt điểm nhất)

### 1️⃣ Monitoring & Observability
- [ ] **Structured logging** (winston / pino) – backend (hiện dùng `utils/logger.ts`)
- [x] **Error boundary** frontend (đã có + analytics.trackError)
- [x] **Basic metrics**:
  - `onlineUsers`, `activeRooms`, `activeVoiceChannels`, `reconnectCount`
  - (avgMessageLatencyMs có thể thêm sau)
- [x] **Admin dashboard** hiển thị metrics (widget Realtime Metrics, refresh 10s)

**Evidence:** Hội đồng thấy hệ thống production-grade.

---

### 2️⃣ Load Simulation (chứng minh scalability)
- [x] Script spawn **10–20 socket clients** (Node.js script) — `backend/scripts/loadTest.ts`
- [x] Join room, gửi message (type global)
- [x] Đo **latency** (send → nhận broadcast)
- [x] Ghi lại kết quả (số user, avg/p95/p99, errors) vào `LOAD_TEST_RESULT.csv`

**Evidence:** Không chỉ nói "≥20 users" mà có số liệu. Chạy: `cd backend && npm run load-test` (cần server đang chạy).

---

### 3️⃣ Reconnect & Fault Tolerance Demo
- [ ] **Refresh browser** → state consistent, không duplicate message (demo thủ công)
- [ ] **Tắt wifi 5s → bật lại** → presence + media reconnect ổn (demo thủ công)
- [x] Document **reconnect flow** — `docs/RECONNECT_FLOW.md` (luồng + checklist demo)
- [ ] (Optional) Clip ngắn demo cho hội đồng

**Evidence:** Robustness > feature pile.

---

## 🥈 Nhóm 2 – Architectural Maturity

### 4️⃣ Signaling Layer – Document rõ
- [ ] **Signaling contract** (event names, payload schema)
- [ ] **Event naming convention** (ví dụ: `sfu:join`, `chat-message`)
- [ ] **State machine** cho WebRTC transport lifecycle (diagram)
- [ ] Cập nhật `REQUIREMENTS.md` hoặc tạo `docs/SIGNALING.md`

**Evidence:** Hiểu hệ thống, không chỉ dùng thư viện.

---

### 5️⃣ State Management (nếu có thời gian)
- [ ] Chuẩn hóa **room state model** (single source of truth)
- [ ] **Typed event schema** / event bus
- [ ] Giảm context rời rạc, tránh race

**Evidence:** Kiến trúc rõ ràng.

---

## 🥉 Nhóm 3 – Feature polish (vừa đủ)

### 6️⃣ Screen Sharing
- [ ] mediasoup produce **screen track**
- [ ] UI: pin/hiển thị screen stream (không cần full control)

### 7️⃣ Role-based Permission nâng cao
- [ ] Admin **mute user**, **kick user**
- [ ] **Lock room**, **promote member**
- [ ] Document trong SRS/REQUIREMENTS

### 8️⃣ Persistent Media State
- [ ] User join lại → **giữ trạng thái mute/cam** trước đó (sync từ server/store)

---

## 🧠 Nhóm 4 – Academic Boost

### 9️⃣ So sánh kiến trúc (Discord / Gather)
- [ ] Bảng high-level:

| Feature | Our system | Discord | Gather |
| ------- | ---------- | ------- | ------ |
| Signaling | Socket.IO | ... | ... |
| Media | mediasoup SFU | ... | ... |
| ... | ... | ... | ... |

- [ ] Lưu trong `docs/` (ví dụ `docs/COMPARATIVE_ARCHITECTURE.md`)

### 🔟 Threat Modeling
- [x] **STRIDE** (subset) + attack vectors: socket spam, replay join, media abuse, NoSQL/XSS, token
- [x] Mitigations đã có (rate limit, one-connection-per-user, RBAC, sanitize)
- [x] Doc: `docs/THREAT_MODEL.md`

---

## 💎 Optional – Điểm tối đa

### OPTION A – Horizontal Scalability (design only)
- [ ] Diagram: **Redis adapter** cho Socket.IO (multi server)
- [ ] **Multiple SFU workers** + load balancer
- [ ] Không cần implement, chỉ design/doc

### OPTION B – Record Demo Session
- [ ] Record voice channel (server-side hoặc client-side)
- [ ] Hoặc đơn giản: record local stream

---

## ❌ Không nên làm (ít tăng điểm)
- Mobile app, 3D, VR
- Thêm nhiều feature chat lặt vặt
- Over-design UI

---

## 🎯 Ưu tiên đề xuất (theo góc nhìn chấm)

1. **Load simulation** – evidence scalability
2. **Reconnect robustness** – demo + document
3. **Monitoring dashboard** – metrics trong admin
4. **Architecture scalability** – diagram + discussion (OPTION A)

Sau đó: Threat modeling, Comparative table, Signaling doc.

---

## Thang điểm tham khảo

| Mức | Điểm kỹ thuật | Điều kiện |
| --- | -------------- | --------- |
| Hiện tại | 8 – 8.5 | Realtime + SFU + Phaser ổn |
| + Monitoring, Load test, Reconnect, Threat model | 9 – 9.5 | Evidence + security thinking |
| + Horizontal scalability analysis | 9.5+ | Senior-level system thinking |

---

*File này dùng làm checklist; cập nhật checkbox khi hoàn thành từng mục.*

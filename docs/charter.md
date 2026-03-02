1️⃣ Project Overview
Project Title
**Virtual Space Web Application (Gather-like Virtual Office Platform)**

Project Context & Motivation
Modern collaboration increasingly takes place in remote environments. However, conventional video-conferencing tools lack spatial presence and offer limited support for informal interaction (e.g., hallway conversations, ad-hoc small group discussions).
This capstone project addresses these limitations by implementing a web-based virtual collaboration space, where users are represented as avatars navigating a shared 2D environment. Communication is influenced by proximity (nearby chat) and supported by structured channels and scalable voice/video conferencing.
From a software engineering perspective, the project integrates several advanced domains:
Real-time systems: Socket.IO–based presence tracking, chat events, and state synchronization


2D runtime rendering: Phaser 3 for map rendering, avatar movement, and entity management


Scalable WebRTC: Migration from peer-to-peer mesh to SFU architecture using mediasoup (≥20 participants)


Security & reliability: JWT-based authentication, rate limiting, input sanitization, and upload constraints



High-Level Product Vision
The goal is to deliver a demo-ready, professional-grade web application that demonstrates:
A polished, consistent UI (Tailwind CSS v4, dark theme)


A real-time virtual room with avatar-based spatial interaction


Integrated text, voice, and video communication comparable to Gather or Discord



System Context Diagram


Note: Socket.IO serves as the primary signaling backbone. SFU logic is implemented using mediasoup handlers coordinated through backend socket events.

2️⃣ Purpose & Objectives
Core Purpose
To design and build a web-based virtual collaboration environment that supports:
Spatial presence


Context-aware interaction


Real-time communication (chat + voice/video)


This approach enables more engaging and natural collaboration than traditional video-call-only solutions.


Specific Objectives (Aligned with the Implemented Codebase)
ID
Objective
Description
Evidence in Repository
OBJ-01
Authentication & sessions
User onboarding and session persistence
backend/routes/auth.ts, models/User.ts, models/Session.ts
OBJ-02
Room entry & invite
Join rooms and share invite links
/api/rooms/:roomId/invite, InviteModal.tsx
OBJ-03
Spatial presence
Avatar movement in shared 2D map
GameScene.tsx, phaser
OBJ-04
Real-time presence
Online/offline tracking and room member sync
SocketContext.tsx, RoomMember.ts
OBJ-05
Multi-mode chat
Global, nearby, DM/group chat with history
chatController.ts, NearbyChatPanel.tsx
OBJ-06
Scalable voice/video
SFU-based WebRTC (≥20 users)
webrtc/sfu.ts, WebRTCContext.tsx
OBJ-07
Media state sync
Mic/cam states and speaking indicators
VoiceChannelView.tsx
OBJ-08
Reliability & anti-abuse
Rate limiting, spam control
rateLimiter.ts, rules.md
OBJ-09
Notifications & search
Notification feed and search APIs
notificationRoutes.ts, searchRoutes.ts
OBJ-10
File uploads
Uploads with size/type constraints
uploadRoutes.ts, upload.ts
OBJ-11
Analytics (basic)
Event/page tracking for demo evaluation
Analytics.ts, analytics.ts



3️⃣ Scope
In-Scope Features
Area
Included Features
Notes
Frontend
React SPA, Tailwind v4 dark theme, modals, chat layout
src/
Backend
Express APIs, MongoDB, security middleware
backend/
Real-time layer
Socket.IO for presence & chat
FE ↔ BE
Virtual room
Phaser-based 2D map & avatars
components/game/*
Text chat
Global, nearby, DM, reactions, history
Persistent
Voice/video
mediasoup SFU
≥20 participants
Admin logic
Basic roles (admin/member)
Ensure ≥1 admin
Invites
Shareable room invite URLs
Implemented
Notifications
UI + APIs
Implemented
Uploads
File uploads with constraints
Implemented


Out-of-Scope Features
Excluded Item
Rationale
Native mobile apps
Web SPA only
VR/AR or 3D world
High complexity, out of scope
MMO-scale rooms
Requires distributed SFU & sharding
Enterprise compliance
Beyond capstone requirements
Full CI/CD & cloud infra
Local demo focus
Automated load testing
Manual testing only



4️⃣ Deliverables
Category
Deliverable
Description
Source Code
Frontend
React/Vite/Tailwind
Source Code
Backend
Express/MongoDB/Socket.IO
Source Code
SFU Module
mediasoup implementation
Database
Schemas
User, Room, Message, Analytics, etc.
Documentation
System rules
rules.md
Documentation
Technical docs
docs/
Academic
SRS
Requirements specification
Academic
SDS / Architecture
Design & rationale
Academic
User guide
Usage workflows
Demo
Local demo package
.env, run scripts


5️⃣ Stakeholders & Nhân sự
Stakeholder
Vai trò
Trách nhiệm / Success Criteria
Giảng viên hướng dẫn (Mentor)
Guidance & review
Architectural correctness, phản biện kỹ thuật
Project Manager (PM)
Điều phối, theo dõi tiến độ
Sprint planning, risk tracking, báo cáo
Capstone Team (Development Team)
Implementation
Stability & completeness; Frontend, Backend, Realtime
Khách hàng / Product Owner
Đại diện yêu cầu (nếu có)
Acceptance criteria, ưu tiên backlog
End Users
Demo users
Usability & reliability
Evaluation Committee
Assessment
Technical depth & innovation
Maintainer (future)
Maintenance
Code clarity & documentation

**Tài nguyên hỗ trợ:** Server local, MongoDB, môi trường dev (Node.js, Vite). Có thể cần TURN server cho WebRTC demo.


6️⃣ Hướng tiếp cận & Phương pháp phát triển
Phương pháp: **Agile / Scrum**

| Hạng mục | Mô tả |
| -------- | ----- |
| Sprint | 2 tuần / sprint |
| Sprint Planning | Đầu mỗi sprint: chọn user stories từ backlog, ước lượng, commit scope |
| Daily Scrum | Standup ngắn (15 phút): đã làm gì, sẽ làm gì, blockers |
| Sprint Review | Cuối sprint: demo increment, thu thập feedback |
| Sprint Retrospective | Cải thiện quy trình, điều chỉnh Definition of Done |
| Backlog | GitHub Projects / Kanban; ưu tiên theo MoSCoW |
| Definition of Done | Feature hoàn thành + test + docs cập nhật |


7️⃣ Assumptions, Constraints & Success Criteria
Assumptions
Users have modern browsers supporting WebRTC and Canvas


Local demo environment is available


Small-group, single-region sessions


Stable network during demo


Constraints
Real-time synchronization complexity


NAT traversal for WebRTC


Limited capstone timeline


Baseline (not enterprise-grade) security


Success Criteria
Metric
Target
Functional completeness
Join, move, chat, voice/video
Voice scalability
≥20 users per channel
Consistency
No message duplication
UX readiness
Polished dark-theme UI
Demo stability
Predictable local runtime



8️⃣ Key Risks & Mitigations
Risk
Impact
Mitigation
WebRTC connectivity
High
Local demo assumptions, TURN docs
Event race conditions
High
Server-authoritative state
Message duplication
Medium
ID-based deduplication
Spam/abuse
Medium
Rate limiting & constraints
UI inconsistency
Medium
Shared design tokens
Demo-day failure
High
Checklists & fallback plans


9️⃣ Governance & Communication Plan
Topic
Plan
Meetings
Weekly planning + mid-week sync
Definition of Done
Feature + test + docs
Decision log
Stored in docs/
Issue tracking
GitHub Projects / Kanban
Reviews
PR review by ≥1 member


🔟 Lịch trình sơ bộ (High-Level Timeline)
| Giai đoạn | Mô tả | Cột mốc |
| --------- | ----- | ------- |
| Phase 1 – Foundation | Setup project, auth, room entry, map cơ bản | Sprint 1–2 |
| Phase 2 – Core Features | Presence, chat, voice/video (P2P → SFU) | Sprint 3–5 |
| Phase 3 – Polish & Extras | Events, notifications, uploads, admin, UI polish | Sprint 6–7 |
| Phase 4 – Demo Ready | Testing, docs, demo package, fallback plans | Sprint 8 |

*Lưu ý: Thời gian cụ thể điều chỉnh theo lịch capstone và năng lực team.*


1️⃣1️⃣ Summary
This Project Charter defines the scope, objectives, and governance of a demo-ready virtual collaboration platform built on:
React + Vite + Tailwind,
 Express + MongoDB,
 Socket.IO, and
 mediasoup SFU for scalable WebRTC.
The project prioritizes stability, usability, and demonstrable technical depth, making it suitable for both academic evaluation and real-world inspiration.

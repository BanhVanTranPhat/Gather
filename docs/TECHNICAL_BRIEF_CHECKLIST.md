# Technical Brief Checklist – The Gathering MVP

Mapping of the **Technical Brief: Virtual Co-Working Space** to the current codebase. Use this for gap analysis and beta readiness.

---

## 1. Website / User Interface & Management

| Requirement | Status | Implementation |
|-------------|--------|-----------------|
| Clean, intuitive UI for all platform features | ✅ Done | Dashboard, workspace (Sidebar \| Game \| Chat), design tokens (gather-accent, etc.) |
| Sign-up page | ✅ Done | `src/pages/Register.tsx`, `backend/routes/auth.ts` (POST /register) |
| Log-in page | ✅ Done | `src/pages/Login.tsx`, `LegacyAuthFlow.tsx`, `backend/routes/auth.ts` (POST /login) |
| Secure user creation and authentication | ✅ Done | JWT, `backend/middleware/security.ts` (authenticate), password hashing |
| User verification (e.g. email confirmation) | ✅ Done | OTP flow: `VerifyCode.tsx`, `RegisterVerify.tsx`, `backend/models/OtpCode.ts`, auth verify-otp / forgot-password |
| User profile management (edit profile, settings, credentials) | ✅ Done | Profile modals, Settings (Account + Workspace), `src/features/profile/`, user/me API |
| Dashboard with quick access to events, resources, forum | ✅ Done | `DashboardLayout.tsx`: tabs/views Events, Thư viện (Library), Diễn đàn (Forum), Overview cards |

**Gaps:** None for this section. Optional: design system doc, consistent typography/colour tokens across all pages.

---

## 2. Events Booking & Management

| Requirement | Status | Implementation |
|-------------|--------|-----------------|
| Booking calendar (view and book events) | ✅ Done | `EventCalendar`, `EventCard`, `EventsPage` (tabs: Tất cả / Đăng ký của tôi), RSVP API |
| Automated email confirmations on booking | ✅ Done | `eventController.ts`: on RSVP "going" → `sendEventConfirmation()`; `backend/utils/email.ts` |
| Automated email reminders | ✅ Done | `backend/scripts/eventReminder.ts` (events in next 1h), `sendEventReminder()`, npm script `reminder` |
| Event hosting platform (min 20 participants, scalable to 100) | ✅ Done | Backend: `eventController` clamps `maxParticipants` to 20–100 on create/update. EventModal: field “Số chỗ (20–100)”. EventCard: shows “X / maxP tham gia”. |
| “Room” / breakout groups within events | ❌ Not done | Brief: “room functionality for smaller breakout groups or private sessions within a larger event” (Zoom or custom). Current: no breakout rooms per event; only generic voice channels in workspace. |

**Actions:**

- Breakout rooms: either integrate Zoom (or similar) for event sessions, or design custom “event sub-rooms” (e.g. link event to multiple rooms or to a dedicated video module).

---

## 3. Digital “Public Library”

| Requirement | Status | Implementation |
|-------------|--------|-----------------|
| Repository / CMS for digital resources | ✅ Done | `backend/models/Resource.ts`, `backend/routes/resourceRoutes.ts`, `/api/resources` |
| Content types: guides, e-books, courses | ✅ Done | `Resource.content_type`: guide, ebook, course, video, audio, other |
| User-friendly search and filtering | ✅ Done | Backend: `listResources` supports `?q=`, `?type=`, `?page=`, `?limit=`; text search with regex fallback. Frontend: `Library.tsx` – search (debounced), filter by type, server-side pagination with Trước/Sau. |

---

## 4. Service Directory

| Requirement | Status | Implementation |
|-------------|--------|-----------------|
| Searchable directory of services (community/partners) | ⏸️ Pending | Brief: “Subject to client approval before development.” Not implemented. |

**Action:** Start only after client approval; then add model, API, and UI (search, filters, service details, contact info).

---

## 5. Community Forum

| Requirement | Status | Implementation |
|-------------|--------|-----------------|
| Discussion board / forum module | ✅ Done | `src/features/forum/` (ForumPage, ThreadList, ThreadDetail, CreateTopic, ReplyForm), Dashboard tab “Diễn đàn” |
| Topic creation | ✅ Done | `CreateTopic` modal, POST `/api/forum/threads` |
| Threaded replies | ✅ Done | `ThreadDetail`, POST `/api/forum/threads/:threadId/posts`, pagination for posts |
| User moderation capabilities | ✅ Done | Delete thread/post: author or app `role: admin`; room admin kick in workspace (`admin-kick-user`, RoomManagementModal “Đưa ra”) |

**Gaps:** Optional enhancements: pin thread, lock thread, sort by newest/hot, vote (not in brief).

---

## Summary

- **Fully covered:** §1 (UI & management), §2 (booking calendar, email confirmation & reminders), §3 (Library CMS + content types), §5 (Forum + moderation).
- **Partial:** §2 event capacity (20–100) and breakout rooms; §3 Library search/filter/pagination.
- **Not started:** §4 Service directory (pending approval).

Recommended next steps for MVP: (1) Event capacity 20–100 + breakout strategy, (2) Library search/filter/pagination, (3) Optional forum enhancements (pin/lock/sort).

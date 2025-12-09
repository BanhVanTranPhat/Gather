# Kế Hoạch Cải Thiện Chat Interface Giống Discord

## 📋 Tổng Quan
Mục tiêu: Thiết kế lại giao diện chat để có trải nghiệm giống Discord với layout 4 cột, dark theme, và các tính năng tương tự.

## 🎨 Cấu Trúc Layout Discord

### 1. **Cột 1: Server List (Danh sách Server)**
- **Vị trí**: Cột ngoài cùng bên trái (rất hẹp ~72px)
- **Nội dung**:
  - Icon server hiện tại ở đầu
  - Các icon server khác (nếu có nhiều server)
  - Nút "+" để thêm server mới
  - Badge thông báo (số đỏ) trên icon server
  - Status indicator (online/offline) trên icon

### 2. **Cột 2: Channel List (Danh sách Kênh)**
- **Vị trí**: Cột thứ 2 từ trái (~240px)
- **Cấu trúc**:
  - Header: Tên server + nút search + nút tin nhắn mới + nút settings
  - Search bar: "Tìm kiếm" với shortcut Ctrl+F
  - **Sự kiện (Events)**: 
    - Hiển thị số lượng events (ví dụ: "1 Sự kiện")
    - Badge thông báo nếu có
  - **Kênh Chat (Text Channels)**:
    - Header section "Kênh Chat"
    - Danh sách kênh với icon "#"
    - Highlight kênh đang được chọn
    - Badge unread nếu có tin nhắn chưa đọc
  - **Kênh đàm thoại (Voice Channels)**:
    - Header section "Kênh đàm thoại"
    - Danh sách voice channels với icon microphone
    - Hiển thị số người đang trong voice channel
    - Hiển thị thời gian nếu đang active
    - Status indicator (màu xanh) khi có người trong channel
  - Footer: User profile với avatar, settings, mic/headphone controls

### 3. **Cột 3: Chat Area (Khu vực Chat)**
- **Vị trí**: Cột giữa (chiếm phần lớn không gian)
- **Cấu trúc**:
  - **Header**:
    - Tên kênh hiện tại với icon "#" hoặc "@"
    - Nút search
    - Nút inbox
    - Nút help
    - Nút minimize/maximize/close
  - **Message List**:
    - Background tối (dark theme)
    - Messages hiển thị với:
      - Avatar bên trái
      - Username + timestamp trên cùng một dòng
      - Message content bên dưới
      - Hover effect để hiện các action buttons (react, reply, etc.)
    - Group messages từ cùng user trong khoảng thời gian ngắn
    - Date separator khi có thay đổi ngày
  - **Input Area**:
    - Textarea với placeholder "Nhắn #channel-name"
    - Toolbar với các nút: emoji, GIF, sticker, attachment, etc.
    - Nút send (hoặc Enter để gửi)

### 4. **Cột 4: User List (Danh sách Người dùng)**
- **Vị trí**: Cột ngoài cùng bên phải (~240px)
- **Cấu trúc**:
  - **Trực tuyến (Online)**:
    - Header "Trực tuyến - X"
    - Danh sách users online với:
      - Avatar
      - Username
      - Status badge (online indicator)
      - Tag/badge nếu có role đặc biệt
      - Icon microphone nếu đang trong voice channel
  - **Ngoại tuyến (Offline)**:
    - Header "Ngoại tuyến - X"
    - Danh sách users offline (mờ hơn)
  - Footer: Icons cho emoji, GIF, sticker, gift

## 🎨 Design System

### Color Palette (Dark Theme)
- **Background chính**: `#36393f` (Discord dark gray)
- **Background sidebar**: `#2f3136` (Darker gray)
- **Background message**: `#36393f`
- **Background input**: `#40444b`
- **Text chính**: `#dcddde` (Light gray)
- **Text phụ**: `#72767d` (Medium gray)
- **Accent color**: `#5865f2` (Discord blurple)
- **Hover**: `#3c3f44`
- **Border**: `#202225`

### Typography
- **Font**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Message username**: 16px, font-weight: 500
- **Message content**: 16px, line-height: 1.375
- **Timestamp**: 12px, color: #72767d
- **Channel name**: 16px, font-weight: 600

### Spacing
- **Padding messages**: 16px horizontal, 4px vertical
- **Gap giữa messages**: 4px
- **Padding sidebar**: 8px
- **Border radius**: 4px (nhỏ, không quá bo tròn)

## 🔧 Tính Năng Cần Implement

### Phase 1: Layout & Structure
1. ✅ Tạo layout 4 cột responsive
2. ✅ Implement dark theme
3. ✅ Tạo Server List component
4. ✅ Cải thiện Channel List với sections
5. ✅ Redesign Chat Area
6. ✅ Tạo User List component

### Phase 2: Channel Management
1. ✅ Thêm voice channels
2. ✅ Hiển thị số người trong voice channel
3. ✅ Status indicators cho voice channels
4. ✅ Unread message badges
5. ✅ Channel categories/sections

### Phase 3: Message Features
1. ✅ Message grouping (group consecutive messages từ cùng user)
2. ✅ Date separators
3. ✅ Message reactions
4. ✅ Reply to message
5. ✅ Edit/Delete message
6. ✅ Rich text formatting (bold, italic, code blocks)
7. ✅ Embed links/images
8. ✅ Mention users (@username)

### Phase 4: User Features
1. ✅ Online/Offline status
2. ✅ User roles/badges
3. ✅ User profile modal
4. ✅ Voice channel indicators trong user list
5. ✅ User search/filter

### Phase 5: Advanced Features
1. ✅ Search messages
2. ✅ Pin messages
3. ✅ Threads (reply threads)
4. ✅ Notifications
5. ✅ Keyboard shortcuts
6. ✅ Drag & drop files
7. ✅ Emoji picker
8. ✅ GIF picker

## 📁 Cấu Trúc Files Cần Tạo/Sửa

### Components Mới
```
src/components/chat/
├── ServerList.tsx          # Cột server list
├── ServerList.css
├── ChannelList.tsx         # Cột channel list (cải thiện)
├── ChannelList.css
├── ChatArea.tsx            # Cột chat area (redesign)
├── ChatArea.css
├── UserList.tsx            # Cột user list
├── UserList.css
├── MessageItem.tsx         # Component message item
├── MessageItem.css
├── MessageInput.tsx         # Component input area
├── MessageInput.css
├── VoiceChannelItem.tsx    # Component voice channel
└── VoiceChannelItem.css
```

### Context Updates
```
src/contexts/
├── ChatContext.tsx         # Cần thêm: channels, voiceChannels, unreadCounts
└── UserContext.tsx         # Cần thêm: user status, voice channel status
```

### Types Mới
```typescript
// src/types/chat.ts
interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  category?: string;
  unreadCount?: number;
  description?: string;
}

interface VoiceChannel {
  id: string;
  name: string;
  users: string[]; // userIds
  isActive: boolean;
}

interface UserStatus {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  currentVoiceChannel?: string;
}
```

## 🚀 Implementation Steps

### Step 1: Setup Dark Theme
- [ ] Tạo theme variables trong CSS
- [ ] Apply dark theme cho ChatPage
- [ ] Update color scheme cho tất cả components

### Step 2: Redesign Layout
- [ ] Tạo layout 4 cột với flexbox/grid
- [ ] Implement ServerList component
- [ ] Redesign ChannelList với sections
- [ ] Redesign ChatArea với dark theme
- [ ] Implement UserList component

### Step 3: Channel Features
- [ ] Thêm voice channels vào data structure
- [ ] Implement voice channel UI
- [ ] Add unread badges
- [ ] Add channel categories

### Step 4: Message Features
- [ ] Redesign message display
- [ ] Implement message grouping
- [ ] Add date separators
- [ ] Add message actions (react, reply, etc.)

### Step 5: User Features
- [ ] Implement online/offline status
- [ ] Add voice channel indicators
- [ ] User list filtering

### Step 6: Polish & Testing
- [ ] Responsive design
- [ ] Animation & transitions
- [ ] Keyboard shortcuts
- [ ] Testing với nhiều users
- [ ] Performance optimization

## 📝 Notes
- Giữ nguyên backend logic, chỉ thay đổi UI/UX
- Đảm bảo responsive trên mobile (có thể collapse sidebar)
- Performance: Virtual scrolling cho message list nếu có nhiều messages
- Accessibility: Keyboard navigation, screen reader support

## 🎯 Priority
1. **High**: Layout 4 cột, dark theme, channel list với sections
2. **Medium**: Voice channels, user list, message grouping
3. **Low**: Advanced features (threads, pins, etc.)


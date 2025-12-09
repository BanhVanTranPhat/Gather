# Kế Hoạch Sửa Phần Chat Giống Discord

## 📌 Tóm Tắt

Dự án này sẽ redesign giao diện chat hiện tại để có trải nghiệm giống Discord với:
- **Layout 4 cột**: Server List → Channel List → Chat Area → User List
- **Dark Theme**: Màu tối giống Discord
- **Voice Channels**: Hiển thị kênh voice và số người đang tham gia
- **User Status**: Online/Offline với indicators
- **Message Features**: Grouping, reactions, embeds

## 🎯 Mục Tiêu Chính

1. ✅ Tạo layout 4 cột giống Discord
2. ✅ Áp dụng dark theme
3. ✅ Thêm voice channels vào UI
4. ✅ Hiển thị user list với status
5. ✅ Cải thiện message display

## 📐 Cấu Trúc Layout

```
┌──────┬──────────┬──────────────────┬──────────┐
│      │          │                  │          │
│Server│ Channel  │   Chat Area      │  Users   │
│ List │  List    │                  │   List   │
│      │          │                  │          │
└──────┴──────────┴──────────────────┴──────────┘
 72px    240px        Flexible         240px
```

## 🗂️ Files Cần Tạo/Sửa

### Components Mới
- `src/components/chat/ServerList.tsx` - Danh sách server
- `src/components/chat/ChannelList.tsx` - Danh sách kênh (cải thiện)
- `src/components/chat/ChatArea.tsx` - Khu vực chat (redesign)
- `src/components/chat/UserList.tsx` - Danh sách người dùng
- `src/components/chat/MessageItem.tsx` - Component tin nhắn
- `src/components/chat/VoiceChannelItem.tsx` - Component voice channel

### Files Cần Sửa
- `src/pages/ChatPage.tsx` - Redesign layout
- `src/pages/ChatPage.css` - Dark theme styles
- `src/contexts/ChatContext.tsx` - Thêm voice channels, unread counts

## 🎨 Design System

### Màu Sắc (Dark Theme)
- Background chính: `#36393f`
- Sidebar: `#2f3136`
- Input: `#40444b`
- Text chính: `#dcddde`
- Text phụ: `#72767d`
- Accent: `#5865f2` (Discord blurple)

### Typography
- Font: Inter, system fonts
- Message: 16px
- Username: 16px, font-weight 500
- Timestamp: 12px

## 📋 Checklist Implementation

### Phase 1: Layout & Theme ⭐ (Ưu tiên cao)
- [ ] Tạo layout 4 cột với flexbox
- [ ] Áp dụng dark theme
- [ ] Tạo ServerList component
- [ ] Redesign ChannelList với sections
- [ ] Redesign ChatArea
- [ ] Tạo UserList component

### Phase 2: Channels
- [ ] Thêm voice channels vào data
- [ ] Hiển thị voice channels trong UI
- [ ] Thêm unread badges
- [ ] Channel categories/sections

### Phase 3: Messages
- [ ] Message grouping (nhóm tin nhắn cùng user)
- [ ] Date separators
- [ ] Message reactions
- [ ] Rich text formatting

### Phase 4: Users
- [ ] Online/Offline status
- [ ] Voice channel indicators
- [ ] User search/filter

### Phase 5: Polish
- [ ] Animations & transitions
- [ ] Keyboard shortcuts
- [ ] Responsive design
- [ ] Testing

## 🚀 Bắt Đầu Implementation

### Bước 1: Setup Dark Theme
```css
/* Tạo CSS variables cho dark theme */
:root {
  --bg-primary: #36393f;
  --bg-secondary: #2f3136;
  --bg-tertiary: #40444b;
  --text-primary: #dcddde;
  --text-secondary: #72767d;
  --accent: #5865f2;
}
```

### Bước 2: Tạo Layout 4 Cột
```tsx
<div className="discord-layout">
  <ServerList />
  <ChannelList />
  <ChatArea />
  <UserList />
</div>
```

### Bước 3: Implement Components
Bắt đầu với ServerList và ChannelList, sau đó ChatArea và UserList.

## 📝 Notes Quan Trọng

1. **Giữ nguyên backend**: Chỉ thay đổi UI/UX, không sửa logic backend
2. **Responsive**: Đảm bảo hoạt động tốt trên mobile
3. **Performance**: Cân nhắc virtual scrolling cho message list
4. **Accessibility**: Hỗ trợ keyboard navigation

## 🔗 Tài Liệu Tham Khảo

- `PLAN_CHAT_DISCORD.md` - Kế hoạch chi tiết đầy đủ
- `UI_STRUCTURE_DISCORD.md` - Cấu trúc UI chi tiết

## ⏱️ Ước Tính Thời Gian

- Phase 1 (Layout & Theme): 4-6 giờ
- Phase 2 (Channels): 2-3 giờ
- Phase 3 (Messages): 3-4 giờ
- Phase 4 (Users): 2-3 giờ
- Phase 5 (Polish): 2-3 giờ

**Tổng cộng**: ~13-19 giờ

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn thành, chat interface sẽ có:
- ✅ Giao diện giống Discord với 4 cột
- ✅ Dark theme đẹp mắt
- ✅ Voice channels hiển thị đầy đủ
- ✅ User list với status indicators
- ✅ Message display được cải thiện
- ✅ Responsive trên mọi thiết bị


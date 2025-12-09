# Cấu Trúc UI Chat Discord-Style

## Layout Overview

```
┌─────────┬──────────────┬──────────────────────────────┬──────────────┐
│         │              │                              │              │
│ Server  │   Channel    │      Chat Area               │   User List  │
│  List   │    List      │                              │              │
│         │              │                              │              │
│  ~72px  │   ~240px     │      Flexible               │   ~240px     │
│         │              │                              │              │
└─────────┴──────────────┴──────────────────────────────┴──────────────┘
```

## Component Breakdown

### 1. ServerList Component
```
┌─────┐
│ 🏠 │ ← Current server (active)
├─────┤
│ 🎮 │ ← Other server
│ 133│ ← Unread badge
├─────┤
│ 🎨 │ ← Other server
│  ● │ ← Online indicator
├─────┤
│  + │ ← Add server button
└─────┘
```

**Props:**
- `servers: Server[]`
- `currentServerId: string`
- `onServerSelect: (id: string) => void`
- `onAddServer: () => void`

**State:**
- `hoveredServerId: string | null`

### 2. ChannelList Component
```
┌─────────────────────────────┐
│ Server Name    🔍 📝 ⚙️    │ ← Header
├─────────────────────────────┤
│ 🔍 Tìm kiếm          Ctrl+F │ ← Search
├─────────────────────────────┤
│ 📅 Sự kiện                   │ ← Events section
│    • Event 1          [1]    │
├─────────────────────────────┤
│ 💬 Kênh Chat                 │ ← Text channels
│    # general                 │
│    # public-chat-segs  [•]  │ ← Active + unread
│    # private-chat-...        │
│    # bot-request             │
│    # free-shit-real          │
│    # our-moms                │
│    # music-minecraft         │
│    # dev-web-segs            │
├─────────────────────────────┤
│ 🔊 Kênh đàm thoại            │ ← Voice channels
│    🔊 chat s...     5:39:32 │ ← Active voice
│    🔊 freef SG        [2]    │ ← Users count
│    🔊 khan_p          [1]    │
│    🔊 meo may buoi...        │
│    🔊 theuya...              │
│    🔊 tung beo                │
├─────────────────────────────┤
│ 💬 chat-segs                 │ ← More text channels
│ 💬 vibe-coding               │
│ 💬 suc cac backroo...        │
├─────────────────────────────┤
│ 👤 User Avatar               │ ← User footer
│    Settings ⚙️               │
│    🎤 🔊                     │ ← Mic/headphone
└─────────────────────────────┘
```

**Props:**
- `serverName: string`
- `channels: Channel[]`
- `voiceChannels: VoiceChannel[]`
- `selectedChannelId: string | null`
- `onChannelSelect: (id: string) => void`
- `onVoiceChannelJoin: (id: string) => void`
- `currentUser: User`

**State:**
- `searchQuery: string`
- `collapsedSections: Set<string>`

### 3. ChatArea Component
```
┌─────────────────────────────────────────────┐
│ #public-chat-segs    🔍 📥 ❓ ⚪ ⚪ ✕ │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│  [Avatar] Username    8:30 CH              │ ← Message 1
│              Message content here...        │
│                                             │
│  [Avatar] Username    8:30 CH              │ ← Message 2
│              Another message                │
│                                             │
│  [Avatar] Username    8:31 CH              │ ← Message 3
│              More content                   │
│                                             │
│  [Avatar] Username    8:34 CH              │ ← Message 4
│              [Embed: Image/Link]            │ ← Embed
│              Additional text                │
│                                             │
│                                             │ ← Scroll area
│                                             │
├─────────────────────────────────────────────┤
│ + 📎 😀                                    │ ← Input toolbar
│ Nhắn #public-chat-segs...              →   │ ← Input + Send
└─────────────────────────────────────────────┘
```

**Props:**
- `channel: Channel | null`
- `messages: Message[]`
- `onSendMessage: (content: string) => void`
- `currentUser: User`

**State:**
- `inputValue: string`
- `isTyping: boolean`
- `showEmojiPicker: boolean`
- `showAttachmentMenu: boolean`

### 4. UserList Component
```
┌─────────────────────────────┐
│ 🔍 Tìm kiếm                 │ ← Search (optional)
├─────────────────────────────┤
│ Trực tuyến - 15             │ ← Online header
│                             │
│ [👤] freef SG        🎤     │ ← Online user in voice
│ [👤] khan_p          🎤     │
│ [👤] Mako            🎤     │
│ [👤] theuyahihi      🎤     │
│ [👤] fluffy                 │
│ [👤] fisch                  │
│ [👤] APP                    │
│ [👤] User 8                 │
│ [👤] User 9                 │
│ ...                         │
├─────────────────────────────┤
│ Ngoại tuyến - 7             │ ← Offline header
│                             │
│ [👤] meo may b...           │ ← Offline users (muted)
│ [👤] meo may buoi beo       │
│ [👤] Mẫn                     │
│ [👤] tung beo               │
│ [👤] Undead                 │
│ [👤] vu bu                  │
│                             │
├─────────────────────────────┤
│ 😀 🎬 🎨 🎁                 │ ← Footer icons
└─────────────────────────────┘
```

**Props:**
- `users: User[]`
- `currentUserId: string`
- `onUserClick: (userId: string) => void`
- `searchQuery?: string`

**State:**
- `filteredUsers: User[]`
- `onlineUsers: User[]`
- `offlineUsers: User[]`

## Message Item Structure

```
┌─────────────────────────────────────────────┐
│ [Avatar] Username           8:30 CH        │ ← Message header
│              Message content here...        │ ← Message body
│              [Reactions: 👍 😂 ❤️]          │ ← Reactions (on hover)
│                                             │
└─────────────────────────────────────────────┘
```

**Message States:**
- Normal: Default display
- Hover: Show action buttons (react, reply, etc.)
- Selected: Highlighted (for reply/quote)
- Edited: Show "edited" badge
- Deleted: Show "[Message deleted]" placeholder

## Data Structures

### Channel Type
```typescript
type Channel = {
  id: string;
  name: string;
  type: 'text' | 'voice';
  category?: string; // "Kênh Chat", "Kênh đàm thoại"
  unreadCount?: number;
  description?: string;
  position?: number; // For ordering
};
```

### VoiceChannel Type
```typescript
type VoiceChannel = {
  id: string;
  name: string;
  users: string[]; // userIds currently in channel
  isActive: boolean;
  duration?: number; // If active, show duration
};
```

### Message Type (Enhanced)
```typescript
type Message = {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: number;
  channelId: string;
  editedAt?: number;
  deletedAt?: number;
  reactions?: Reaction[];
  replyTo?: string; // messageId
  embeds?: Embed[];
  attachments?: Attachment[];
};
```

## Responsive Behavior

### Desktop (>1024px)
- Full 4-column layout
- All sidebars visible

### Tablet (768px - 1024px)
- Collapse ServerList to icons only
- Keep ChannelList, ChatArea, UserList

### Mobile (<768px)
- Single column: ChatArea only
- Hamburger menu to toggle ChannelList
- UserList as overlay/modal
- ServerList hidden or in menu

## Color Scheme Details

### Background Colors
- Server List: `#202225`
- Channel List: `#2f3136`
- Chat Area: `#36393f`
- User List: `#2f3136`
- Input Area: `#40444b`

### Text Colors
- Primary: `#dcddde`
- Secondary: `#72767d`
- Muted: `#4f545c`
- Link: `#00aff4`

### Accent Colors
- Primary: `#5865f2` (Discord blurple)
- Success: `#43b581` (Online green)
- Warning: `#faa61a`
- Danger: `#f04747`

## Animation & Transitions

### Hover Effects
- Channel item: Background color change (0.15s)
- Message item: Slight background highlight (0.1s)
- Buttons: Scale up slightly (0.1s)

### Transitions
- Sidebar collapse/expand: 0.2s ease
- Modal open/close: 0.2s ease
- Message appear: Fade in (0.15s)

## Keyboard Shortcuts

- `Ctrl + K`: Quick switcher (channels/users)
- `Ctrl + F`: Search in current channel
- `Esc`: Close modals/clear input
- `Arrow Up`: Edit last message
- `Ctrl + Enter`: Send message (alternative)
- `Alt + Arrow Up/Down`: Navigate messages


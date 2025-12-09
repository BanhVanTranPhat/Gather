import { useRef, useEffect, useState, useMemo } from "react";
import MessageItem from "./MessageItem";
import DateSeparator from "./DateSeparator";
import "./ChatArea.css";

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  editedAt?: number;
  replyTo?: {
    id: string;
    username: string;
    message: string;
  };
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
}

interface ChatAreaProps {
  channelName: string;
  channelType?: "text" | "dm";
  messages: Message[];
  currentUserId?: string;
  onSendMessage: (content: string) => void;
  onReply?: (messageId: string, content: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  inputPlaceholder?: string;
}

const ChatArea = ({
  channelName,
  channelType = "text",
  messages,
  currentUserId,
  onSendMessage,
  onReply,
  onReact,
  onEdit,
  onDelete,
  inputPlaceholder,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    if (replyingTo) {
      onReply?.(replyingTo.id, inputValue);
      setReplyingTo(null);
    } else {
      onSendMessage(inputValue);
    }
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages and add date separators
  const groupedMessages = useMemo(() => {
    if (messages.length === 0) return [];

    const grouped: Array<Message | { type: "date"; date: Date }> = [];
    let currentGroup: Message[] = [];
    let lastDate: Date | null = null;
    const GROUP_TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp);
      const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

      // Add date separator if date changed
      if (!lastDate || msgDateOnly.getTime() !== lastDate.getTime()) {
        if (currentGroup.length > 0) {
          grouped.push(...currentGroup);
          currentGroup = [];
        }
        grouped.push({ type: "date", date: msgDateOnly });
        lastDate = msgDateOnly;
      }

      // Check if should group with previous message in current group
      const shouldGroup =
        currentGroup.length > 0 &&
        currentGroup[currentGroup.length - 1].userId === msg.userId &&
        msg.timestamp - currentGroup[currentGroup.length - 1].timestamp < GROUP_TIME_THRESHOLD;

      if (shouldGroup) {
        currentGroup.push(msg);
      } else {
        if (currentGroup.length > 0) {
          grouped.push(...currentGroup);
          currentGroup = [];
        }
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      grouped.push(...currentGroup);
    }

    return grouped;
  }, [messages]);

  const handleReply = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setReplyingTo(message);
    }
  };

  return (
    <div className="chat-area">
      {/* Header */}
      <div className="chat-area-header">
        <div className="chat-area-title">
          <span className="channel-type-icon">
            {channelType === "dm" ? "@" : "#"}
          </span>
          <span className="channel-name">{channelName}</span>
        </div>
        <div className="chat-area-actions">
          <button className="header-icon-btn" title="Search">🔍</button>
          <button className="header-icon-btn" title="Inbox">📥</button>
          <button className="header-icon-btn" title="Help">❓</button>
          <button className="header-icon-btn" title="Minimize">⚪</button>
          <button className="header-icon-btn" title="Maximize">⚪</button>
          <button className="header-icon-btn" title="Close">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-wrapper">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <div className="chat-messages-list">
            {groupedMessages.map((item, index) => {
              if ("type" in item && item.type === "date") {
                return <DateSeparator key={`date-${item.date.getTime()}`} date={item.date} />;
              }

              const msg = item as Message;
              const isOwnMessage = msg.userId === currentUserId;
              
              // Check if previous item is a message from the same user
              const prevItem = index > 0 ? groupedMessages[index - 1] : null;
              const isGrouped =
                prevItem &&
                !("type" in prevItem) &&
                (prevItem as Message).userId === msg.userId &&
                msg.timestamp - (prevItem as Message).timestamp < 5 * 60 * 1000;

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isGrouped={isGrouped || false}
                  isOwnMessage={isOwnMessage}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onReact={onReact}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="reply-preview">
          <div className="reply-preview-content">
            <span className="reply-preview-label">Đang trả lời</span>
            <span className="reply-preview-username">{replyingTo.username}</span>
            <span className="reply-preview-message">{replyingTo.message}</span>
          </div>
          <button
            className="reply-preview-close"
            onClick={() => setReplyingTo(null)}
            title="Hủy"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-wrapper">
        <div className="chat-input-container">
          <button className="input-attach-btn" title="Attach">+</button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              replyingTo
                ? `Trả lời ${replyingTo.username}...`
                : inputPlaceholder || `Nhắn #${channelName}`
            }
            className="chat-input"
          />
          <div className="input-toolbar">
            <button className="toolbar-icon-btn" title="Emoji">😀</button>
            <button className="toolbar-icon-btn" title="GIF">GIF</button>
            <button className="toolbar-icon-btn" title="Sticker">🎨</button>
            <button className="toolbar-icon-btn" title="Gift">🎁</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;


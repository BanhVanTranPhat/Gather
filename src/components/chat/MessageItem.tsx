import { useState, useEffect } from "react";
import "./MessageItem.css";

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

interface MessageItemProps {
  message: Message;
  isGrouped: boolean; // Nếu true, không hiển thị avatar và username
  isOwnMessage: boolean;
  currentUserId?: string;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

const MessageItem = ({
  message,
  isGrouped,
  isOwnMessage,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: MessageItemProps) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.message);

  // Sync editContent when message changes
  useEffect(() => {
    if (!isEditing) {
      setEditContent(message.message);
    }
  }, [message.message, isEditing]);

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessage = (text: string): React.ReactNode => {
    // Simple formatting: **bold**, *italic*, `code`, @mentions
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Match patterns: **bold**, *italic*, `code`, @username
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, type: "bold" },
      { regex: /\*(.+?)\*/g, type: "italic" },
      { regex: /`(.+?)`/g, type: "code" },
      { regex: /@(\w+)/g, type: "mention" },
    ];

    const matches: Array<{ index: number; length: number; type: string; content: string }> = [];
    
    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type,
          content: match[1],
        });
      }
    });

    matches.sort((a, b) => a.index - b.index);

    matches.forEach((match) => {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      if (match.type === "bold") {
        parts.push(<strong key={`${match.index}-bold`}>{match.content}</strong>);
      } else if (match.type === "italic") {
        parts.push(<em key={`${match.index}-italic`}>{match.content}</em>);
      } else if (match.type === "code") {
        parts.push(<code key={`${match.index}-code`} className="inline-code">{match.content}</code>);
      } else if (match.type === "mention") {
        parts.push(<span key={`${match.index}-mention`} className="mention">@{match.content}</span>);
      }
      
      lastIndex = match.index + match.length;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.message) {
      onEdit?.(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.message);
    }
  };

  const commonReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  return (
    <div
      className={`message-item ${isOwnMessage ? "own" : ""} ${isGrouped ? "grouped" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isGrouped && (
        <div className="message-avatar">
          {message.username.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="message-content-wrapper">
        {!isGrouped && (
          <div className="message-header">
            <span className="message-username">{message.username}</span>
            <span className="message-timestamp">
              {formatTime(message.timestamp)}
              {message.editedAt && (
                <span className="edited-badge" title="Đã chỉnh sửa"> (đã chỉnh sửa)</span>
              )}
            </span>
          </div>
        )}
        
        {message.replyTo && (
          <div className="message-reply">
            <span className="reply-icon">↩</span>
            <span className="reply-username">{message.replyTo.username}</span>
            <span className="reply-message">{message.replyTo.message}</span>
          </div>
        )}

        {isEditing ? (
          <div className="message-edit">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleEdit}
              className="edit-input"
              autoFocus
            />
            <span className="edit-hint">Nhấn Enter để lưu, Esc để hủy</span>
          </div>
        ) : (
          <div className="message-text">{formatMessage(message.message)}</div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction, idx) => (
              <button
                key={idx}
                className={`reaction-btn ${reaction.users.includes(currentUserId || "") ? "active" : ""}`}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                title={reaction.users.length > 0 ? `${reaction.users.length} người` : ""}
              >
                <span className="reaction-emoji">{reaction.emoji}</span>
                {reaction.users.length > 0 && (
                  <span className="reaction-count">{reaction.users.length}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons (show on hover) */}
        {showActions && !isEditing && (
          <div className="message-actions">
            {commonReactions.map((emoji) => (
              <button
                key={emoji}
                className="action-btn"
                onClick={() => onReact?.(message.id, emoji)}
                title={`Thêm ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            {onReply && (
              <button
                className="action-btn"
                onClick={() => onReply(message.id)}
                title="Trả lời"
              >
                ↩ Trả lời
              </button>
            )}
            {isOwnMessage && onEdit && (
              <button
                className="action-btn"
                onClick={() => setIsEditing(true)}
                title="Chỉnh sửa"
              >
                ✏️ Chỉnh sửa
              </button>
            )}
            {isOwnMessage && onDelete && (
              <button
                className="action-btn delete"
                onClick={() => onDelete(message.id)}
                title="Xóa"
              >
                🗑️ Xóa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;


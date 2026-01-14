import { useState, useEffect } from "react";
import { formatTime } from "../../utils/date";

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
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
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

    const matches: Array<{
      index: number;
      length: number;
      type: string;
      content: string;
    }> = [];

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
        parts.push(
          <strong key={`${match.index}-bold`}>{match.content}</strong>
        );
      } else if (match.type === "italic") {
        parts.push(<em key={`${match.index}-italic`}>{match.content}</em>);
      } else if (match.type === "code") {
        parts.push(
          <code key={`${match.index}-code`} className="inline-code">
            {match.content}
          </code>
        );
      } else if (match.type === "mention") {
        parts.push(
          <span key={`${match.index}-mention`} className="mention">
            @{match.content}
          </span>
        );
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

  // Generate consistent color for each user based on userId
  const getAvatarColor = (userId: string): string => {
    // Hash userId to get consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate color from hash (bright, vibrant colors)
    const hue = Math.abs(hash) % 360;
    const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
    const lightness = 45 + (Math.abs(hash) % 15); // 45-60%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const avatarColor = getAvatarColor(message.userId);
  const avatarInitial = message.username.charAt(0).toUpperCase();

  return (
    <div
      className={`flex gap-4 px-5 py-2 rounded-xl transition-all duration-200 relative group ${
        isGrouped
          ? "py-1"
          : "py-2.5 border-l-[3px] border-l-transparent pl-[17px]"
      } hover:bg-[#f8f9fa]/50 dark:hover:bg-[#32353b]/80 hover:translate-x-1 hover:shadow-sm`}
      style={{ animation: "messageSlideIn 0.3s ease-out" }}
      data-message-id={message.id}
      data-user-id={message.userId}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isGrouped && (
        <div className="relative shrink-0 w-11 h-11">
          <div
            className="w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-base cursor-pointer transition-all duration-300 border-2 border-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.2)] relative hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.3)] hover:ring-2 hover:ring-indigo-500/30 active:scale-95 after:content-[''] after:absolute after:-bottom-0.5 after:-right-0.5 after:w-4 after:h-4 after:rounded-full after:bg-gradient-to-br after:from-green-400 after:to-green-500 after:border-[3px] after:border-[#36393f] dark:after:border-white after:shadow-[0_0_0_2px_rgba(0,0,0,0.1),0_0_8px_rgba(34,197,94,0.4)] after:z-10"
            style={{ backgroundColor: avatarColor }}
            title={message.username}
          >
            {avatarInitial}
          </div>
        </div>
      )}
      <div className={`flex-1 min-w-0 ${isGrouped ? "ml-14 relative" : ""}`}>
        {!isGrouped ? (
          <div className="flex items-baseline gap-2.5 mb-1.5">
            <span
              className="font-bold text-[15px] cursor-pointer inline-block px-1.5 py-0.5 rounded-lg transition-all duration-200 hover:underline hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105"
              style={{ color: avatarColor }}
              title={`User ID: ${message.userId}`}
            >
              {message.username}
            </span>
            <span className="text-xs text-[#747f8d] font-medium">
              {formatTime(message.timestamp)}
              {message.editedAt && (
                <span
                  className="text-[11px] italic opacity-70 ml-1"
                  title="Đã chỉnh sửa"
                >
                  (đã chỉnh sửa)
                </span>
              )}
            </span>
          </div>
        ) : (
          // Show small timestamp for grouped messages (Discord-like)
          <span className="absolute -left-[60px] top-0 text-[11px] text-[#72767d] opacity-0 transition-opacity duration-200 whitespace-nowrap w-[50px] text-right group-hover:opacity-100">
            {formatTime(message.timestamp)}
          </span>
        )}

        {message.replyTo && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 border-l-[3px] border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-[#40444b] dark:to-[#3c3f44] rounded-lg text-sm text-[#4e5058] shadow-sm">
            <span className="text-base">↩</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {message.replyTo.username}
            </span>
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#72767d]">
              {message.replyTo.message}
            </span>
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleEdit}
              className="w-full px-2 py-2 bg-[#f8f9fa] dark:bg-[#40444b] border border-[#5865f2] rounded text-base text-[#060607] dark:text-[#dcddde] font-inherit"
              autoFocus
            />
            <span className="text-[11px] text-[#747f8d] italic">
              Nhấn Enter để lưu, Esc để hủy
            </span>
          </div>
        ) : (
          <>
            <div className="text-[15px] leading-relaxed text-[#060607] dark:text-[#dcddde] wrap-break-word whitespace-pre-wrap tracking-normal font-medium [&_strong]:font-bold [&_em]:italic [&_.inline-code]:bg-[#f8f9fa] dark:[&_.inline-code]:bg-[#40444b] [&_.inline-code]:px-1.5 [&_.inline-code]:py-0.5 [&_.inline-code]:rounded-md [&_.inline-code]:font-mono [&_.inline-code]:text-sm [&_.inline-code]:text-indigo-600 dark:[&_.inline-code]:text-indigo-400 [&_.mention]:bg-gradient-to-r [&_.mention]:from-indigo-500 [&_.mention]:to-indigo-600 [&_.mention]:text-white [&_.mention]:px-2 [&_.mention]:py-0.5 [&_.mention]:rounded-md [&_.mention]:font-semibold [&_.mention]:cursor-pointer [&_.mention]:shadow-sm">
              {formatMessage(message.message)}
            </div>
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {message.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="rounded overflow-hidden max-w-[400px]"
                  >
                    {att.mimeType.startsWith("image/") ? (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer"
                      >
                        <img
                          src={att.url}
                          alt={att.originalName}
                          className="max-w-full max-h-[300px] rounded object-contain block"
                        />
                      </a>
                    ) : (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-3 bg-[#f8f9fa] dark:bg-[#40444b] rounded no-underline text-[#060607] dark:text-[#dcddde] transition-colors duration-200 hover:bg-[#f0f1f2] dark:hover:bg-[#3c3f44]"
                      >
                        <span className="text-2xl shrink-0">📎</span>
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <span className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                            {att.originalName}
                          </span>
                          <span className="text-xs text-[#72767d]">
                            {(att.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, idx) => (
              <button
                key={idx}
                className={`flex items-center gap-1 px-2.5 py-1 bg-[#f8f9fa] dark:bg-[#40444b] border border-[#e3e5e8] dark:border-[#202225] rounded-xl cursor-pointer transition-all duration-200 text-sm relative overflow-hidden before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:w-0 before:h-0 before:rounded-full before:bg-[rgba(88,101,242,0.2)] before:-translate-x-1/2 before:-translate-y-1/2 before:transition-all before:duration-300 hover:before:w-full hover:before:h-full hover:bg-[#f0f1f2] dark:hover:bg-[#3c3f44] hover:border-[#5865f2] hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(88,101,242,0.2)] active:translate-y-0 active:scale-95 ${
                  reaction.users.includes(currentUserId || "")
                    ? "bg-[#5865f2] border-[#5865f2] text-white shadow-[0_2px_8px_rgba(88,101,242,0.4)]"
                    : ""
                }`}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                title={
                  reaction.users.length > 0
                    ? `${reaction.users.length} người`
                    : ""
                }
              >
                <span className="text-base">{reaction.emoji}</span>
                {reaction.users.length > 0 && (
                  <span className="text-xs font-semibold">
                    {reaction.users.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons (show on hover) */}
        {showActions && !isEditing && (
          <div
            className="flex items-center gap-1 mt-1.5 px-2 py-1.5 bg-[#f8f9fa] dark:bg-[#40444b] rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            {commonReactions.map((emoji) => (
              <button
                key={emoji}
                className="px-2.5 py-1.5 bg-transparent border-none rounded-md cursor-pointer text-[13px] text-[#4e5058] dark:text-[#96989d] transition-all duration-200 flex items-center gap-1.5 font-medium relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-[#5865f2] after:-translate-x-1/2 after:transition-all after:duration-200 hover:after:w-4/5 hover:bg-[#f0f1f2] dark:hover:bg-[#3c3f44] hover:text-[#060607] dark:hover:text-[#dcddde] hover:-translate-y-px active:translate-y-0 active:scale-95"
                onClick={() => onReact?.(message.id, emoji)}
                title={`Thêm ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            {onReply && (
              <button
                className="px-2.5 py-1.5 bg-transparent border-none rounded-md cursor-pointer text-[13px] text-[#4e5058] dark:text-[#96989d] transition-all duration-200 flex items-center gap-1.5 font-medium relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-[#5865f2] after:-translate-x-1/2 after:transition-all after:duration-200 hover:after:w-4/5 hover:bg-[#f0f1f2] dark:hover:bg-[#3c3f44] hover:text-[#060607] dark:hover:text-[#dcddde] hover:-translate-y-px active:translate-y-0 active:scale-95"
                onClick={() => onReply(message.id)}
                title="Trả lời"
              >
                ↩ Trả lời
              </button>
            )}
            {isOwnMessage && onEdit && (
              <button
                className="px-2.5 py-1.5 bg-transparent border-none rounded-md cursor-pointer text-[13px] text-[#4e5058] dark:text-[#96989d] transition-all duration-200 flex items-center gap-1.5 font-medium relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-[#5865f2] after:-translate-x-1/2 after:transition-all after:duration-200 hover:after:w-4/5 hover:bg-[#f0f1f2] dark:hover:bg-[#3c3f44] hover:text-[#060607] dark:hover:text-[#dcddde] hover:-translate-y-px active:translate-y-0 active:scale-95"
                onClick={() => setIsEditing(true)}
                title="Chỉnh sửa"
              >
                ✏️ Chỉnh sửa
              </button>
            )}
            {isOwnMessage && onDelete && (
              <button
                className="px-2.5 py-1.5 bg-transparent border-none rounded-md cursor-pointer text-[13px] text-[#4e5058] dark:text-[#96989d] transition-all duration-200 flex items-center gap-1.5 font-medium relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-white after:-translate-x-1/2 after:transition-all after:duration-200 hover:after:w-4/5 hover:bg-[#f23f42] dark:hover:bg-[#f04747] hover:text-white hover:-translate-y-px active:translate-y-0 active:scale-95"
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

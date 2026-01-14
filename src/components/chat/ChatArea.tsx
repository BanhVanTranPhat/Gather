import { useRef, useEffect, useState, useMemo } from "react";
import MessageItem from "./MessageItem";
import DateSeparator from "./DateSeparator";
import SearchModal from "../modals/SearchModal";
import FileUpload from "./FileUpload";

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

interface ChatAreaProps {
  channelName: string;
  channelType?: "text" | "dm";
  messages: Message[];
  currentUserId?: string;
  onSendMessage: (
    content: string,
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }>
  ) => void;
  onReply?: (messageId: string, content: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  inputPlaceholder?: string;
  typingUsers?: string[]; // NEW: List of usernames currently typing
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
  typingUsers = [], // NEW: Default to empty array
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }>
  >([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    if (replyingTo) {
      onReply?.(replyingTo.id, inputValue);
      setReplyingTo(null);
    } else {
      onSendMessage(
        inputValue,
        attachments.length > 0 ? attachments : undefined
      );
    }
    setInputValue("");
    setAttachments([]);
  };

  const handleFileUpload = () => {
    // File is being uploaded, FileUpload component will handle it
  };

  const handleUploadComplete = (fileUrl: string, fileData: any) => {
    setAttachments((prev) => [
      ...prev,
      {
        filename: fileData.filename,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
        url: fileUrl,
      },
    ]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      // Ctrl/Cmd + F: Open search (alternative)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "f" &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape: Close search
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  // Group messages and add date separators
  const groupedMessages = useMemo(() => {
    if (messages.length === 0) return [];

    const grouped: Array<Message | { type: "date"; date: Date }> = [];
    let currentGroup: Message[] = [];
    let lastDate: Date | null = null;
    const GROUP_TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp);
      const msgDateOnly = new Date(
        msgDate.getFullYear(),
        msgDate.getMonth(),
        msgDate.getDate()
      );

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
        msg.timestamp - currentGroup[currentGroup.length - 1].timestamp <
          GROUP_TIME_THRESHOLD;

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
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#36393f] to-[#2f3136] overflow-hidden">
      {/* Discord-style Header */}
      <div className="px-5 h-14 border-b border-[#202225]/60 flex items-center justify-between bg-gradient-to-r from-[#36393f] via-[#36393f] to-[#2f3136] sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-sm">
        <div className="flex items-center gap-2.5 text-base font-bold text-[#dcddde] cursor-pointer px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-[#3c3f44]/80 hover:scale-[1.02]">
          <span className="text-indigo-400 font-normal text-xl">#</span>
          <span className="text-[#dcddde] bg-gradient-to-r from-[#dcddde] to-[#ffffff] bg-clip-text text-transparent">{channelName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="bg-transparent border-none cursor-pointer text-lg p-1.5 text-[#96989d] transition-all duration-200 w-9 h-9 flex items-center justify-center rounded-lg hover:text-[#dcddde] hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
            title="Thông báo"
            onClick={() => setShowSearch(true)}
          >
            🔔
          </button>
          <button
            className="bg-transparent border-none cursor-pointer text-lg p-1.5 text-[#96989d] transition-all duration-200 w-9 h-9 flex items-center justify-center rounded-lg hover:text-[#dcddde] hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
            title="Ghim"
            onClick={() => setShowSearch(true)}
          >
            📌
          </button>
          <button
            className="bg-transparent border-none cursor-pointer text-lg p-1.5 text-[#96989d] transition-all duration-200 w-9 h-9 flex items-center justify-center rounded-lg hover:text-[#dcddde] hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
            title="Thành viên"
            onClick={() => setShowSearch(true)}
          >
            👥
          </button>
          <div className="relative mx-2">
            <input
              type="text"
              placeholder={`Tìm kiếm ${channelName}`}
              className="w-40 px-3 py-1.5 bg-[#202225]/80 border border-[#202225] rounded-lg text-sm text-[#dcddde] transition-all duration-200 focus:outline-none focus:w-64 focus:bg-[#1e1f22] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-[#72767d] shadow-sm"
              onFocus={() => setShowSearch(true)}
            />
          </div>
          <button
            className="bg-transparent border-none cursor-pointer text-lg p-1.5 text-[#96989d] transition-all duration-200 w-9 h-9 flex items-center justify-center rounded-lg hover:text-[#dcddde] hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
            title="Trợ giúp"
          >
            ?
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-[#36393f] via-[#36393f] to-[#2f3136] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#202225] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#1a1c1f]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-8 text-center text-[#72767d]">
            <div
              className="text-[6rem] mb-8 opacity-90 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
              style={{ animation: "float 3s ease-in-out infinite" }}
            >
              💬
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-[#dcddde] to-[#ffffff] bg-clip-text text-transparent m-0 mb-4">
              Chưa có tin nhắn nào
            </h3>
            <p className="text-base text-[#96989d] m-0 mb-8 max-w-[500px] leading-relaxed">
              Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên!
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 hover:scale-105"
                onClick={() => {
                  // Focus vào input
                  const input = document.querySelector(
                    ".chat-input input"
                  ) as HTMLInputElement;
                  input?.focus();
                }}
              >
                Gửi tin nhắn đầu tiên
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {groupedMessages.map((item, index) => {
              if ("type" in item && item.type === "date") {
                return (
                  <DateSeparator
                    key={`date-${item.date.getTime()}`}
                    date={item.date}
                  />
                );
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
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-[#72767d] italic">
                <span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} đang gõ...`
                    : `${typingUsers.length} người đang gõ...`}
                </span>
                <div className="flex gap-1">
                  <div
                    className="w-1 h-1 bg-[#72767d] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-[#72767d] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-[#72767d] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-[#f8f9fa] border-t border-[#e3e5e8] border-l-[3px] border-l-[#5865f2] dark:bg-[#40444b] dark:border-[#202225]"
          style={{ animation: "slideDown 0.3s ease-out" }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-[#747f8d] font-semibold">
              Đang trả lời
            </span>
            <span className="text-sm font-semibold text-[#5865f2]">
              {replyingTo.username}
            </span>
            <span className="text-sm text-[#4e5058] overflow-hidden text-ellipsis whitespace-nowrap flex-1 max-w-[300px]">
              {replyingTo.message}
            </span>
          </div>
          <button
            className="bg-transparent border-none text-[#96989d] cursor-pointer text-base p-1 rounded transition-all duration-200 hover:bg-[#f0f1f2] hover:text-[#060607] dark:hover:bg-[#3c3f44] dark:hover:text-[#dcddde]"
            onClick={() => setReplyingTo(null)}
            title="Hủy"
          >
            ✕
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div
          className="px-3 py-3 flex gap-3 flex-wrap bg-[#2f3136] border-t border-[#202225]"
          style={{ animation: "slideDown 0.3s ease-out" }}
        >
          {attachments.map((att, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden bg-[#40444b] transition-all duration-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            >
              {att.mimeType.startsWith("image/") ? (
                <img
                  src={att.url}
                  alt={att.originalName}
                  className="max-w-[200px] max-h-[200px] block"
                />
              ) : (
                <div className="px-3 py-2 flex items-center gap-2 min-w-[200px]">
                  <span className="text-xl">📎</span>
                  <span className="flex-1 text-[#dcddde] text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {att.originalName}
                  </span>
                  <span className="text-[#72767d] text-xs">
                    {(att.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
              <button
                className="absolute top-1.5 right-1.5 bg-black/70 border-none text-white w-7 h-7 rounded-full cursor-pointer flex items-center justify-center text-base transition-all duration-200 backdrop-blur-sm shadow-sm hover:bg-[#f43f42]/90 hover:scale-110 hover:shadow-md active:scale-95"
                onClick={() => removeAttachment(index)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-5 bg-gradient-to-b from-[#36393f] to-[#2f3136] border-t border-[#202225]/60 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2 bg-[#40444b]/80 backdrop-blur-sm rounded-xl px-4 min-h-[52px] transition-all duration-200 border-2 border-transparent focus-within:border-indigo-500/60 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.15)] focus-within:bg-[#40444b] shadow-lg">
          <FileUpload
            onFileSelect={handleFileUpload}
            onUploadComplete={handleUploadComplete}
            maxSize={10 * 1024 * 1024}
            acceptedTypes={["image/*", "application/pdf", "text/*"]}
          />
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
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#dcddde] py-3 min-h-[52px] placeholder:text-[#72767d] font-medium"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="bg-transparent border-none cursor-pointer text-lg p-2 text-[#96989d] transition-all duration-200 w-9 h-9 flex items-center justify-center rounded-lg relative hover:text-indigo-400 hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
              title="Emoji"
            >
              😀
            </button>
            <button
              className="bg-transparent border-none cursor-pointer text-sm font-semibold p-2 text-[#96989d] transition-all duration-200 w-9 h-9 flex items-center justify-center rounded-lg relative hover:text-indigo-400 hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
              title="GIF"
            >
              GIF
            </button>
            <button
              className="bg-transparent border-none cursor-pointer text-lg p-2 text-[#96989d] transition-all duration-200 w-9 h-9 flex items-center justify-center rounded-lg relative hover:text-indigo-400 hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
              title="Sticker"
            >
              🎨
            </button>
            <button
              className="bg-transparent border-none cursor-pointer text-lg p-2 text-[#96989d] transition-all duration-200 w-9 h-9 flex items-center justify-center rounded-lg relative hover:text-indigo-400 hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
              title="Gift"
            >
              🎁
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        roomId={localStorage.getItem("roomId") || "default-room"}
        channelId={channelType === "text" ? channelName : undefined}
        onMessageClick={(messageId) => {
          // Scroll to message when clicked
          const messageElement = document.querySelector(
            `[data-message-id="${messageId}"]`
          );
          if (messageElement) {
            messageElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            // Highlight message briefly
            messageElement.classList.add("message-highlight");
            setTimeout(() => {
              messageElement.classList.remove("message-highlight");
            }, 2000);
          }
        }}
      />
    </div>
  );
};

export default ChatArea;

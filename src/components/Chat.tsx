import { useMemo, useRef, useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useChat } from "../contexts/ChatContext";
import "./Chat.css";

const Chat = () => {
  const { users, currentUser } = useSocket();
  const {
    isOpen,
    toggleChat,
    activeTab,
    setActiveTab,
    messages,
    sendMessage,
    dmTarget,
    setDmTarget,
    isHistoryLoading,
  } = useChat();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const nearbyUsers = useMemo(() => {
    return users.filter((user) => {
      if (!currentUser || user.userId === currentUser.userId) return false;
      const distance = Math.sqrt(
        Math.pow(user.position.x - currentUser.position.x, 2) +
          Math.pow(user.position.y - currentUser.position.y, 2)
      );
      return distance < 200;
    });
  }, [users, currentUser]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    if (activeTab === "dm" && !dmTarget) return;
    sendMessage(inputMessage);
    setInputMessage("");
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-toggle" onClick={toggleChat}>
          💬
        </button>
      )}

      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-tabs">
              <button
                className={`chat-tab ${activeTab === "nearby" ? "active" : ""}`}
                onClick={() => setActiveTab("nearby")}
              >
                Nearby ({nearbyUsers.length})
              </button>
              <button
                className={`chat-tab ${activeTab === "global" ? "active" : ""}`}
                onClick={() => setActiveTab("global")}
              >
                Global
              </button>
              <button
                className={`chat-tab ${activeTab === "dm" ? "active" : ""}`}
                onClick={() => setActiveTab("dm")}
              >
                DM
              </button>
            </div>
            <button className="chat-close" onClick={toggleChat}>
              ✕
            </button>
          </div>

          {activeTab === "dm" && (
            <div className="dm-selector">
              <select
                value={dmTarget || ''}
                onChange={(e) => setDmTarget(e.target.value)}
                className="dm-select"
              >
                <option value="">Chọn người nhận</option>
                {users
                  .filter((u) => u.userId !== currentUser?.userId)
                  .map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.username}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="chat-messages">
            {isHistoryLoading && messages.length === 0 ? (
              <div className="chat-loading">Đang tải lịch sử...</div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message ${
                      msg.userId === currentUser?.userId ? "own" : ""
                    }`}
                  >
                    <div className="message-header">
                      <span className="message-username">{msg.username}</span>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                activeTab === "dm" && !dmTarget
                  ? "Chọn người nhận trước"
                  : "Nhập tin nhắn..."
              }
              className="chat-input"
              disabled={activeTab === "dm" && !dmTarget}
            />
            <button
              onClick={handleSend}
              className="chat-send"
              disabled={
                !inputMessage.trim() || (activeTab === "dm" && !dmTarget)
              }
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;





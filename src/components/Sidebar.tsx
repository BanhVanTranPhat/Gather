import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import Calendar from "./Calendar";
import "./Sidebar.css";

const Sidebar = () => {
  const { users, currentUser, isConnected } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "calendar">("users");
  const navigate = useNavigate();

  const onlineUsers = users.filter((u) => u.userId !== currentUser?.userId);
  const filteredUsers = onlineUsers.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExit = () => {
    navigate("/spaces");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Đồ án tốt nghiệp</h2>
      </div>

      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 People
        </button>
        <button
          className={`tab-btn ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          📅 Calendar
        </button>
      </div>

      {activeTab === "users" && (
        <>
          <div className="sidebar-section">
            <h3>Experience Gather together</h3>
            <p className="section-subtitle">Invite your closest collaborators.</p>
            <button className="invite-button">Invite</button>
          </div>

          <div className="sidebar-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search people"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-hint">Ctrl F</span>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="user-list">
              <div className="user-list-header">
                <span>Online ({onlineUsers.length + (currentUser ? 1 : 0)})</span>
              </div>
              {currentUser && (
                <div className="user-item active">
                  <div className="user-avatar">{currentUser.avatar}</div>
                  <div className="user-info">
                    <span className="user-name">{currentUser.username}</span>
                    <span className="user-status">Active</span>
                  </div>
                  <button
                    className="follow-btn"
                    onClick={() => {
                      // Follow functionality
                      console.log("Follow", currentUser.userId);
                    }}
                    title="Follow"
                  >
                    +
                  </button>
                </div>
              )}
              {filteredUsers.map((user) => (
                <div key={user.userId} className="user-item">
                  <div className="user-avatar">{user.avatar}</div>
                  <div className="user-info">
                    <span className="user-name">{user.username}</span>
                    <span className="user-status">Online</span>
                  </div>
                  <button
                    className="follow-btn"
                    onClick={() => {
                      // Follow functionality
                      console.log("Follow", user.userId);
                    }}
                    title="Follow"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "calendar" && (
        <div className="sidebar-section calendar-section">
          <Calendar />
        </div>
      )}

      <div className="sidebar-footer">
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <button className="exit-button" onClick={handleExit}>
          Thoát
        </button>
      </div>
    </div>
  );
};

export default Sidebar;


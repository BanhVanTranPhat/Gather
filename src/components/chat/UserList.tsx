import { useMemo } from "react";
import "./UserList.css";

interface User {
  userId: string;
  username: string;
  avatar?: string;
  status?: "online" | "offline" | "away" | "busy";
  currentVoiceChannel?: string;
  roles?: string[];
}

interface UserListProps {
  users: User[];
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
  searchQuery?: string;
}

const UserList = ({
  users,
  currentUserId,
  onUserClick,
  searchQuery = "",
}: UserListProps) => {
  const { onlineUsers, offlineUsers } = useMemo(() => {
    const filtered = users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate online and offline users based on status
    const online = filtered.filter(
      (user) => user.status === "online" || !user.status || user.status === undefined
    );
    const offline = filtered.filter((user) => user.status === "offline");

    return {
      onlineUsers: online,
      offlineUsers: offline,
    };
  }, [users, searchQuery]);

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case "online":
        return "#43b581";
      case "away":
        return "#faa61a";
      case "busy":
        return "#f04747";
      default:
        return "#43b581";
    }
  };

  return (
    <div className="user-list-container">
      {/* Optional Search */}
      {searchQuery !== undefined && (
        <div className="user-list-search">
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="search-input"
            readOnly
          />
        </div>
      )}

      {/* Online Users */}
      <div className="user-list-section">
        <div className="user-list-header">
          <span className="section-title">Trực tuyến - {onlineUsers.length}</span>
        </div>
        <div className="user-list-content">
          {onlineUsers.map((user) => (
            <div
              key={user.userId}
              className={`user-item ${user.userId === currentUserId ? "current-user" : ""}`}
              onClick={() => onUserClick?.(user.userId)}
            >
              <div className="user-avatar-wrapper">
                <div className="user-avatar">
                  {user.avatar || user.username.charAt(0).toUpperCase()}
                </div>
                <div
                  className="user-status-indicator"
                  style={{
                    backgroundColor: getStatusColor(user.status),
                  }}
                />
              </div>
              <div className="user-info">
                <div className="user-name">{user.username}</div>
                {user.roles && user.roles.length > 0 && (
                  <div className="user-roles">
                    {user.roles.map((role, idx) => (
                      <span key={idx} className="user-role-badge">
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {user.currentVoiceChannel && (
                <div className="user-voice-indicator" title="In voice channel">
                  🎤
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Offline Users - Always show section even if empty */}
      <div className="user-list-section">
        <div className="user-list-header">
          <span className="section-title">
            Ngoại tuyến - {offlineUsers.length}
          </span>
        </div>
        {offlineUsers.length > 0 ? (
          <div className="user-list-content">
            {offlineUsers.map((user) => (
              <div
                key={user.userId}
                className={`user-item offline ${user.userId === currentUserId ? "current-user" : ""}`}
                onClick={() => onUserClick?.(user.userId)}
              >
                <div className="user-avatar-wrapper">
                  <div className="user-avatar offline">
                    {user.avatar || user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-status-indicator offline" />
                </div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="user-list-empty">
            <span className="empty-text">Không có người ngoại tuyến</span>
          </div>
        )}
      </div>

      {/* Footer Icons */}
      <div className="user-list-footer">
        <button className="footer-icon-btn" title="Emoji">😀</button>
        <button className="footer-icon-btn" title="GIF">🎬</button>
        <button className="footer-icon-btn" title="Sticker">🎨</button>
        <button className="footer-icon-btn" title="Gift">🎁</button>
      </div>
    </div>
  );
};

export default UserList;


import { useNotifications } from "../contexts/NotificationContext";
import "./NotificationPanel.css";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div
        className="notification-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-header">
          <h2>
            Notifications
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </h2>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="btn-link" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="empty-state">
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${
                  !notification.read ? "unread" : ""
                } ${notification.type}`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  if (notification.actionUrl) {
                    // Navigate to action URL
                    window.location.href = notification.actionUrl;
                  }
                }}
              >
                <div className="notification-icon">
                  {notification.type === "event" && "📅"}
                  {notification.type === "message" && "💬"}
                  {notification.type === "success" && "✓"}
                  {notification.type === "warning" && "⚠"}
                  {notification.type === "error" && "✗"}
                  {notification.type === "info" && "ℹ"}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-time">
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>
                <button
                  className="notification-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notification.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="notification-footer">
            <button className="btn-link" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;


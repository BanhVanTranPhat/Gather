import { useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import "./NotificationCenter.css";

const NotificationCenter = () => {
  const { notifications, markAsRead, clearAll, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-center">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadNotifications.length > 0 && (
                <button onClick={clearAll} className="btn-clear">
                  Clear All
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="btn-close">
                ×
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.type} ${
                    notification.read ? "read" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {notification.type === "info" && "ℹ️"}
                    {notification.type === "success" && "✅"}
                    {notification.type === "warning" && "⚠️"}
                    {notification.type === "error" && "❌"}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                    {notification.action && (
                      <button
                        className="notification-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          notification.action?.onClick();
                        }}
                      >
                        {notification.action.label}
                      </button>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="notification-unread-indicator" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;


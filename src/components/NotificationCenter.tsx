import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { formatRelativeTime } from "../utils/date";

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "event_reminder":
      case "event_invite":
        return "📅";
      case "forum_mention":
      case "forum_reply":
      case "forum_like":
        return "💬";
      case "message":
        return "✉️";
      case "friend_request":
        return "👤";
      case "system":
        return "🔔";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative bg-none border-none text-xl cursor-pointer p-2 rounded-md transition-colors text-gray-800 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-[10px] min-w-[18px] text-center leading-tight">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[380px] max-h-[500px] bg-white border border-gray-300 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-[1000] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-50">
            <h3 className="m-0 text-lg font-semibold text-gray-800">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                className="px-3 py-1.5 bg-transparent border border-gray-300 rounded-md text-xs font-medium text-gray-600 cursor-pointer transition-all hover:bg-gray-100 hover:border-indigo-600 hover:text-indigo-600"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb:hover]:bg-gray-500">
            {notifications.length === 0 ? (
              <div className="py-10 px-5 text-center text-gray-600">
                <p className="m-0 text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`flex gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors relative ${
                    !notification.isRead
                      ? "bg-blue-50 border-l-[3px] border-l-indigo-600 pl-[13px]"
                      : "hover:bg-gray-50"
                  } last:border-b-0`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="text-2xl shrink-0 w-8 h-8 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 mb-1 leading-tight">
                      {notification.title}
                    </div>
                    <div className="text-[13px] text-gray-600 mb-1.5 leading-tight line-clamp-2">
                      {notification.message}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {formatRelativeTime(notification.createdAt)}
                    </div>
                  </div>
                  <button
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-transparent border-none text-gray-400 text-sm cursor-pointer flex items-center justify-center opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

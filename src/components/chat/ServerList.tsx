import { useState } from "react";
import "./ServerList.css";

interface Server {
  id: string;
  name: string;
  icon?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ServerListProps {
  servers?: Server[];
  currentServerId: string;
  onServerSelect?: (id: string) => void;
  onAddServer?: () => void;
}

const ServerList = ({ 
  servers = [], 
  currentServerId, 
  onServerSelect,
  onAddServer 
}: ServerListProps) => {
  const [hoveredServerId, setHoveredServerId] = useState<string | null>(null);

  // Default server if none provided
  const defaultServer: Server = {
    id: "default",
    name: "My Virtual Office",
    icon: "🏠",
    isOnline: true,
  };

  const displayServers = servers.length > 0 ? servers : [defaultServer];

  return (
    <div className="server-list">
      {displayServers.map((server) => {
        const isActive = server.id === currentServerId;
        const isHovered = hoveredServerId === server.id;

        return (
          <div
            key={server.id}
            className={`server-item ${isActive ? "active" : ""}`}
            onClick={() => onServerSelect?.(server.id)}
            onMouseEnter={() => setHoveredServerId(server.id)}
            onMouseLeave={() => setHoveredServerId(null)}
            title={server.name}
          >
            <div className="server-icon">
              {server.icon || server.name.charAt(0).toUpperCase()}
            </div>
            {server.unreadCount && server.unreadCount > 0 && (
              <div className="server-unread-badge">{server.unreadCount}</div>
            )}
            {server.isOnline && !isActive && (
              <div className="server-online-indicator" />
            )}
            {isHovered && !isActive && (
              <div className="server-hover-indicator" />
            )}
          </div>
        );
      })}
      {onAddServer && (
        <div
          className="server-item add-server"
          onClick={onAddServer}
          title="Add Server"
        >
          <div className="server-icon">+</div>
        </div>
      )}
    </div>
  );
};

export default ServerList;


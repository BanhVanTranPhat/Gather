import { useState } from "react";
import { useNotifications } from "../../contexts/NotificationContext";

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
  onAddServer,
}: ServerListProps) => {
  const [hoveredServerId, setHoveredServerId] = useState<string | null>(null);
  const { unreadCount } = useNotifications();

  // Default server if none provided
  const defaultServer: Server = {
    id: "default",
    name: "My Virtual Office",
    icon: "🏠",
    isOnline: true,
    unreadCount: unreadCount > 0 ? unreadCount : undefined,
  };

  const displayServers =
    servers.length > 0
      ? servers.map((server) => ({
          ...server,
          unreadCount:
            server.unreadCount ||
            (server.id === currentServerId && unreadCount > 0
              ? unreadCount
              : undefined),
        }))
      : [defaultServer];

  return (
    <div className="w-[72px] bg-[#202225] flex flex-col items-center py-3 gap-2 overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent">
      {displayServers.map((server) => {
        const isActive = server.id === currentServerId;
        const isHovered = hoveredServerId === server.id;

        return (
          <div
            key={server.id}
            className={`relative w-12 h-12 rounded-full bg-[#36393f] flex items-center justify-center cursor-pointer transition-all duration-200 mb-1 hover:bg-[#5865f2] hover:rounded-2xl ${
              isActive ? "bg-[#5865f2] rounded-2xl" : ""
            }`}
            onClick={() => onServerSelect?.(server.id)}
            onMouseEnter={() => setHoveredServerId(server.id)}
            onMouseLeave={() => setHoveredServerId(null)}
            title={server.name}
          >
            <div className="text-[22px] font-normal text-[#dcddde] select-none leading-none flex items-center justify-center w-full h-full">
              {server.icon || server.name.charAt(0).toUpperCase()}
            </div>
            {server.unreadCount && server.unreadCount > 0 && (
              <div
                className={`absolute -top-1 -right-1 bg-[#f04747] text-white rounded-[10px] flex items-center justify-center text-[11px] font-bold px-1.5 border-2 border-[#202225] z-10 shadow-[0_2px_4px_rgba(240,71,71,0.3)] ${
                  server.unreadCount <= 9
                    ? "min-w-[18px] h-[18px] text-[10px] px-1"
                    : "min-w-[20px] h-5"
                }`}
                style={{ animation: "pulse-badge 2s ease-in-out infinite" }}
                data-count={
                  server.unreadCount <= 9
                    ? server.unreadCount.toString()
                    : undefined
                }
              >
                {server.unreadCount > 99 ? "99+" : server.unreadCount}
              </div>
            )}
            {server.isOnline && !isActive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#43b581] rounded-full border-2 border-[#202225]" />
            )}
            {isHovered && !isActive && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-0 bg-[#dcddde] rounded-r transition-all duration-200 hover:h-5" />
            )}
            {isActive && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-10 bg-[#dcddde] rounded-r" />
            )}
          </div>
        );
      })}
      {onAddServer && (
        <div
          className="relative w-12 h-12 rounded-full bg-[#36393f] flex items-center justify-center cursor-pointer transition-all duration-200 mb-1 hover:bg-[#43b581] hover:rounded-2xl"
          onClick={onAddServer}
          title="Add Server"
        >
          <div className="text-2xl text-[#43b581] hover:text-white flex items-center justify-center w-full h-full transition-colors duration-200">
            +
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerList;

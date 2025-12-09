import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  users: User[];
  currentUser: User | null;
}

interface User {
  userId: string;
  username: string;
  avatar: string;
  position: { x: number; y: number };
  direction?: string;
  roomId?: string;
  status?: "online" | "offline"; // Track user status
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
  username: string;
  roomId: string;
}

export const SocketProvider = ({
  children,
  username,
  roomId,
}: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const newSocket = io(
      import.meta.env.VITE_SERVER_URL || "http://localhost:5001",
      {
        transports: ["websocket"],
      }
    );

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);

      // Join room
      let userId = localStorage.getItem("userId");
      if (!userId) {
        userId = `user-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        localStorage.setItem("userId", userId);
      }
      const storedAvatar =
        localStorage.getItem("userAvatar") || username.charAt(0).toUpperCase();
      const user: User = {
        userId,
        username,
        avatar: storedAvatar,
        position: { x: 100, y: 100 },
        roomId,
        status: "online",
      };
      setCurrentUser(user);
      currentUserIdRef.current = userId;

      newSocket.emit("user-join", {
        userId,
        username,
        roomId,
        avatar: storedAvatar,
      });
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("room-users", (roomUsers: User[]) => {
      console.log("Received room-users:", roomUsers.length, "users");
      // Update users list with all users in room (excluding currentUser)
      // Mark all as online
      setUsers((prev) => {
        const currentUserId = currentUserIdRef.current;
        const existingUsersMap = new Map(prev.map(u => [u.userId, u]));
        
        // Add/update users from server (all are online)
        roomUsers.forEach((user) => {
          if (user.userId !== currentUserId) {
            existingUsersMap.set(user.userId, { ...user, status: "online" });
          }
        });
        
        // Keep offline users but don't add new ones
        prev.forEach((user) => {
          if (user.userId !== currentUserId && !roomUsers.find(u => u.userId === user.userId)) {
            // User is still in our list but not in server list - keep as offline
            if (user.status !== "offline") {
              existingUsersMap.set(user.userId, { ...user, status: "offline" });
            } else {
              existingUsersMap.set(user.userId, user);
            }
          }
        });
        
        return Array.from(existingUsersMap.values());
      });
    });

    newSocket.on("user-joined", (user: User) => {
      console.log("User joined:", user);
      setUsers((prev) => {
        // Check if user already exists (could be offline)
        const existingIndex = prev.findIndex((u) => u.userId === user.userId);
        if (existingIndex >= 0) {
          // Update existing user to online
          const updated = [...prev];
          updated[existingIndex] = { ...user, status: "online" };
          return updated;
        }
        // Add new user as online
        return [...prev, { ...user, status: "online" }];
      });
    });

    newSocket.on("user-left", (data: { userId: string; username?: string; timestamp?: number }) => {
      console.log("User left event received:", data);
      setUsers((prev) => {
        const currentUserId = currentUserIdRef.current;
        // Don't mark current user as offline (they're still connected)
        if (data.userId === currentUserId) {
          console.log("Ignoring user-left for current user");
          return prev;
        }
        
        // Check if user exists in list
        const existingIndex = prev.findIndex((u) => u.userId === data.userId);
        
        if (existingIndex >= 0) {
          // Mark existing user as offline
          const updated = [...prev];
          updated[existingIndex] = { 
            ...updated[existingIndex], 
            status: "offline" as const 
          };
          console.log(`Marked user ${data.userId} as offline`);
          return updated;
        } else {
          // User not in list - add them as offline (they might have been in room before we joined)
          // Only add if we have username from the event
          if (data.username) {
            console.log(`Adding offline user ${data.username} (${data.userId}) to list`);
            return [...prev, {
              userId: data.userId,
              username: data.username,
              avatar: data.username.charAt(0).toUpperCase(),
              position: { x: 0, y: 0 },
              status: "offline" as const,
            }];
          }
          return prev;
        }
      });
    });

    newSocket.on("room-full", (data: { message: string; maxUsers: number; currentUsers: number }) => {
      alert(data.message);
      // Redirect to lobby or show error
    });

    newSocket.on("room-info", (data: { roomId: string; currentUsers: number; maxUsers: number }) => {
      // Update room info if needed
      console.log(`Room ${data.roomId}: ${data.currentUsers}/${data.maxUsers} users`);
    });

    newSocket.on("error", (data: { message: string }) => {
      console.error("Socket error:", data.message);
      // Show alert for all errors (including duplicate username)
      alert(data.message);
    });

    // Nhận danh sách vị trí của tất cả người chơi
    newSocket.on("allPlayersPositions", (allPlayers: User[]) => {
      // Cập nhật danh sách users với vị trí mới và mark as online
      setUsers((prev) => {
        const updatedUsers = [...prev];
        const onlineUserIds = new Set(allPlayers.map(p => p.userId));
        
        allPlayers.forEach((player) => {
          if (player.userId !== currentUser?.userId) {
            const existingIndex = updatedUsers.findIndex(
              (u) => u.userId === player.userId
            );
            if (existingIndex >= 0) {
              // Update existing user with new position/direction and mark online
              updatedUsers[existingIndex] = {
                ...updatedUsers[existingIndex],
                position: player.position || updatedUsers[existingIndex].position,
                direction: player.direction || updatedUsers[existingIndex].direction,
                status: "online" as const,
              };
            } else {
              // Add new user if not exists
              updatedUsers.push({ ...player, status: "online" as const });
            }
          }
        });
        
        // Mark users not in allPlayers as offline (but don't override if already marked offline by user-left event)
        updatedUsers.forEach((user, index) => {
          if (user.userId !== currentUser?.userId && !onlineUserIds.has(user.userId)) {
            // Only mark as offline if not already offline (preserve offline status from user-left)
            if (user.status !== "offline") {
              updatedUsers[index] = { ...user, status: "offline" as const };
            }
          }
        });
        
        return updatedUsers;
      });
    });

    // Listen for individual player movement updates
    newSocket.on("playerMoved", (data: { userId: string; position: { x: number; y: number }; direction?: string }) => {
      setUsers((prev) => {
        return prev.map((u) => {
          if (u.userId === data.userId) {
            return {
              ...u,
              position: data.position,
              direction: data.direction || u.direction,
            };
          }
          return u;
        });
      });
    });

    newSocket.on("join-success", (userData: User) => {
      console.log("Joined successfully, updating user data:", userData);
      setCurrentUser(userData);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [username, roomId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, users, currentUser }}>
      {children}
    </SocketContext.Provider>
  );
};


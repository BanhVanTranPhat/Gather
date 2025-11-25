import {
  createContext,
  useContext,
  useEffect,
  useState,
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

  useEffect(() => {
    const newSocket = io(
      import.meta.env.VITE_SERVER_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
      }
    );

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);

      // Join room
      const userId = `user-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const storedAvatar =
        localStorage.getItem("userAvatar") || username.charAt(0).toUpperCase();
      const user: User = {
        userId,
        username,
        avatar: storedAvatar,
        position: { x: 100, y: 100 },
      };
      setCurrentUser(user);

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
      setUsers(roomUsers);
    });

    newSocket.on("user-joined", (user: User) => {
      setUsers((prev) => {
        if (prev.find((u) => u.userId === user.userId)) {
          return prev;
        }
        return [...prev, user];
      });
    });

    newSocket.on("user-left", (data: { userId: string }) => {
      setUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    // Nhận danh sách vị trí của tất cả người chơi
    newSocket.on("allPlayersPositions", (allPlayers: User[]) => {
      // Cập nhật danh sách users với vị trí mới
      setUsers((prev) => {
        const updatedUsers = [...prev];
        allPlayers.forEach((player) => {
          if (player.userId !== currentUser?.userId) {
            const existingIndex = updatedUsers.findIndex(
              (u) => u.userId === player.userId
            );
            if (existingIndex >= 0) {
              updatedUsers[existingIndex] = {
                ...updatedUsers[existingIndex],
                ...player,
              };
            } else {
              updatedUsers.push(player);
            }
          }
        });
        return updatedUsers;
      });
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

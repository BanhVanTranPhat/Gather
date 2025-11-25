import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameScene from "../components/GameScene";
import Sidebar from "../components/Sidebar";
import ControlBar from "../components/ControlBar";
import VideoChat from "../components/VideoChat";
import Chat from "../components/Chat";
import Reactions from "../components/Reactions";
import ObjectsLayer from "../components/ObjectsLayer";
import ZonesLayer from "../components/ZonesLayer";
import { SocketProvider } from "../contexts/SocketContext";
import { WebRTCProvider } from "../contexts/WebRTCContext";
import { ChatProvider } from "../contexts/ChatContext";
import { ObjectProvider } from "../contexts/ObjectContext";
import { MapProvider } from "../contexts/MapContext";
import { EventProvider } from "../contexts/EventContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import "../App.css";

const AppPage = () => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("default-room");
  const [isJoined, setIsJoined] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication - ưu tiên dữ liệu từ Lobby
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUsername(savedName);
    } else {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        navigate("/lobby");
        return;
      }
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || user.email);
      } catch (e) {
        navigate("/lobby");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const storedRoom = localStorage.getItem("roomId");
    if (storedRoom) {
      setRoomId(storedRoom);
    }
  }, []);

  useEffect(() => {
    if (username && roomId) {
      setIsJoined(true);
    }
  }, [username, roomId]);

  if (!isJoined || !username) {
    return (
      <div className="join-screen">
        <div className="join-container">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider username={username} roomId={roomId}>
      <MapProvider>
        <WebRTCProvider>
          <ChatProvider roomId={roomId}>
            <ObjectProvider>
              <EventProvider>
                <NotificationProvider>
                  <div className="app-container">
                    <Sidebar />
                    <div className="game-container">
                      <GameScene />
                      <ControlBar />
                    </div>
                    <VideoChat />
                    <Chat />
                    <Reactions />
                    <ObjectsLayer />
                    <ZonesLayer />
                  </div>
                </NotificationProvider>
              </EventProvider>
            </ObjectProvider>
          </ChatProvider>
        </WebRTCProvider>
      </MapProvider>
    </SocketProvider>
  );
};

export default AppPage;

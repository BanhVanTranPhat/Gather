import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Lazy load heavy components for better code splitting
const GameScene = lazy(() => import("../components/game/GameScene"));
const Sidebar = lazy(() => import("../components/Sidebar"));
const ControlBar = lazy(() => import("../components/ControlBar"));
const VideoChat = lazy(() => import("../components/chat/VideoChat"));
const Chat = lazy(() => import("../components/chat/Chat"));
const MapLayers = lazy(() => import("../components/game/MapLayers"));
const ChatPage = lazy(() => import("./ChatPage"));
const ProfilePage = lazy(() => import("./ProfilePage"));
import {
  SocketProvider,
  WebRTCProvider,
  ChatProvider,
  ObjectProvider,
  MapProvider,
  EventProvider,
  ThemeProvider,
  NotificationProvider,
} from "../contexts";
import ErrorBoundary from "../components/ErrorBoundary";
import { SearchModal } from "../components/modals";
import { analytics } from "../utils/analytics";

const AppPage = () => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("default-room");
  const [isJoined, setIsJoined] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
      // Track room join
      analytics.trackUserAction("room_joined", {
        roomId,
        username,
      });
    }
  }, [username, roomId]);

  // Track page views
  useEffect(() => {
    analytics.trackPageView(location.pathname);
  }, [location.pathname]);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === "Escape" && showSearchModal) {
        setShowSearchModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearchModal]);

  if (!isJoined || !username) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="bg-white p-8 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] min-w-[400px]">
          <h1 className="text-center mb-8 text-gray-800">Loading...</h1>
        </div>
      </div>
    );
  }

  const isChatPage = location.pathname === "/app/chat";
  const isProfilePage = location.pathname.startsWith("/app/profile");

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SocketProvider username={username} roomId={roomId}>
          <MapProvider>
            <WebRTCProvider>
              <ChatProvider roomId={roomId}>
                <ObjectProvider>
                  <EventProvider>
                    <NotificationProvider>
                      <div className="flex w-screen h-screen overflow-hidden bg-gray-50 dark:bg-[#1a1a1a]">
                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center w-full h-full">
                              <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
                            </div>
                          }
                        >
                          <Sidebar />
                          {isChatPage ? (
                            <>
                              <ChatPage />
                              <VideoChat /> {/* Allow video chat on ChatPage */}
                              {/* ControlBar integrated into ChannelList footer */}
                            </>
                          ) : isProfilePage ? (
                            <>
                              <ProfilePage />
                            </>
                          ) : (
                            <>
                              <div className="flex-1 relative flex flex-col overflow-hidden bg-gray-50 dark:bg-[#1a1a1a]">
                                <GameScene />
                                <ControlBar />
                              </div>
                              <VideoChat />
                              <Chat />
                              {/* Reactions sidebar removed */}
                              <MapLayers />
                            </>
                          )}
                        </Suspense>
                      </div>
                      {showSearchModal && (
                        <Suspense fallback={<div>Loading Search...</div>}>
                          <LazySearchModal
                            onClose={() => setShowSearchModal(false)}
                          />
                        </Suspense>
                      )}
                    </NotificationProvider>
                  </EventProvider>
                </ObjectProvider>
              </ChatProvider>
            </WebRTCProvider>
          </MapProvider>
        </SocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default AppPage;

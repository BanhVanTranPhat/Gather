import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

// Lazy load heavy components for better code splitting
const Sidebar = lazy(() => import("../components/Sidebar"));
const WorkspacePage = lazy(() => import("../features/workspace/WorkspacePage"));
const ChatPage = lazy(() => import("./ChatPage"));
const EventsPage = lazy(() => import("./EventsPage"));
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
import { SearchModal } from "../components/modals"; // Ensure this is correct
import { analytics } from "../utils/analytics";

const AppPage = () => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState(
    () => localStorage.getItem("roomId") || "default-room",
  );
  const [isJoined, setIsJoined] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const showChatPanel = searchParams.get("chat") === "1";
  const isChatFullPage = location.pathname === "/app/chat";

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUsername(savedName);
    } else {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        navigate("/");
        return;
      }
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || user.email);
      } catch (e) {
        navigate("/");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!isChatFullPage) {
      const storedRoom = localStorage.getItem("roomId");
      if (storedRoom) setRoomId(storedRoom);
    }
  }, [isChatFullPage]);

  const handleSwitchRoom = (newRoomId: string, newRoomName: string) => {
    localStorage.setItem("roomId", newRoomId);
    localStorage.setItem("roomName", newRoomName);
    setRoomId(newRoomId);
  };

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

  // When kicked from room by admin, redirect to home
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message?: string };
      if (detail?.message) alert(detail.message);
      navigate("/", { replace: true });
    };
    window.addEventListener("app:kicked-from-room", handler);
    return () => window.removeEventListener("app:kicked-from-room", handler);
  }, [navigate]);

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
      <div className="flex justify-center items-center w-screen h-screen bg-obsidian text-white">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl">
          <div className="w-12 h-12 border-2 border-gather-accent border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(26,188,156,0.5)]"></div>
          <h1 className="text-lg font-outfit tracking-wide font-medium text-slate-200">
            Initializing...
          </h1>
        </div>
      </div>
    );
  }

  const isProfilePage = location.pathname.startsWith("/app/profile");
  const isEventsPage = location.pathname === "/app/events";

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
                      <div className="flex w-screen h-screen overflow-hidden bg-gather-hero text-slate-100 font-sans selection:bg-gather-accent/30">
                        {/* Global Background Mesh */}
                        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(26,188,156,0.08),rgba(0,0,0,0)_50%)] pointer-events-none" />

                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center w-full h-full bg-gather-hero">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 border-2 border-gather-accent border-t-transparent rounded-full animate-spin mb-3"></div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest">
                                  Loading Interface
                                </div>
                              </div>
                            </div>
                          }
                        >
                          <Sidebar />
                          {isEventsPage ? (
                            <EventsPage />
                          ) : isProfilePage ? (
                            <ProfilePage />
                          ) : isChatFullPage ? (
                            <ChatPage
                              fullPage
                              roomId={roomId}
                              onSwitchRoom={handleSwitchRoom}
                            />
                          ) : (
                            <WorkspacePage
                              roomId={roomId}
                              showChatPanel={showChatPanel}
                            />
                          )}
                        </Suspense>
                      </div>

                      {showSearchModal && (
                        <SearchModal
                          isOpen={showSearchModal}
                          onClose={() => setShowSearchModal(false)}
                          roomId={roomId}
                        />
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

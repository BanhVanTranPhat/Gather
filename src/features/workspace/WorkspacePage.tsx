/**
 * WorkspacePage – Layout workspace: Sidebar | Game Canvas | Chat Panel.
 * Chỉ dùng RoomChatContext, không ServerList / ChannelList / DM.
 */
import { lazy, Suspense } from "react";
import { RoomChatProvider } from "../../contexts/RoomChatContext";
import WorkspaceChatPanel from "./WorkspaceChatPanel";

const GameScene = lazy(() => import("../../components/game/GameScene"));
const ControlBar = lazy(() => import("../../components/ControlBar"));
const VideoChat = lazy(() => import("../../components/chat/VideoChat"));
const Chat = lazy(() => import("../../components/chat/Chat"));
const MapLayers = lazy(() => import("../../components/game/MapLayers"));

interface WorkspacePageProps {
  roomId: string;
  showChatPanel: boolean;
}

export default function WorkspacePage({
  roomId,
  showChatPanel,
}: WorkspacePageProps) {
  return (
    <RoomChatProvider roomId={roomId}>
      <div className="flex-1 flex min-w-0 m-2 gap-2">
        <div className="flex-1 relative flex flex-col overflow-hidden bg-[#0a0a0c] rounded-2xl border border-white/5 shadow-2xl">
          <Suspense
            fallback={
              <div className="flex items-center justify-center flex-1">
                <div className="w-10 h-10 border-2 border-gather-accent border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <GameScene />
            <ControlBar />
          </Suspense>
        </div>
        {showChatPanel && (
          <div className="w-[380px] shrink-0 rounded-2xl border border-white/5 overflow-hidden bg-gather-hero-end/95 backdrop-blur-xl shadow-2xl flex flex-col">
            <WorkspaceChatPanel roomId={roomId} />
          </div>
        )}
      </div>
      <Suspense fallback={null}>
        <VideoChat />
        <Chat />
        <MapLayers />
      </Suspense>
    </RoomChatProvider>
  );
}

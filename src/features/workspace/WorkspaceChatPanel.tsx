/**
 * WorkspaceChatPanel – Chat panel chỉ cho workspace.
 * Chỉ gồm: RoomHeader, Messages, Input, ParticipantList.
 * Không ServerList, ChannelList, DM, multi-channel.
 */
import { useState } from "react";
import { useRoomChat } from "../../contexts/RoomChatContext";
import { useSocket } from "../../contexts/SocketContext";
import ChatArea from "../../components/chat/ChatArea";
import RoomManagementModal from "./RoomManagementModal";
import { InviteModal } from "../../components/modals";

interface WorkspaceChatPanelProps {
  roomId: string;
}

export default function WorkspaceChatPanel({ roomId }: WorkspaceChatPanelProps) {
  const { currentUser } = useSocket();
  const {
    messages,
    sendMessage,
    participants,
    voiceChannels,
    currentVoiceChannel,
    joinVoiceChannel,
    leaveVoiceChannel,
    reactToMessage,
    editMessage,
    deleteMessage,
    typingUsers,
    emitTyping,
  } = useRoomChat();

  const [showRoomManagementModal, setShowRoomManagementModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const roomName = typeof window !== "undefined" ? localStorage.getItem("roomName") || roomId : roomId;

  return (
    <div className="flex flex-col h-full min-h-0 bg-gather-hero text-slate-100">
      {/* RoomHeader: Phòng + Online + icon Quản lý phòng + Invite */}
      <div className="shrink-0 px-3 py-2 bg-gather-hero-end/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-400 min-w-0">
          <span className="font-semibold text-white shrink-0">Phòng:</span>
          <span className="truncate">{roomName}</span>
          <span className="text-slate-500 shrink-0">·</span>
          <span className="shrink-0">Online: {participants.length}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Mời vào phòng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowRoomManagementModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Quản lý phòng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Voice: một dòng nếu có */}
      {voiceChannels.length > 0 && (
        <div className="shrink-0 px-3 py-1.5 border-b border-white/5 flex flex-wrap gap-1">
          {voiceChannels.map((vc) => {
            const isActive = currentVoiceChannel === vc.id;
            return (
              <button
                key={vc.id}
                type="button"
                onClick={() => (isActive ? leaveVoiceChannel() : joinVoiceChannel(vc.id))}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
                </svg>
                {vc.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Messages + Input */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatArea
          channelName="Chat chung"
          channelType="text"
          messages={messages.map((m) => ({
            id: m.id,
            userId: m.userId,
            username: m.username,
            message: m.message,
            timestamp: m.timestamp,
            editedAt: m.editedAt,
            replyTo: m.replyTo,
            reactions: m.reactions,
            attachments: m.attachments,
          }))}
          currentUserId={currentUser?.userId}
          onSendMessage={(content, attachments) => sendMessage(content, undefined, attachments)}
          onReply={(messageId, content) => sendMessage(content, messageId)}
          onReact={reactToMessage}
          onEdit={editMessage}
          onDelete={deleteMessage}
          inputPlaceholder="Nhắn tin trong phòng..."
          typingUsers={typingUsers}
          onTyping={emitTyping}
        />
      </div>

      {/* ParticipantList: compact strip */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Trong phòng</span>
        {participants.slice(0, 8).map((p) => (
          <div
            key={p.userId}
            className="shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-200"
            title={p.username}
          >
            {p.avatar}
          </div>
        ))}
        {participants.length > 8 && (
          <span className="text-xs text-slate-500 shrink-0">+{participants.length - 8}</span>
        )}
      </div>

      {showRoomManagementModal && (
        <RoomManagementModal
          roomId={roomId}
          roomName={roomName}
          onClose={() => setShowRoomManagementModal(false)}
        />
      )}

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
      />
    </div>
  );
}

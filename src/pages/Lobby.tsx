import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

interface SavedRoom {
  id: string;
  name: string;
  lastJoined: number;
}

interface LobbyProps {
  embedded?: boolean;
  onBack?: () => void;
}

const Lobby = ({ embedded, onBack }: LobbyProps = {}) => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for room parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");

    // Prefill user info from login data
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const email = user.email || "";
        const derivedName = email ? email.split("@")[0] : "guest";
        setUserEmail(email);
        setUserName(derivedName);
      } catch (error) {
        console.error("Failed to parse user info", error);
        setUserName("guest");
      }
    } else {
      setUserName("guest");
    }

    const storedRoomId = localStorage.getItem("roomId");
    const storedRoomName = localStorage.getItem("roomName");
    setRoomId(
      roomParam ||
        storedRoomId ||
        `space-${Math.random().toString(36).substring(2, 8)}`,
    );
    setRoomName(storedRoomName || "Không gian của tôi");

    try {
      const storedRooms = localStorage.getItem("savedRooms");
      if (storedRooms) {
        setSavedRooms(JSON.parse(storedRooms));
      }
    } catch (error) {
      console.error("Failed to read saved rooms", error);
    }

    requestMediaPermissions();
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const enumerateDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
    } catch (e) {
      console.warn("enumerateDevices failed", e);
    }
  };

  const requestMediaPermissions = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Media devices API not available");
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setCameraEnabled(true);
      setMicEnabled(true);
      await enumerateDevices();
      const vTrack = mediaStream.getVideoTracks()[0];
      const aTrack = mediaStream.getAudioTracks()[0];
      if (vTrack) setSelectedVideoId(vTrack.getSettings().deviceId ?? "");
      if (aTrack) setSelectedAudioId(aTrack.getSettings().deviceId ?? "");
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        console.warn(
          "No media devices found. You can continue without camera/microphone.",
        );
      } else if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        console.warn(
          "Media permissions denied. You can continue without camera/microphone.",
        );
      } else {
        console.warn("Error accessing media devices:", error.message || error);
      }
      setCameraEnabled(false);
      setMicEnabled(false);
      await enumerateDevices();
    }
  };

  const switchVideoDevice = async (deviceId: string) => {
    if (!deviceId || !navigator.mediaDevices?.getUserMedia) return;
    setSelectedVideoId(deviceId);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: stream
          ? selectedAudioId
            ? { deviceId: { exact: selectedAudioId } }
            : true
          : false,
      });
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setStream(newStream);
      setCameraEnabled(true);
    } catch (e) {
      console.warn("Switch video device failed", e);
    }
  };

  const switchAudioDevice = async (deviceId: string) => {
    if (!deviceId || !navigator.mediaDevices?.getUserMedia) return;
    setSelectedAudioId(deviceId);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: stream
          ? selectedVideoId
            ? { deviceId: { exact: selectedVideoId } }
            : true
          : false,
        audio: { deviceId: { exact: deviceId } },
      });
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setStream(newStream);
      setMicEnabled(true);
    } catch (e) {
      console.warn("Switch audio device failed", e);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled;
        setCameraEnabled(!cameraEnabled);
      }
    } else {
      // Allow toggling state even without stream
      setCameraEnabled(!cameraEnabled);
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    } else {
      // Allow toggling state even without stream
      setMicEnabled(!micEnabled);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = `space-${Date.now().toString(36)}`;
    setRoomId(newRoomId);
    setRoomName(`Phòng mới ${savedRooms.length + 1}`);
  };

  const handleSelectRoom = (room: SavedRoom) => {
    setRoomId(room.id);
    setRoomName(room.name);
  };

  const updateSavedRooms = (room: SavedRoom) => {
    const updated = [
      { ...room, lastJoined: Date.now() },
      ...savedRooms.filter((r) => r.id !== room.id),
    ]
      .sort((a, b) => b.lastJoined - a.lastJoined)
      .slice(0, 6);

    setSavedRooms(updated);
    localStorage.setItem("savedRooms", JSON.stringify(updated));
  };

  const handleJoin = () => {
    if (!roomId.trim()) {
      alert("Vui lòng nhập Room ID");
      return;
    }

    // Stop media stream if user wants to join without camera/mic
    if (stream && (!cameraEnabled || !micEnabled)) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    const finalName = userName || "guest";
    const avatar = finalName.charAt(0).toUpperCase();
    const finalRoomName = roomName || roomId;

    localStorage.setItem("userName", finalName);
    localStorage.setItem("userAvatar", avatar);
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("roomName", finalRoomName);
    // Store media preferences
    localStorage.setItem("cameraEnabled", String(cameraEnabled));
    localStorage.setItem("micEnabled", String(micEnabled));

    updateSavedRooms({
      id: roomId,
      name: finalRoomName,
      lastJoined: Date.now(),
    });

    navigate("/app");
  };

  return (
    <div
      className={`flex bg-gradient-to-br from-gather-hero to-gather-hero-end overflow-y-auto ${embedded ? "min-h-0 p-4 rounded-2xl" : "min-h-screen items-center justify-center p-6 md:p-8"}`}
    >
      <div
        className={`w-full rounded-2xl max-md:p-5 ${embedded ? "max-w-full" : "max-w-[720px]"}`}
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <div className="p-6 md:p-8">
          {/* Header nhỏ: không hero to */}
          <div className="flex justify-between items-start gap-4 mb-6 max-md:flex-col">
            <div>
              {!embedded && (
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium text-gather-accent hover:underline"
                  >
                    Dashboard
                  </Link>
                  <span className="text-slate-500">/</span>
                  <span className="text-sm text-slate-400">Vào phòng</span>
                </div>
              )}
              <h1
                className="text-xl md:text-2xl font-bold text-white tracking-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Chuẩn bị trước khi vào phòng
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Chọn không gian và kiểm tra camera, micro.
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-gather-accent flex items-center justify-center text-white text-lg font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{userName}</p>
                <p className="text-slate-400 text-xs">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Room đang join + trạng thái (định hướng rõ) */}
          <div className="flex flex-wrap items-center gap-4 mb-6 py-3 px-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Phòng
              </p>
              <p className="text-base font-bold text-white">
                {roomName || roomId || "—"}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Đang trong phòng
              </p>
              <p className="text-base font-medium text-slate-300">— people</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-400">
                Sẵn sàng
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Thông tin của bạn
              </p>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Tên hiển thị</span>
                <strong className="text-white">{userName}</strong>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Email</span>
                <strong className="text-white">{userEmail || "—"}</strong>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Chọn hoặc tạo phòng
              </p>
              <div className="flex gap-2 max-md:flex-col">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Room ID"
                  className="flex-1 px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-gather-accent/50 focus:ring-1 focus:ring-gather-accent/30"
                />
                <button
                  type="button"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl font-semibold text-sm transition-colors"
                  onClick={handleCreateRoom}
                >
                  Tạo phòng mới
                </button>
              </div>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Tên phòng hiển thị"
                className="px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-gather-accent/50"
              />
              {savedRooms.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs text-slate-400">Phòng đã tạo:</span>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
                    {savedRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        className={`rounded-xl p-3 text-left cursor-pointer flex flex-col gap-0.5 transition-all duration-200 border ${
                          room.id === roomId
                            ? "border-gather-accent bg-gather-accent/10"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                        onClick={() => handleSelectRoom(room)}
                      >
                        <span className="font-medium text-white text-sm truncate">
                          {room.name}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {room.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Camera & Mic – card layout, toggles mềm */}
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
              <div className="relative aspect-video bg-slate-900">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      cameraEnabled
                        ? "bg-emerald-500/90 text-white"
                        : "bg-white/10 text-slate-400 hover:bg-white/15 border border-white/10"
                    }`}
                    onClick={toggleCamera}
                  >
                    {cameraEnabled ? "Camera bật" : "Camera tắt"}
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      micEnabled
                        ? "bg-emerald-500/90 text-white"
                        : "bg-white/10 text-slate-400 hover:bg-white/15 border border-white/10"
                    }`}
                    onClick={toggleMic}
                  >
                    {micEnabled ? "Micro bật" : "Micro tắt"}
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-white/5 flex flex-wrap gap-4">
                {videoDevices.length > 1 && (
                  <label className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Camera
                    </span>
                    <select
                      value={selectedVideoId}
                      onChange={(e) => switchVideoDevice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-gather-accent/50"
                    >
                      {videoDevices.map((d) => (
                        <option
                          key={d.deviceId}
                          value={d.deviceId}
                          className="bg-slate-800 text-white"
                        >
                          {d.label || `Camera ${videoDevices.indexOf(d) + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {audioDevices.length > 1 && (
                  <label className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Microphone
                    </span>
                    <select
                      value={selectedAudioId}
                      onChange={(e) => switchAudioDevice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-gather-accent/50"
                    >
                      {audioDevices.map((d) => (
                        <option
                          key={d.deviceId}
                          value={d.deviceId}
                          className="bg-slate-800 text-white"
                        >
                          {d.label ||
                            `Microphone ${audioDevices.indexOf(d) + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-400 px-4 pb-3 border-t border-white/5">
                Camera và micro là tùy chọn. Bạn vẫn có thể vào phòng khi tắt.
              </p>
            </div>

            <button
              type="button"
              className="w-full py-3.5 bg-gather-accent hover:bg-gather-accent-hover text-slate-900 font-bold rounded-xl cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-scale"
              onClick={handleJoin}
              disabled={!roomId.trim()}
            >
              Vào phòng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;

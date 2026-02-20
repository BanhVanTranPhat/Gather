import { useState, useEffect, useRef } from "react";

export interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  userName: string;
  onJoin: () => void;
}

export default function SetupModal({
  isOpen,
  onClose,
  roomId,
  roomName,
  userName,
  onJoin,
}: SetupModalProps) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [displayName, setDisplayName] = useState(() => userName || localStorage.getItem("userName") || "");
  const [cameraBrightness, setCameraBrightness] = useState(50);
  const [micGain, setMicGain] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(userName || localStorage.getItem("userName") || "");
    requestMediaPermissions();
  }, [isOpen, userName]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
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
    if (!navigator.mediaDevices?.getUserMedia) return;
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
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setCameraEnabled(false);
        setMicEnabled(false);
        await enumerateDevices();
      }
    }
  };

  const switchVideoDevice = async (deviceId: string) => {
    if (!deviceId || !navigator.mediaDevices?.getUserMedia) return;
    setSelectedVideoId(deviceId);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: stream ? (selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true) : false,
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
        video: stream ? (selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true) : false,
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
    } else setCameraEnabled(!cameraEnabled);
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    } else setMicEnabled(!micEnabled);
  };

  const handleJoin = () => {
    if (stream && (!cameraEnabled || !micEnabled)) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    const finalName = (displayName || userName || "").trim() || "guest";
    const avatar = finalName.charAt(0).toUpperCase();
    const finalRoomName = roomName || roomId;
    localStorage.setItem("userName", finalName);
    localStorage.setItem("userAvatar", avatar);
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("roomName", finalRoomName);
    localStorage.setItem("cameraEnabled", String(cameraEnabled));
    localStorage.setItem("micEnabled", String(micEnabled));
    onJoin();
  };

  const applyCameraBrightness = async (value: number) => {
    const videoTrack = stream?.getVideoTracks()[0];
    if (!videoTrack?.enabled) return;
    try {
      // brightness is experimental (not in TS MediaTrackConstraintSet)
      const constraints: MediaTrackConstraints =
        value <= 0 ? {} : ({ advanced: [{ brightness: (value / 100) * 2 - 1 }] } as unknown as MediaTrackConstraints);
      await videoTrack.applyConstraints(constraints);
    } catch {
      // ignore if not supported
    }
  };

  const onCameraBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setCameraBrightness(v);
    applyCameraBrightness(v);
  };

  const onMicGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMicGain(Number(e.target.value));
    // Gain applied at publish time via WebRTC; here we only store for UI consistency
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-gather-hero border border-white/10 shadow-2xl overflow-hidden text-white">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold">Chuẩn bị camera & micro</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="font-semibold text-white">Phòng:</span>
            <span>{roomName || roomId}</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
            <div className="relative aspect-video bg-slate-900">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  type="button"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    cameraEnabled ? "bg-emerald-500/90 text-white" : "bg-white/10 text-slate-400 hover:bg-white/15"
                  }`}
                  onClick={toggleCamera}
                >
                  {cameraEnabled ? "Camera bật" : "Camera tắt"}
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    micEnabled ? "bg-emerald-500/90 text-white" : "bg-white/10 text-slate-400 hover:bg-white/15"
                  }`}
                  onClick={toggleMic}
                >
                  {micEnabled ? "Micro bật" : "Micro tắt"}
                </button>
              </div>
            </div>
            <div className="px-3 py-3 border-t border-white/5 space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tên của bạn"
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-gather-accent/50"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Camera</span>
                  {videoDevices.length > 1 ? (
                    <select
                      value={selectedVideoId}
                      onChange={(e) => switchVideoDevice(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                    >
                      {videoDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${videoDevices.indexOf(d) + 1}`}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-500 text-sm">Mặc định</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Độ sáng</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cameraBrightness}
                      onChange={onCameraBrightnessChange}
                      className="flex-1 h-2 rounded-full bg-white/10 accent-gather-accent"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Micro</span>
                  {audioDevices.length > 1 ? (
                    <select
                      value={selectedAudioId}
                      onChange={(e) => switchAudioDevice(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                    >
                      {audioDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Micro ${audioDevices.indexOf(d) + 1}`}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-500 text-sm">Mặc định</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Âm lượng</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={micGain}
                      onChange={onMicGainChange}
                      className="flex-1 h-2 rounded-full bg-white/10 accent-gather-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Camera và micro là tùy chọn. Bạn vẫn có thể vào phòng khi tắt.</p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleJoin}
              className="flex-1 py-2.5 rounded-xl bg-gather-accent hover:bg-gather-accent-hover text-slate-900 font-bold transition"
            >
              Vào phòng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

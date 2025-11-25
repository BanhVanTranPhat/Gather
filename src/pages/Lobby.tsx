import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Lobby.css";

interface SavedRoom {
  id: string;
  name: string;
  lastJoined: number;
}

const Lobby = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
      storedRoomId || `space-${Math.random().toString(36).substring(2, 8)}`
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

  const requestMediaPermissions = async () => {
    // Check if mediaDevices API is available
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
    } catch (error: any) {
      // Only log error, don't show alert - allow user to continue without media
      if (error.name === "NotFoundError") {
        console.warn(
          "No media devices found. You can continue without camera/microphone."
        );
      } else if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        console.warn(
          "Media permissions denied. You can continue without camera/microphone."
        );
      } else {
        console.warn("Error accessing media devices:", error.message || error);
      }
      // Set defaults to allow user to continue
      setCameraEnabled(false);
      setMicEnabled(false);
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
    <div className="lobby-page">
      <div className="lobby-container">
        <div className="lobby-header">
          <div>
            <p className="lobby-kicker">Join your gathering</p>
            <h1>Chuẩn bị trước khi vào phòng</h1>
            <p>Kiểm tra thiết bị và chọn không gian làm việc của bạn.</p>
          </div>
          <div className="lobby-summary">
            <div className="summary-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4>{userName}</h4>
              <p>{userEmail}</p>
            </div>
          </div>
        </div>

        <div className="lobby-content">
          <div className="lobby-section">
            <label>Thông tin của bạn</label>
            <div className="info-card">
              <div className="info-row">
                <span>Tên hiển thị</span>
                <strong>{userName}</strong>
              </div>
              <div className="info-row">
                <span>Email</span>
                <strong>{userEmail || "Chưa có email"}</strong>
              </div>
            </div>
          </div>

          <div className="lobby-section">
            <label>Chọn hoặc tạo phòng</label>
            <div className="room-input-group">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Nhập Room ID"
                className="room-input"
              />
              <button
                type="button"
                className="room-create"
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
              className="room-name-input"
            />
            {savedRooms.length > 0 && (
              <div className="recent-rooms">
                <span>Phòng đã tạo:</span>
                <div className="saved-room-grid">
                  {savedRooms.map((room) => (
                    <button
                      key={room.id}
                      className={`saved-room-card ${
                        room.id === roomId ? "active" : ""
                      }`}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <div className="saved-room-name">{room.name}</div>
                      <div className="saved-room-id">{room.id}</div>
                      <div className="saved-room-time">
                        {new Date(room.lastJoined).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lobby-section">
            <label>Camera & Microphone</label>
            <div className="media-preview">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="preview-video"
              />
              <div className="media-controls">
                <button
                  className={`media-btn ${
                    cameraEnabled ? "enabled" : "disabled"
                  }`}
                  onClick={toggleCamera}
                >
                  {cameraEnabled ? "📹" : "📷"}
                  <span>{cameraEnabled ? "Camera Bật" : "Camera Tắt"}</span>
                </button>
                <button
                  className={`media-btn ${micEnabled ? "enabled" : "disabled"}`}
                  onClick={toggleMic}
                >
                  {micEnabled ? "🎤" : "🔇"}
                  <span>{micEnabled ? "Micro Bật" : "Micro Tắt"}</span>
                </button>
              </div>
            </div>
            <p className="media-hint">
              Camera và microphone là tùy chọn. Bạn có thể tắt chúng và vẫn vào
              phòng được.
            </p>
          </div>

          <button
            className="join-button"
            onClick={handleJoin}
            disabled={!roomId.trim()}
          >
            Join the Gathering
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;

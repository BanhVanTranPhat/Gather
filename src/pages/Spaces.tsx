import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Spaces.css";

interface SavedRoom {
  id: string;
  name: string;
  lastJoined: number;
}

const Spaces = () => {
  const [rooms, setRooms] = useState<SavedRoom[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      navigate("/login", { replace: true });
      return;
    }
    const stored = localStorage.getItem("savedRooms");
    if (stored) {
      try {
        setRooms(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse saved rooms", error);
      }
    }
  }, [navigate]);

  const handleJoinRoom = (room: SavedRoom) => {
    localStorage.setItem("roomId", room.id);
    localStorage.setItem("roomName", room.name);
    navigate("/lobby");
  };

  const handleCreateNew = () => {
    navigate("/lobby");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    navigate("/login", { replace: true });
  };

  return (
    <div className="spaces-page">
      <header className="spaces-header">
        <div>
          <p className="spaces-kicker">Your spaces</p>
          <h1>Chọn một không gian để tiếp tục</h1>
          <p>Danh sách các phòng bạn đã tạo hoặc tham gia gần đây.</p>
        </div>
        <div className="spaces-actions">
          <button className="spaces-create" onClick={handleCreateNew}>
            + Tạo / Tham gia phòng mới
          </button>
          <button className="spaces-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {rooms.length === 0 ? (
        <div className="spaces-empty">
          <h3>Chưa có phòng nào</h3>
          <p>Bắt đầu bằng cách tạo hoặc tham gia một phòng mới.</p>
          <button className="spaces-create" onClick={handleCreateNew}>
            Tạo phòng đầu tiên
          </button>
        </div>
      ) : (
        <div className="spaces-grid">
          {rooms.map((room) => (
            <div key={room.id} className="space-card">
              <div className="space-card-body">
                <div className="space-icon">{room.name.charAt(0)}</div>
                <div>
                  <h3>{room.name}</h3>
                  <p>{room.id}</p>
                </div>
              </div>
              <div className="space-card-footer">
                <span>
                  Lần cuối: {new Date(room.lastJoined).toLocaleString()}
                </span>
                <button onClick={() => handleJoinRoom(room)}>Vào phòng</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Spaces;


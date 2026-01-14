import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen py-12 px-16 bg-gradient-to-br from-indigo-50 to-pink-50 font-['Inter',sans-serif] max-md:px-6 max-md:py-8">
      <header className="flex justify-between items-start gap-8 mb-8 max-md:flex-col">
        <div>
          <p className="uppercase tracking-wider text-indigo-600 font-semibold mb-2">Your spaces</p>
          <h1 className="text-4xl font-extrabold m-0 mb-2 text-gray-900">Chọn một không gian để tiếp tục</h1>
          <p className="m-0 text-gray-600">Danh sách các phòng bạn đã tạo hoặc tham gia gần đây.</p>
        </div>
        <div className="flex gap-3 max-md:w-full max-md:flex-col">
          <button className="px-6 py-3 border-none rounded-[10px] bg-gray-900 text-white font-semibold cursor-pointer transition-opacity hover:opacity-90" onClick={handleCreateNew}>
            + Tạo / Tham gia phòng mới
          </button>
          <button className="px-6 py-3 rounded-[10px] border border-gray-300 bg-white font-semibold cursor-pointer transition-colors hover:border-red-500 hover:text-red-500" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {rooms.length === 0 ? (
        <div className="mt-16 text-center bg-white p-12 rounded-3xl border border-dashed border-gray-300 max-md:mt-8 max-md:p-8">
          <h3 className="text-xl font-semibold mb-2 text-gray-900">Chưa có phòng nào</h3>
          <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo hoặc tham gia một phòng mới.</p>
          <button className="px-6 py-3 border-none rounded-[10px] bg-gray-900 text-white font-semibold cursor-pointer transition-opacity hover:opacity-90" onClick={handleCreateNew}>
            Tạo phòng đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-[20px] p-6 shadow-[0_20px_40px_rgba(15,23,42,0.1)] flex flex-col justify-between gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                  {room.name.charAt(0)}
                </div>
                <div>
                  <h3 className="m-0 text-xl text-gray-900">{room.name}</h3>
                  <p className="m-0 mt-1 text-gray-600 text-sm">{room.id}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Lần cuối: {new Date(room.lastJoined).toLocaleString()}
                </span>
                <button className="border-none bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold transition-opacity hover:opacity-85" onClick={() => handleJoinRoom(room)}>Vào phòng</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Spaces;


import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, FileText, Video, Star, Filter, Home } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Trang Thư viện - hiển thị resources (guides, ebooks, courses).
 * Hiện tại dùng placeholder vì backend chưa có /api/resources.
 * Có thể tích hợp API từ the-gathering sau.
 */
export default function Library() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<
    Array<{
      _id: string;
      title: string;
      author?: string;
      content_type: string;
      thumbnail_url?: string;
      url?: string;
      description?: string;
    }>
  >([]);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

  const filters = [
    { label: "Tất cả", value: "all" },
    { label: "Hướng dẫn", value: "guide" },
    { label: "Sách điện tử", value: "ebook" },
    { label: "Khóa học", value: "course" },
    { label: "Video", value: "video" },
    { label: "Âm thanh", value: "audio" },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      const matchesType = activeType === "all" || r.content_type === activeType;
      if (!matchesType) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        String(r.author || "").toLowerCase().includes(q)
      );
    });
  }, [resources, search, activeType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url = new URL(`${serverUrl}/api/resources`);
        url.searchParams.set("approved", "true");
        const res = await fetch(url.toString());
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to load resources");
        if (!cancelled) setResources(Array.isArray(data.resources) ? data.resources : []);
      } catch (e) {
        console.warn("Failed to load resources:", e);
        if (!cancelled) setResources([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUrl]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-white/60 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors font-medium text-sm"
            >
              <Home size={18} />
              Trở về Trang chủ
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Thư viện
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Khám phá tài liệu, sách và khóa học
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <Filter className="w-4 h-4 mr-2" /> Loại nội dung
                </h3>
                <div className="space-y-2">
                  {filters.map((filter) => (
                    <label
                      key={filter.value}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="type"
                        checked={activeType === filter.value}
                        onChange={() => setActiveType(filter.value)}
                        className="form-radio text-teal-600 focus:ring-teal-500 w-4 h-4 border-gray-300 dark:border-gray-600"
                      />
                      <span
                        className={`text-sm ${
                          activeType === filter.value
                            ? "text-teal-700 dark:text-teal-400 font-bold"
                            : "text-gray-600 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400"
                        }`}
                      >
                        {filter.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Content Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-20 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Đang tải thư viện...
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-20 text-center border border-gray-200 dark:border-gray-700 border-dashed">
                  <div className="bg-teal-50 dark:bg-teal-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                    <BookOpen size={40} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                    Chưa có tài liệu nào
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Admin cần duyệt tài liệu trước khi hiển thị. Bạn có thể thử tìm kiếm lại sau.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filtered.map((r) => (
                    <motion.a
                      key={r._id}
                      href={r.url || "#"}
                      target={r.url ? "_blank" : undefined}
                      rel={r.url ? "noreferrer" : undefined}
                      className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                    >
                      <div className="h-40 bg-slate-100 dark:bg-gray-700">
                        {r.thumbnail_url ? (
                          <img
                            src={r.thumbnail_url}
                            alt={r.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <BookOpen size={28} />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
                          {r.content_type}
                        </div>
                        <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                          {r.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {r.author || "—"}
                        </div>
                        {r.description ? (
                          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                            {r.description}
                          </p>
                        ) : null}
                      </div>
                    </motion.a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

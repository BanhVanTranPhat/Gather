import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Filter, Home, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getServerUrl } from "../config/env";

interface LibraryProps {
  embedded?: boolean;
  onBack?: () => void;
}

/**
 * Trang Thư viện - hiển thị resources (guides, ebooks, courses).
 * Hiện tại dùng placeholder vì backend chưa có /api/resources.
 * Có thể tích hợp API từ the-gathering sau.
 */
export default function Library({ embedded, onBack }: LibraryProps = {}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("all");
  const [page, setPage] = useState(1);
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
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  const serverUrl = getServerUrl();
  const limit = 12;

  const filters = [
    { label: "Tất cả", value: "all" },
    { label: "Hướng dẫn", value: "guide" },
    { label: "Sách điện tử", value: "ebook" },
    { label: "Khóa học", value: "course" },
    { label: "Video", value: "video" },
    { label: "Âm thanh", value: "audio" },
  ];

  // Debounce search to avoid API call on every keystroke
  const [searchDebounced, setSearchDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [searchDebounced, activeType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url = new URL(`${serverUrl}/api/resources`);
        url.searchParams.set("approved", "true");
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));
        if (activeType !== "all") url.searchParams.set("type", activeType);
        if (searchDebounced) url.searchParams.set("q", searchDebounced);
        const res = await fetch(url.toString());
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to load resources");
        if (!cancelled) {
          setResources(Array.isArray(data.resources) ? data.resources : []);
          setPagination(data.pagination || { page: 1, limit, total: 0, pages: 1 });
        }
      } catch (e) {
        console.warn("Failed to load resources:", e);
        if (!cancelled) {
          setResources([]);
          setPagination((p) => ({ ...p, total: 0, pages: 1 }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUrl, page, limit, activeType, searchDebounced]);

  const handleBack = () => (embedded && onBack ? onBack() : navigate("/"));

  const typeColors: Record<string, string> = {
    guide: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    ebook: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    course: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    video: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    audio: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-900 ${embedded ? "min-h-0 rounded-2xl border border-slate-200/80 dark:border-gray-700/80" : "h-screen"}`}>
      {/* Header nhỏ 60–80px, breadcrumb, focus content */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-800/90 backdrop-blur-sm border-b border-slate-200/80 dark:border-gray-700/80 rounded-t-2xl">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {!embedded && (
              <>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-gather-accent transition-colors text-sm font-medium shrink-0"
                >
                  <Home size={16} />
                  Trang chủ
                </button>
                <span className="text-slate-400 dark:text-slate-500">/</span>
              </>
            )}
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate" style={{ letterSpacing: "-0.02em" }}>
              Thư viện
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Khám phá tài liệu, sách và khóa học</p>
        </div>
      </header>

      {/* Main Content – spacing 24px */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative w-full max-w-md mb-6">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-gather-accent/30 focus:border-gather-accent outline-none transition-all"
            />
          </div>

          <div className="flex gap-6">
            {/* Sidebar Filters – border nhẹ */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="bg-slate-50 dark:bg-gray-800/60 rounded-xl p-5 border border-slate-200/60 dark:border-gray-700/60">
                <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Filter size={14} /> Loại nội dung
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
                        className="form-radio text-gather-accent focus:ring-gather-accent w-4 h-4 border-gray-300 dark:border-gray-600"
                      />
                      <span
                        className={`text-sm ${
                          activeType === filter.value
                            ? "text-gather-accent font-bold"
                            : "text-gray-600 dark:text-gray-400 group-hover:text-gather-accent"
                        }`}
                      >
                        {filter.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Content Grid – card: thumbnail, tag, title, description 2 lines, author • date, CTA */}
            <div className="flex-1">
              {loading ? (
                <div className="rounded-2xl p-16 text-center border border-slate-200/60 dark:border-gray-700/60 bg-slate-50 dark:bg-gray-800/40">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải thư viện...</p>
                </div>
              ) : resources.length === 0 ? (
                <div className="rounded-2xl p-16 text-center border border-dashed border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/40">
                  <div className="w-16 h-16 rounded-2xl bg-gather-accent/10 dark:bg-gather-accent/20 flex items-center justify-center mx-auto mb-5">
                    <BookOpen size={32} className="text-gather-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2" style={{ letterSpacing: "-0.02em" }}>Chưa có tài liệu nào</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Thử đổi bộ lọc hoặc từ khóa. Admin cần duyệt tài liệu trước khi hiển thị.</p>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {resources.map((r) => (
                    <motion.a
                      key={r._id}
                      href={r.url || "#"}
                      target={r.url ? "_blank" : undefined}
                      rel={r.url ? "noreferrer" : undefined}
                      className="group bg-white dark:bg-gray-800 rounded-xl border border-slate-200/80 dark:border-gray-700/80 overflow-hidden card-hover"
                    >
                      <div className="h-36 bg-slate-100 dark:bg-gray-700">
                        {r.thumbnail_url ? (
                          <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <BookOpen size={24} />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider rounded-md px-2 py-0.5 ${typeColors[r.content_type] || "bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-slate-400"}`}>
                          {r.content_type}
                        </span>
                        <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white line-clamp-2" style={{ letterSpacing: "-0.02em" }}>{r.title}</h3>
                        {r.description && (
                          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{r.description}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{r.author || "—"}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gather-accent group-hover:underline">
                          {r.url ? "Xem / Tải" : "Chi tiết"}
                          <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </div>
                    </motion.a>
                  ))}
                </div>
                {pagination.pages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-600 text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-gray-800"
                    >
                      Trước
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {page} / {pagination.pages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-600 text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-gray-800"
                    >
                      Sau
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

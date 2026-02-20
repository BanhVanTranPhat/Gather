import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar, { type AdminView } from "../components/AdminSidebar";
import PortalSettingsModal from "../components/PortalSettingsModal";
import AdminRooms from "./AdminRooms";
import AdminUsers from "./AdminUsers";
import AdminLibrary from "./AdminLibrary";
import { clearAuthStorage, getServerUrl, getStoredUser, getToken } from "../shared/storage";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);

  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    eventTypeCounts: { _id: string; count: number }[];
    uniqueUsers: number;
    uniqueSessions: number;
    topEvents: { _id: string; count: number }[];
  } | null>(null);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/", { replace: true });
  };

  const serverUrl = getServerUrl();
  const token = getToken();

  const loadAnalytics = async () => {
    if (analyticsLoading) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await fetch(`${serverUrl}/api/analytics/summary`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load analytics");
      setAnalyticsSummary({
        eventTypeCounts: data.eventTypeCounts || [],
        uniqueUsers: data.uniqueUsers || 0,
        uniqueSessions: data.uniqueSessions || 0,
        topEvents: data.topEvents || [],
      });
    } catch (e) {
      setAnalyticsError((e as Error).message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gather-hero flex overflow-hidden relative">
      {/* Background – cùng hệ màu với dashboard (gather-hero / slate) */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(34,197,94,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gather-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <AdminSidebar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <PortalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-8 md:p-10 overflow-y-auto z-10">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              {activeView === "overview"
                ? "System Analytics"
                : activeView === "rooms"
                  ? "Rooms Moderation"
                  : activeView === "users"
                    ? "User Management"
                    : "Library Management"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-gather-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                System Online
              </span>
            </div>
          </div>
        </header>

        {activeView === "rooms" ? (
          <AdminRooms />
        ) : activeView === "users" ? (
          <AdminUsers />
        ) : activeView === "library" ? (
          <AdminLibrary />
        ) : activeView === "overview" ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 md:p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
                      Traffic Overview (last 90 days)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tổng quan sự kiện được track qua /api/analytics
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadAnalytics}
                    className="px-4 py-2 rounded-xl bg-gather-accent hover:bg-gather-accent-hover text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={analyticsLoading}
                  >
                    {analyticsLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {analyticsError && (
                  <div className="mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-xl px-3 py-2 text-left">
                    {analyticsError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Unique Users", value: analyticsSummary?.uniqueUsers ?? "—" },
                    { label: "Sessions", value: analyticsSummary?.uniqueSessions ?? "—" },
                    {
                      label: "Total Events",
                      value: analyticsSummary
                        ? analyticsSummary.eventTypeCounts.reduce((sum, e) => sum + (e.count || 0), 0)
                        : "—",
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 transition-all duration-200 hover:border-slate-600/50 hover:bg-slate-800/70"
                    >
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {card.label}
                      </p>
                      <p className="text-2xl font-black text-white tracking-tight">{card.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Events by type
                    </p>
                    <div className="space-y-3">
                      {(analyticsSummary?.eventTypeCounts || []).map((t) => {
                        const total =
                          analyticsSummary?.eventTypeCounts.reduce((sum, e) => sum + (e.count || 0), 0) || 0;
                        const pct = total ? Math.round((t.count / total) * 100) : 0;
                        return (
                          <div
                            key={t._id}
                            className="flex items-center gap-3 text-xs text-slate-300 group"
                            title={`${t._id || "unknown"}: ${t.count} events (${pct}%)`}
                          >
                            <span className="w-28 font-mono text-[11px] uppercase tracking-wider text-slate-400 truncate">
                              {t._id || "unknown"}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gather-accent transition-all duration-500 ease-out min-w-[4px]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-[11px] text-slate-400 font-medium tabular-nums">
                              {t.count}
                            </span>
                          </div>
                        );
                      })}
                      {(!analyticsSummary ||
                        (analyticsSummary.eventTypeCounts || []).length === 0) &&
                        !analyticsLoading && (
                          <p className="text-xs text-slate-500">Chưa có dữ liệu analytics đủ để hiển thị.</p>
                        )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Top events
                    </p>
                    <div className="space-y-2">
                      {(analyticsSummary?.topEvents || []).map((e) => (
                        <div
                          key={e._id}
                          className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 transition-all duration-200 hover:border-slate-600/50 hover:bg-slate-800/70"
                          title={`${e._id}: ${e.count} lần`}
                        >
                          <span className="truncate max-w-[180px] font-mono">{e._id}</span>
                          <span className="text-[11px] text-slate-400 font-bold tabular-nums">{e.count}</span>
                        </div>
                      ))}
                      {(!analyticsSummary || (analyticsSummary.topEvents || []).length === 0) &&
                        !analyticsLoading && (
                          <p className="text-xs text-slate-500">Chưa có event nào được track đủ nổi bật.</p>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[300px] bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2 tracking-tight">Moderation Shortcuts</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Truy cập nhanh các khu vực moderation.
                  </p>
                  <div className="space-y-2">
                    {[
                      { view: "rooms" as const, label: "Rooms Management" },
                      { view: "users" as const, label: "User Management" },
                      { view: "library" as const, label: "Library Management" },
                    ].map(({ view, label }) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setActiveView(view)}
                        className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/50 text-xs text-slate-200 font-semibold flex items-center justify-between transition-all duration-200"
                      >
                        <span>{label}</span>
                        <span className="text-[10px] text-slate-500 font-mono">→</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 text-[11px] text-slate-500 border-t border-slate-700/60 pt-4">
                  Analytics từ collection <code className="text-slate-400">Analytics</code> (TTL 90 ngày). Page view & user action được track từ frontend.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}


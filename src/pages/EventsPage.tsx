import { useMemo, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { useEvents } from "../contexts/EventContext";
import EventModal from "../components/modals/EventModal";

export default function EventsPage() {
  const { events, loading, fetchEvents } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const sorted = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [events]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-obsidian font-sans text-slate-100 overflow-hidden relative selection:bg-violet-500/30">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-obsidian-light/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center border border-violet-500/20">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-lg font-black">Events</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Booking & reminders
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => fetchEvents()}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-bold"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 transition text-sm font-black"
          >
            <Plus size={16} />
            New event
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-slate-400">Loading events...</div>
        ) : sorted.length === 0 ? (
          <div className="p-10 rounded-3xl border border-white/10 bg-white/3 text-center">
            <div className="text-slate-300 font-black text-xl">No events yet</div>
            <div className="text-slate-500 mt-2">
              Create your first event for this space.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((e: any) => (
              <button
                key={e.eventId}
                type="button"
                onClick={() => {
                  setSelected(e);
                  setIsOpen(true);
                }}
                className="text-left p-5 rounded-3xl border border-white/10 bg-white/3 hover:bg-white/6 transition"
              >
                <div className="text-xs text-violet-300 font-black uppercase tracking-widest">
                  {new Date(e.startTime).toLocaleString()}
                </div>
                <div className="mt-2 text-lg font-black text-white">{e.title}</div>
                <div className="mt-1 text-sm text-slate-400 line-clamp-2">
                  {e.description || "—"}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {e.location ? `📍 ${e.location}` : "📍 (no location)"} •{" "}
                  {(e.attendees?.length || 0)} attendees
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <EventModal
          event={selected}
          onClose={() => {
            setIsOpen(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}


import { useMemo, useState } from "react";
import { Calendar, Plus, Bookmark } from "lucide-react";
import { useEvents } from "../contexts/EventContext";
import EventModal from "../components/modals/EventModal";
import { EventCard, EventCalendar, MyBookings } from "../features/events";

interface EventsPageProps {
  embedded?: boolean;
  onBack?: () => void;
}

type EventsTab = "all" | "bookings";

export default function EventsPage({ embedded, onBack }: EventsPageProps = {}) {
  const { events, myBookings, loading, fetchEvents } = useEvents();
  const [tab, setTab] = useState<EventsTab>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const sorted = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [events]);

  const eventsInMonth = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    return sorted.filter((e) => {
      const d = new Date(e.startTime);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [sorted, calendarMonth]);

  return (
    <div className={`flex-1 flex flex-col bg-gather-hero font-sans text-slate-100 overflow-hidden relative selection:bg-gather-accent/30 ${embedded ? "min-h-0 rounded-2xl border border-white/10" : "h-screen"}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gather-hero-end/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gather-accent/15 text-gather-accent flex items-center justify-center border border-gather-accent/20">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-lg font-black">Sự kiện</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Lịch & Đăng ký
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchEvents()}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-bold"
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gather-accent hover:bg-gather-accent-hover transition text-sm font-black"
          >
            <Plus size={16} />
            Tạo sự kiện
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10 px-4">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "all"
              ? "border-gather-accent text-gather-accent"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setTab("bookings")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            tab === "bookings"
              ? "border-gather-accent text-gather-accent"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Bookmark size={16} />
          Đăng ký của tôi
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "bookings" ? (
          <MyBookings
            onOpenEvent={(e) => {
              setSelected(e);
              setIsOpen(true);
            }}
            selectedEvent={selected}
            onCloseEvent={() => {
              setIsOpen(false);
              setSelected(null);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <EventCalendar
                events={eventsInMonth}
                currentMonth={calendarMonth}
                onSelectDate={(date) => setCalendarMonth(date)}
                onSelectEvent={(e) => {
                  setSelected(e);
                  setIsOpen(true);
                }}
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-medium"
                >
                  Tháng trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-medium"
                >
                  Tháng sau
                </button>
              </div>
            </div>
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-slate-400">Đang tải...</div>
              ) : sorted.length === 0 ? (
                <div className="p-10 rounded-2xl border border-white/10 bg-white/5 text-center">
                  <div className="text-slate-300 font-bold text-xl">Chưa có sự kiện</div>
                  <div className="text-slate-500 mt-2">Tạo sự kiện đầu tiên cho phòng này.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sorted.map((e: any) => (
                    <EventCard
                      key={e.eventId}
                      event={e}
                      onSelect={() => {
                        setSelected(e);
                        setIsOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
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


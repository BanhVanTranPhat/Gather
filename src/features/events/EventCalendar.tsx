import { useMemo } from "react";

interface EventCalendarProps {
  events: Array<{ eventId: string; startTime: string | Date; title: string }>;
  currentMonth: Date;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: any) => void;
}

export default function EventCalendar({
  events,
  currentMonth,
  onSelectDate,
  onSelectEvent,
}: EventCalendarProps) {
  const { weeks, monthLabel } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const totalCells = startPad + daysInMonth;
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    const monthLabel = currentMonth.toLocaleDateString("vi-VI", {
      month: "long",
      year: "numeric",
    });
    return { weeks, monthLabel };
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    events.forEach((e) => {
      const d = new Date(e.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [events]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 text-lg font-bold text-white">
        {monthLabel}
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        {weeks.map((row, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {row.map((day, di) => {
              if (day === null) {
                return <div key={di} className="aspect-square" />;
              }
              const key = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`;
              const dayEvents = eventsByDay.get(key) || [];
              const isToday =
                new Date().toDateString() ===
                new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
              return (
                <div
                  key={di}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${
                    isToday ? "bg-gather-accent/20 text-gather-accent font-bold" : "text-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSelectDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
                    }
                    className="w-full h-full flex flex-col items-center justify-center rounded-lg hover:bg-white/10"
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gather-accent mt-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {events.length > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-white/10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Sự kiện trong tháng
          </p>
          <ul className="space-y-1">
            {events.slice(0, 5).map((e) => (
              <li key={e.eventId}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(e)}
                  className="text-left text-xs text-slate-300 hover:text-white truncate block w-full"
                >
                  {new Date(e.startTime).toLocaleDateString("vi-VI", { day: "numeric", month: "short" })} – {e.title}
                </button>
              </li>
            ))}
            {events.length > 5 && (
              <li className="text-xs text-slate-500">+{events.length - 5} khác</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

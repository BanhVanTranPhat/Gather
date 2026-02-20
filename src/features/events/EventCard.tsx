import type { Event } from "../../contexts/EventContext";

interface EventCardProps {
  event: Event;
  onSelect: () => void;
}

export default function EventCard({ event, onSelect }: EventCardProps) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const goingCount = event.attendees?.filter((a) => a.status === "going").length ?? 0;
  const maxP = event.maxParticipants ?? 20;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition w-full"
    >
      <div className="text-xs text-gather-accent font-bold uppercase tracking-wider">
        {start.toLocaleDateString("vi-VI")} · {start.toLocaleTimeString("vi-VI", { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString("vi-VI", { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="mt-2 text-lg font-bold text-white">{event.title}</div>
      <div className="mt-1 text-sm text-slate-400 line-clamp-2">
        {event.description || "—"}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        {event.location ? <span>📍 {event.location}</span> : null}
        <span>{goingCount} / {maxP} tham gia</span>
      </div>
    </button>
  );
}

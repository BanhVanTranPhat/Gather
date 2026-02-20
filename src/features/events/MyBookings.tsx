import { useEffect } from "react";
import { useEvents } from "../../contexts/EventContext";
import EventCard from "./EventCard";
import EventModal from "../../components/modals/EventModal";

interface MyBookingsProps {
  onOpenEvent: (event: any) => void;
  selectedEvent: any;
  onCloseEvent: () => void;
}

export default function MyBookings({
  onOpenEvent,
  selectedEvent,
  onCloseEvent,
}: MyBookingsProps) {
  const { myBookings, fetchMyBookings, loading } = useEvents();

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  if (loading && myBookings.length === 0) {
    return (
      <div className="py-8 text-slate-400 text-sm">Đang tải đăng ký của bạn...</div>
    );
  }

  if (myBookings.length === 0) {
    return (
      <div className="py-10 rounded-2xl border border-white/10 bg-white/5 text-center">
        <p className="text-slate-400 font-medium">Bạn chưa đăng ký sự kiện nào.</p>
        <p className="text-slate-500 text-sm mt-1">Vào tab Sự kiện để đăng ký.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {myBookings.map((event: any) => (
        <EventCard
          key={event.eventId}
          event={event}
          onSelect={() => onOpenEvent(event)}
        />
      ))}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={onCloseEvent}
        />
      )}
    </div>
  );
}

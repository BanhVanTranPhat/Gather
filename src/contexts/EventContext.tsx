import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";

export interface Event {
  eventId: string;
  roomId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  attendees: Array<{
    userId: string;
    username: string;
    status: "going" | "maybe" | "not_going";
  }>;
  location: string;
  isRecurring: boolean;
  recurrencePattern?: string;
}

interface EventContextType {
  events: Event[];
  loading: boolean;
  fetchEvents: () => Promise<void>;
  createEvent: (event: Partial<Event>) => Promise<Event | null>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  rsvpEvent: (eventId: string, status: "going" | "maybe" | "not_going") => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvents must be used within EventProvider");
  }
  return context;
};

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider = ({ children }: EventProviderProps) => {
  const { currentUser } = useSocket();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    const roomId = localStorage.getItem("roomId") || "default-room";
    if (!roomId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
        }/api/events/room/${roomId}`
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = async (event: Partial<Event>): Promise<Event | null> => {
    const roomId = localStorage.getItem("roomId") || "default-room";
    if (!currentUser || !roomId) return null;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
        }/api/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...event,
            roomId,
            createdBy: currentUser.userId,
          }),
        }
      );

      if (response.ok) {
        const newEvent = await response.json();
        await fetchEvents();
        return newEvent;
      }
      return null;
    } catch (error) {
      console.error("Error creating event:", error);
      return null;
    }
  };

  const updateEvent = async (
    eventId: string,
    updates: Partial<Event>
  ): Promise<void> => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
        }/api/events/${eventId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        await fetchEvents();
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
        }/api/events/${eventId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchEvents();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const rsvpEvent = async (
    eventId: string,
    status: "going" | "maybe" | "not_going"
  ): Promise<void> => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
        }/api/events/${eventId}/rsvp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.userId,
            username: currentUser.username,
            status,
          }),
        }
      );

      if (response.ok) {
        await fetchEvents();
      }
    } catch (error) {
      console.error("Error RSVPing event:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        rsvpEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

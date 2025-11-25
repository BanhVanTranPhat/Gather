import Event from "../models/Event.js";

// Get events for a room
export const getEventsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { roomId };

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const events = await Event.find(query).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create event
export const createEvent = async (req, res) => {
  try {
    const {
      roomId,
      title,
      description,
      startTime,
      endTime,
      createdBy,
      location,
      isRecurring,
      recurrencePattern,
    } = req.body;

    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const event = new Event({
      eventId,
      roomId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      createdBy,
      location,
      isRecurring: isRecurring || false,
      recurrencePattern: recurrencePattern || null,
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (updates.title) event.title = updates.title;
    if (updates.description !== undefined) event.description = updates.description;
    if (updates.startTime) event.startTime = new Date(updates.startTime);
    if (updates.endTime) event.endTime = new Date(updates.endTime);
    if (updates.location !== undefined) event.location = updates.location;

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// RSVP to event
export const rsvpEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, username, status } = req.body;

    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const attendeeIndex = event.attendees.findIndex(
      (a) => a.userId === userId
    );

    if (attendeeIndex >= 0) {
      event.attendees[attendeeIndex].status = status;
    } else {
      event.attendees.push({ userId, username, status });
    }

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOneAndDelete({ eventId });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

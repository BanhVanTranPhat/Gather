/**
 * Event reminder script – gửi email nhắc nhở cho các event diễn ra trong 1 giờ tới.
 * Chạy bằng cron hoặc thủ công: npx tsx backend/scripts/eventReminder.ts
 *
 * Implemented automated reminder system using scheduled job.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendEventReminder } from "../utils/email.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/gather";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const events = await Event.find({
    startTime: { $gte: now, $lte: inOneHour },
    "attendees.status": "going",
  }).lean();

  for (const event of events) {
    const goingAttendees = (event.attendees || []).filter(
      (a: any) => a.status === "going"
    );
    for (const att of goingAttendees) {
      try {
        const user = await User.findById(att.userId).select("email").lean();
        if (user?.email) {
          await sendEventReminder(user.email, {
            eventId: event.eventId,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
          });
        }
      } catch (e) {
        console.error("Reminder send failed for", att.userId, e);
      }
    }
  }

  await mongoose.disconnect();
  console.log("Event reminder run done. Events in next 1h:", events.length);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

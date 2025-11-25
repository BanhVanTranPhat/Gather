import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: String, // userId
      required: true,
    },
    attendees: [
      {
        userId: String,
        username: String,
        status: {
          type: String,
          enum: ["going", "maybe", "not_going"],
          default: "maybe",
        },
      },
    ],
    location: {
      type: String,
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ roomId: 1, startTime: 1 });
eventSchema.index({ createdBy: 1 });

export default mongoose.model("Event", eventSchema);

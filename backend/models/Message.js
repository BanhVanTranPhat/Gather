import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["nearby", "global", "dm"],
      default: "global",
    },
    content: {
      type: String,
      required: true,
    },
    targetUserId: {
      type: String,
      default: null,
    },
    recipients: {
      type: [String],
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);



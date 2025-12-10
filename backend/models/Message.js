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
      enum: ["nearby", "global", "dm", "group"],
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
    groupId: {
      type: String,
      default: null,
    },
    channelId: {
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
    editedAt: {
      type: Date,
      default: null,
    },
    replyTo: {
      type: {
        id: String,
        username: String,
        message: String,
      },
      default: null,
    },
    reactions: {
      type: [{
        emoji: String,
        users: [String],
      }],
      default: [],
    },
    attachments: {
      type: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String,
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);

import mongoose from "mongoose";

const objectSchema = new mongoose.Schema(
  {
    objectId: {
      type: String,
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["whiteboard", "video", "website", "image", "document", "game"],
    },
    name: {
      type: String,
      required: true,
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    properties: {
      // For video/website
      url: { type: String, default: "" },
      // For whiteboard
      content: { type: String, default: "" }, // JSON string của canvas data
      // For image
      imageUrl: { type: String, default: "" },
      // For document
      documentUrl: { type: String, default: "" },
      // Common
      width: { type: Number, default: 800 },
      height: { type: Number, default: 600 },
      allowFullscreen: { type: Boolean, default: true },
    },
    createdBy: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
objectSchema.index({ roomId: 1, isActive: 1 });

export default mongoose.model("Object", objectSchema);

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    avatar: {
      type: String,
      default: "default",
    },
    avatarColor: {
      type: String,
      default: "#4f46e5",
    },
    status: {
      type: String,
      default: "Available",
      enum: ["Available", "Busy", "Away", "Do Not Disturb"],
    },
    currentRoom: {
      type: String,
      default: null,
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);

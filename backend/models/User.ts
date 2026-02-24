// ============================================================
// MODEL: User — Mongoose 8+ | TypeScript | 2026
// ============================================================

import {
  Schema,
  model,
  Document,
  Model,
  Types,
  InferSchemaType,
} from "mongoose";

// ─── [1] SCHEMA DEFINITION ───────────────────────────────────
const userSchema = new Schema(
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
    avatarConfig: {
      type: Schema.Types.Mixed,
      default: {},
    },
    avatarColor: {
      type: String,
      default: "#4f46e5",
    },
    displayName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      default: "Available",
      enum: ["Available", "Busy", "Away", "Do Not Disturb"],
    },
    role: {
      type: String,
      default: "member",
      enum: ["admin", "moderator", "member", "guest"],
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
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── [2] TYPES ───────────────────────────────────────────────
type TUserSchema = InferSchemaType<typeof userSchema>;

export interface IUserDocument extends TUserSchema, Document {
  _id: Types.ObjectId;
}

export interface IUserModel extends Model<IUserDocument> {
  // static method signatures can be added here
}

// ─── [3] INDEXES ─────────────────────────────────────────────
userSchema.index({ currentRoom: 1 }); // For room user queries
userSchema.index({ role: 1 }); // For role-based queries
userSchema.index({ lastSeen: -1 }); // For active users queries

// ─── [4] VIRTUALS ────────────────────────────────────────────
// Add virtuals if needed

// ─── [5] INSTANCE METHODS ────────────────────────────────────
// Add instance methods if needed

// ─── [6] STATIC METHODS ──────────────────────────────────────
// Add static methods if needed

// ─── [7] HOOKS ───────────────────────────────────────────────
// Add hooks if needed

// ─── [8] EXPORT ──────────────────────────────────────────────
export const User = model<IUserDocument, IUserModel>("User", userSchema);
export default User;

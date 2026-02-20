import mongoose, { Document, Schema } from "mongoose";

export interface IRoom extends Document {
  roomId: string;
  name: string;
  description: string;
  maxUsers: number;
  isPrivate: boolean;
  isActive: boolean;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    maxUsers: {
      type: Number,
      default: 20, // Chuẩn: 20. Premium: tối đa 50 (call video 20–50 người)
      min: 20,
      max: 50,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
roomSchema.index({ createdBy: 1 }); // For user's rooms queries
roomSchema.index({ isPrivate: 1 }); // For public/private room queries
roomSchema.index({ isActive: 1 }); // For active room queries

export default mongoose.model<IRoom>("Room", roomSchema);


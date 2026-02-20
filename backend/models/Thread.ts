import mongoose, { Document, Schema } from "mongoose";

export interface IThread extends Document {
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  roomId: string;
  postCount: number;
  lastPostAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const threadSchema = new Schema<IThread>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    roomId: { type: String, required: true, index: true },
    postCount: { type: Number, default: 0 },
    lastPostAt: { type: Date },
  },
  { timestamps: true }
);

threadSchema.index({ roomId: 1, updatedAt: -1 });

export default mongoose.model<IThread>("Thread", threadSchema);

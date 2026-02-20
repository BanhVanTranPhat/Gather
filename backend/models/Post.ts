import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  threadId: mongoose.Types.ObjectId;
  body: string;
  authorId: string;
  authorName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const postSchema = new Schema<IPost>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true, index: true },
    body: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
  },
  { timestamps: true }
);

postSchema.index({ threadId: 1, createdAt: 1 });

export default mongoose.model<IPost>("Post", postSchema);

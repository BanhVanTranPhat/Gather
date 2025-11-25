import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
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
      default: 20, // Hỗ trợ tối đa 20 users (có thể tăng qua settings)
      min: 20, // Đảm bảo tối thiểu 20 users
    },
    isPrivate: {
      type: Boolean,
      default: false,
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

export default mongoose.model("Room", roomSchema);

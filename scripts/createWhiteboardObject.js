/**
 * Script để tạo whiteboard object trong database
 * Chạy: node scripts/createWhiteboardObject.js [roomId] [x] [y]
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../backend/.env") });

// Import Object model
const ObjectSchema = new mongoose.Schema({
  objectId: { type: String, required: true, unique: true },
  roomId: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  position: { x: Number, y: Number },
  properties: mongoose.Schema.Types.Mixed,
  createdBy: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Object = mongoose.model("Object", ObjectSchema);

async function createWhiteboardObject() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/gather-town"
    );
    console.log("Connected to MongoDB");

    const roomId = process.argv[2] || "default-room";
    const x = parseInt(process.argv[3]) || 500;
    const y = parseInt(process.argv[4]) || 400;

    console.log(`Creating whiteboard object for room: ${roomId} at (${x}, ${y})`);

    const whiteboard = {
      objectId: `obj-whiteboard-${Date.now()}`,
      roomId,
      type: "whiteboard",
      name: "Collaborative Whiteboard",
      position: { x, y },
      properties: {
        content: "", // Empty initially
        width: 1200,
        height: 800,
      },
      isActive: true,
    };

    const existing = await Object.findOne({
      roomId,
      type: "whiteboard",
      position: { x, y },
    });

    if (existing) {
      console.log("Whiteboard already exists at this position");
      process.exit(0);
    }

    await Object.create(whiteboard);
    console.log(`✅ Whiteboard created successfully!`);
    console.log(`   Object ID: ${whiteboard.objectId}`);
    console.log(`   Position: (${x}, ${y})`);
    console.log(`   Room: ${roomId}`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createWhiteboardObject();


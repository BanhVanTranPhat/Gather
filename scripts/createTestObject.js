/**
 * Script để tạo test objects trong database
 * Chạy: node scripts/createTestObject.js
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

async function createTestObjects() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/gather-town"
    );
    console.log("Connected to MongoDB");

    const roomId = process.argv[2] || "default-room";
    console.log(`Creating test objects for room: ${roomId}`);

    const testObjects = [
      {
        objectId: `obj-${Date.now()}-1`,
        roomId,
        type: "website",
        name: "Google",
        position: { x: 300, y: 200 },
        properties: {
          url: "https://www.google.com",
          width: 800,
          height: 600,
          allowFullscreen: true,
        },
        isActive: true,
      },
      {
        objectId: `obj-${Date.now()}-2`,
        roomId,
        type: "video",
        name: "YouTube Video",
        position: { x: 600, y: 400 },
        properties: {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          width: 800,
          height: 600,
          allowFullscreen: true,
        },
        isActive: true,
      },
      {
        objectId: `obj-${Date.now()}-3`,
        roomId,
        type: "whiteboard",
        name: "Whiteboard",
        position: { x: 900, y: 300 },
        properties: {
          content: "",
          width: 800,
          height: 600,
        },
        isActive: true,
      },
    ];

    for (const obj of testObjects) {
      const existing = await Object.findOne({ objectId: obj.objectId });
      if (!existing) {
        await Object.create(obj);
        console.log(
          `✓ Created: ${obj.name} at (${obj.position.x}, ${obj.position.y})`
        );
      } else {
        console.log(`- Skipped: ${obj.name} (already exists)`);
      }
    }

    console.log("\n✅ Test objects created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createTestObjects();

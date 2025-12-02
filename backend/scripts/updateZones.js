import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Map from "../models/Map.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const updateZones = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const map = await Map.findOne({ roomId: "default-room" });

        if (!map) {
            console.log("Default map not found.");
            process.exit(1);
        }

        const zones = [
            {
                id: "lounge",
                name: "Lounge Area",
                bounds: { x1: 50, y1: 50, x2: 300, y2: 250 },
                maxUsers: 5,
            },
            {
                id: "meeting-a",
                name: "Meeting Room A",
                bounds: { x1: 650, y1: 50, x2: 900, y2: 250 },
                maxUsers: 8,
            },
            {
                id: "work-area",
                name: "Quiet Work Area",
                bounds: { x1: 50, y1: 400, x2: 400, y2: 600 },
                maxUsers: 10,
            }
        ];

        map.zones = zones;
        await map.save();

        console.log("Updated zones:", zones);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

updateZones();

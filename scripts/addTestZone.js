import mongoose from "mongoose";
import dotenv from "dotenv";
import Map from "../backend/models/Map.js";

dotenv.config({ path: "./backend/.env" });

const addTestZone = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Find the default map
        const map = await Map.findOne({ roomId: "default-room" });

        if (!map) {
            console.log("Default map not found. Please run the app first to generate it.");
            process.exit(1);
        }

        console.log("Found map:", map.name);

        // Add a test zone
        const testZone = {
            id: "zone-" + Date.now(),
            name: "Meeting Room A",
            bounds: {
                x1: 200,
                y1: 200,
                x2: 500,
                y2: 500,
            },
            maxUsers: 10,
        };

        map.zones = [testZone];
        await map.save();

        console.log("Added test zone:", testZone);
        console.log("Map updated successfully!");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

addTestZone();

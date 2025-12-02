import mongoose from "mongoose";
import dotenv from "dotenv";
import Map from "../models/Map.js";

dotenv.config({ path: ".env" });

const addTestZone = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Find the default map
        let map = await Map.findOne({ roomId: "default-room" });

        if (!map) {
            console.log("Default map not found. Creating one...");
            map = new Map({
                mapId: "default-map",
                roomId: "default-room",
                name: "Default Map",
                width: 20,
                height: 15,
                tileSize: 32,
                tiles: Array(15).fill(Array(20).fill(0)), // Simple floor
                collision: Array(15).fill(Array(20).fill(false)),
            });
        }

        console.log("Using map:", map.name);

        // Add a test zone
        const testZone = {
            id: "zone-" + Date.now(),
            name: "Meeting Room A",
            bounds: {
                x1: 100,
                y1: 100,
                x2: 300,
                y2: 300,
            },
            maxUsers: 10,
        };

        // Ensure zones array exists
        if (!map.zones) {
            map.zones = [];
        }

        map.zones.push(testZone);
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

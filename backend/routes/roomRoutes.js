import express from "express";
import Room from "../models/Room.js";

const router = express.Router();

// Get room info
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate invite link
router.post("/:roomId/invite", async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    const inviteLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/lobby?room=${roomId}`;
    
    res.json({
      inviteLink,
      roomId: room.roomId,
      roomName: room.name,
      maxUsers: room.maxUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;




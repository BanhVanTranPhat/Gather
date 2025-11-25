import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

router.get("/history/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, type } = req.query;
    const query = { roomId };
    if (type) {
      query.type = type;
    }
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    console.error("Failed to fetch chat history", error);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
});

export default router;



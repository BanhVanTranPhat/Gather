/**
 * Forum routes: threads and posts (thread-based, separate from room chat)
 */
import express from "express";
import { authenticate } from "../middleware/security.js";
import {
  listThreads,
  getThread,
  createThread,
  createPost,
  deleteThread,
  deletePost,
} from "../controllers/forumController.js";

const router = express.Router();

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ message: "Forum routes are working", path: req.path, originalUrl: req.originalUrl });
});

// List threads (optional auth for read; we allow public read, auth for write)
router.get("/threads", (req, res, next) => {
  console.log(`[Forum] GET /threads called, query:`, req.query);
  next();
}, listThreads);
router.get("/threads/:threadId", getThread);

// Create thread / post — require auth
router.post("/threads", authenticate, createThread);
router.post("/threads/:threadId/posts", authenticate, createPost);

// Delete — require auth (controller checks author or admin)
router.delete("/threads/:threadId", authenticate, deleteThread);
router.delete("/posts/:postId", authenticate, deletePost);

export default router;

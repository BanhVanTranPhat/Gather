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

// List threads (optional auth for read; we allow public read, auth for write)
router.get("/threads", listThreads);
router.get("/threads/:threadId", getThread);

// Create thread / post — require auth
router.post("/threads", authenticate, createThread);
router.post("/threads/:threadId/posts", authenticate, createPost);

// Delete — require auth (controller checks author or admin)
router.delete("/threads/:threadId", authenticate, deleteThread);
router.delete("/posts/:postId", authenticate, deletePost);

export default router;

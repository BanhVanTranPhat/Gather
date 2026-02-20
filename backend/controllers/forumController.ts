import { Request, Response } from "express";
import mongoose from "mongoose";
import Thread from "../models/Thread.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const listThreads = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = req.query.roomId as string || "default-room";
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit || DEFAULT_LIMIT), 10)));
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      Thread.find({ roomId }).sort({ lastPostAt: -1, updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Thread.countDocuments({ roomId }),
    ]);

    res.json({
      threads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error("listThreads failed", error as Error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getThread = async (req: Request, res: Response): Promise<void> => {
  try {
    const { threadId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      res.status(400).json({ message: "Invalid thread ID" });
      return;
    }
    const thread = await Thread.findById(threadId).lean();
    if (!thread) {
      res.status(404).json({ message: "Thread not found" });
      return;
    }
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit || DEFAULT_LIMIT), 10)));
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([
      Post.find({ threadId: new mongoose.Types.ObjectId(threadId) }).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments({ threadId: new mongoose.Types.ObjectId(threadId) }),
    ]);

    res.json({
      thread,
      posts,
      pagination: { page, limit, total: totalPosts, pages: Math.ceil(totalPosts / limit) },
    });
  } catch (error) {
    logger.error("getThread failed", error as Error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const createThread = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const { title, body, roomId } = req.body;
    const user = await User.findById(userId).select("displayName username").lean();
    const authorName = (user?.displayName || (user as any)?.username || "user").trim() || "user";

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ message: "Title is required" });
      return;
    }

    const thread = await Thread.create({
      title: title.trim(),
      body: (body || "").trim(),
      authorId: userId,
      authorName,
      roomId: (roomId || "default-room").trim(),
      postCount: 0,
    });

    res.status(201).json(thread);
  } catch (error) {
    logger.error("createThread failed", error as Error);
    res.status(400).json({ message: (error as Error).message });
  }
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const { threadId } = req.params;
    const { body } = req.body;
    const user = await User.findById(userId).select("displayName username").lean();
    const authorName = (user?.displayName || (user as any)?.username || "user").trim() || "user";

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      res.status(400).json({ message: "Invalid thread ID" });
      return;
    }
    if (!body || typeof body !== "string" || !body.trim()) {
      res.status(400).json({ message: "Body is required" });
      return;
    }

    const thread = await Thread.findById(threadId);
    if (!thread) {
      res.status(404).json({ message: "Thread not found" });
      return;
    }

    const post = await Post.create({
      threadId: new mongoose.Types.ObjectId(threadId),
      body: body.trim(),
      authorId: userId,
      authorName: authorName.trim() || "user",
    });

    thread.postCount = (thread.postCount || 0) + 1;
    thread.lastPostAt = new Date();
    await thread.save();

    res.status(201).json(post);
  } catch (error) {
    logger.error("createPost failed", error as Error);
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteThread = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const user = await User.findById(userId).select("role").lean();
    const isAdmin = (user as any)?.role === "admin";
    const { threadId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      res.status(400).json({ message: "Invalid thread ID" });
      return;
    }

    const thread = await Thread.findById(threadId);
    if (!thread) {
      res.status(404).json({ message: "Thread not found" });
      return;
    }

    if (thread.authorId !== userId && !isAdmin) {
      res.status(403).json({ message: "Forbidden: only author or admin can delete" });
      return;
    }

    await Post.deleteMany({ threadId: new mongoose.Types.ObjectId(threadId) });
    await Thread.findByIdAndDelete(threadId);
    res.json({ message: "Thread deleted" });
  } catch (error) {
    logger.error("deleteThread failed", error as Error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const user = await User.findById(userId).select("role").lean();
    const isAdmin = (user as any)?.role === "admin";
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.authorId !== userId && !isAdmin) {
      res.status(403).json({ message: "Forbidden: only author or admin can delete" });
      return;
    }

    const thread = await Thread.findById(post.threadId);
    if (thread) {
      thread.postCount = Math.max(0, (thread.postCount || 1) - 1);
      await thread.save();
    }
    await Post.findByIdAndDelete(postId);
    res.json({ message: "Post deleted" });
  } catch (error) {
    logger.error("deletePost failed", error as Error);
    res.status(500).json({ message: (error as Error).message });
  }
};

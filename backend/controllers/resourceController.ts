import { Request, Response } from "express";
import Resource from "../models/Resource.js";

/** List resources for a room. Optionally include global (roomId null) with ?global=1 */
export const listResourcesByRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = req.params.roomId as string;
    const includeGlobal = String(req.query.global || "").toLowerCase() === "1" || String(req.query.global).toLowerCase() === "true";
    const { q, type, approved = "true", limit = "50", page = "1" } = req.query;
    const take = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const query: Record<string, unknown> = includeGlobal
      ? { $or: [{ roomId: roomId }, { roomId: null }, { roomId: { $exists: false } }] }
      : { roomId: roomId || null };
    if (String(approved) === "true") (query as Record<string, boolean>).isApproved = true;
    if (type && type !== "all") (query as Record<string, string>).content_type = String(type);
    if (q && String(q).trim().length > 1) (query as Record<string, unknown>).$text = { $search: String(q).trim() };

    let items: unknown[];
    let total: number;
    const pageNum = Math.max(1, Number(page) || 1);
    try {
      [items, total] = await Promise.all([
        Resource.find(query)
          .sort(q ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 })
          .skip(skip)
          .limit(take)
          .lean(),
        Resource.countDocuments(query),
      ]);
    } catch {
      if ((query as Record<string, unknown>).$text) {
        delete (query as Record<string, unknown>).$text;
        const qStr = String(q).trim().replace(/\s+/g, " ").split(" ").map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        if (qStr) (query as Record<string, unknown>).$or = [{ title: new RegExp(qStr, "i") }, { author: new RegExp(qStr, "i") }];
      }
      [items, total] = await Promise.all([
        Resource.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
        Resource.countDocuments(query),
      ]);
    }

    res.json({
      resources: items,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        pages: Math.ceil(total / take) || 1,
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to list resources" });
  }
};

export const listResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, type, approved = "true", limit = "50", page = "1" } = req.query;
    const take = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const query: any = {};
    if (String(approved) === "true") query.isApproved = true;
    if (type && type !== "all") query.content_type = String(type);
    if (q && String(q).trim().length > 1) query.$text = { $search: String(q).trim() };

    let items: any[];
    let total: number;
    const pageNum = Math.max(1, Number(page) || 1);
    try {
      [items, total] = await Promise.all([
        Resource.find(query)
          .sort(q ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 })
          .skip(skip)
          .limit(take)
          .lean(),
        Resource.countDocuments(query),
      ]);
    } catch {
      // Fallback when text index missing: search by regex on title/author
      if (query.$text) {
        delete query.$text;
        const qStr = String(q).trim().replace(/\s+/g, " ").split(" ").map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        if (qStr) (query as any).$or = [{ title: new RegExp(qStr, "i") }, { author: new RegExp(qStr, "i") }];
      }
      [items, total] = await Promise.all([
        Resource.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
        Resource.countDocuments(query),
      ]);
    }

    res.json({
      resources: items,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        pages: Math.ceil(total / take) || 1,
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to list resources" });
  }
};

export const createResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string | undefined;
    const { title, author, content_type, url, thumbnail_url, description } = req.body || {};
    if (!String(title || "").trim()) {
      res.status(400).json({ message: "title is required" });
      return;
    }

    const roomId = req.body?.roomId != null ? String(req.body.roomId).trim() || null : null;
    const resource = await Resource.create({
      title: String(title).trim(),
      author: author ? String(author).trim() : undefined,
      content_type: content_type || "other",
      url: url ? String(url).trim() : undefined,
      thumbnail_url: thumbnail_url ? String(thumbnail_url).trim() : undefined,
      description: description ? String(description).trim() : "",
      roomId: roomId || null,
      createdBy: userId || null,
      isApproved: false, // moderation by admin
    });

    res.status(201).json({ resource });
  } catch {
    res.status(400).json({ message: "Failed to create resource" });
  }
};


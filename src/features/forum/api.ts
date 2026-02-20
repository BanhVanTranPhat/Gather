import { getServerUrl } from "../../config/env";
import { authFetch } from "../../utils/authFetch";

const base = () => `${getServerUrl()}/api/forum`;

export interface Thread {
  _id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  roomId: string;
  postCount: number;
  lastPostAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  _id: string;
  threadId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThreadListResponse {
  threads: Thread[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ThreadDetailResponse {
  thread: Thread;
  posts: Post[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function fetchThreads(roomId: string, page = 1, limit = 20): Promise<ThreadListResponse> {
  const url = `${base()}/threads?roomId=${encodeURIComponent(roomId)}&page=${page}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchThread(threadId: string, page = 1, limit = 20): Promise<ThreadDetailResponse> {
  const url = `${base()}/threads/${encodeURIComponent(threadId)}?page=${page}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createThread(params: { title: string; body?: string; roomId?: string }): Promise<Thread> {
  const res = await authFetch(`${base()}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: params.title,
      body: params.body ?? "",
      roomId: params.roomId ?? "default-room",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createPost(threadId: string, body: string): Promise<Post> {
  const res = await authFetch(`${base()}/threads/${encodeURIComponent(threadId)}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteThread(threadId: string): Promise<void> {
  const res = await authFetch(`${base()}/threads/${encodeURIComponent(threadId)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function deletePost(postId: string): Promise<void> {
  const res = await authFetch(`${base()}/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

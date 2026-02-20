import { ArrowLeft, User, Trash2 } from "lucide-react";
import type { Thread as ThreadType, Post } from "./api";

interface ThreadDetailProps {
  thread: ThreadType;
  posts: Post[];
  pagination: { page: number; pages: number; total: number };
  loading?: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  onBack: () => void;
  onPage: (page: number) => void;
  onReply: () => void;
  onDeleteThread: () => void;
  onDeletePost: (postId: string) => void;
}

export default function ThreadDetail({
  thread,
  posts,
  pagination,
  loading,
  currentUserId,
  isAdmin,
  onBack,
  onPage,
  onReply,
  onDeleteThread,
  onDeletePost,
}: ThreadDetailProps) {
  const canDeleteThread = currentUserId === thread.authorId || isAdmin;
  const canDeletePost = (p: Post) => currentUserId === p.authorId || isAdmin;

  if (loading) {
    return (
      <div className="p-6 text-slate-500 text-center">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/80 dark:border-gray-700/80">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-400"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-slate-900 dark:text-white flex-1 truncate">{thread.title}</h2>
        {canDeleteThread && (
          <button
            type="button"
            onClick={onDeleteThread}
            className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
            aria-label="Xóa chủ đề"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <article className="rounded-xl border border-slate-200/80 dark:border-gray-700/80 bg-slate-50/50 dark:bg-gray-800/30 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <User size={14} />
            <span>{thread.authorName}</span>
            <span>·</span>
            <span>{thread.createdAt ? new Date(thread.createdAt).toLocaleString("vi-VN") : ""}</span>
          </div>
          <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{thread.body || "(Không có nội dung)"}</div>
        </article>

        {posts.map((p) => (
          <article
            key={p._id}
            className="rounded-xl border border-slate-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/50 p-4 flex gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                <User size={14} />
                <span>{p.authorName}</span>
                <span>·</span>
                <span>{p.createdAt ? new Date(p.createdAt).toLocaleString("vi-VN") : ""}</span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{p.body}</div>
            </div>
            {canDeletePost(p) && (
              <button
                type="button"
                onClick={() => onDeletePost(p._id)}
                className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 shrink-0"
                aria-label="Xóa trả lời"
              >
                <Trash2 size={16} />
              </button>
            )}
          </article>
        ))}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPage(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-600 text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-gray-800"
            >
              Trước
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPage(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-600 text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-gray-800"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200/80 dark:border-gray-700/80">
        <button
          type="button"
          onClick={onReply}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
        >
          Viết trả lời
        </button>
      </div>
    </div>
  );
}

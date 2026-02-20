import { MessageSquare, User } from "lucide-react";
import type { Thread as ThreadType } from "./api";

interface ThreadListProps {
  threads: ThreadType[];
  pagination: { page: number; pages: number; total: number };
  loading?: boolean;
  onSelect: (threadId: string) => void;
  onPage: (page: number) => void;
}

export default function ThreadList({
  threads,
  pagination,
  loading,
  onSelect,
  onPage,
}: ThreadListProps) {
  if (loading) {
    return (
      <div className="p-6 text-slate-500 text-center">
        Đang tải...
      </div>
    );
  }
  if (!threads.length) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-700/80">
        <MessageSquare size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="font-medium">Chưa có chủ đề nào.</p>
        <p className="text-sm mt-1">Tạo chủ đề đầu tiên để bắt đầu thảo luận.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200/80 dark:divide-gray-700/80">
      {threads.map((t) => (
        <button
          key={t._id}
          type="button"
          onClick={() => onSelect(t._id)}
          className="w-full text-left px-4 py-4 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition flex items-start gap-3 rounded-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MessageSquare size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <User size={12} />
                {t.authorName}
              </span>
              <span>·</span>
              <span>{t.postCount} trả lời</span>
              {t.lastPostAt && (
                <>
                  <span>·</span>
                  <span>{new Date(t.lastPostAt).toLocaleDateString("vi-VN")}</span>
                </>
              )}
            </div>
          </div>
        </button>
      ))}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
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
  );
}

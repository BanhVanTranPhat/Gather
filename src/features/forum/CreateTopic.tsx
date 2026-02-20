import { useState } from "react";

interface CreateTopicProps {
  onClose: () => void;
  onSubmit: (title: string, body: string) => Promise<void>;
}

export default function CreateTopic({ onClose, onSubmit }: CreateTopicProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), body.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message || "Không thể tạo chủ đề.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tạo chủ đề mới</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="forum-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề
            </label>
            <input
              id="forum-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề chủ đề"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="forum-body" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nội dung (tùy chọn)
            </label>
            <textarea
              id="forum-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nội dung chi tiết..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-gray-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 transition"
            >
              {submitting ? "Đang tạo..." : "Tạo chủ đề"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

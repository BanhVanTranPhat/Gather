import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Plus } from "lucide-react";
import * as forumApi from "./api";
import ThreadList from "./ThreadList";
import ThreadDetail from "./ThreadDetail";
import CreateTopic from "./CreateTopic";
import ReplyForm from "./ReplyForm";

const ROOM_ID = "default-room";

interface ForumPageProps {
  embedded?: boolean;
  onBack?: () => void;
}

export default function ForumPage({ embedded, onBack }: ForumPageProps = {}) {
  const [threads, setThreads] = useState<forumApi.Thread[]>([]);
  const [threadPage, setThreadPage] = useState(1);
  const [threadPagination, setThreadPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [listLoading, setListLoading] = useState(true);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [thread, setThread] = useState<forumApi.Thread | null>(null);
  const [posts, setPosts] = useState<forumApi.Post[]>([]);
  const [postPage, setPostPage] = useState(1);
  const [postPagination, setPostPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const [user, setUser] = useState<{ _id?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const currentUserId = (user as any)?._id ?? (user as any)?.id ?? undefined;
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const fetchList = useCallback(async (page = 1) => {
    setListLoading(true);
    try {
      const data = await forumApi.fetchThreads(ROOM_ID, page, 20);
      setThreads(data.threads);
      setThreadPagination({
        page: data.pagination.page,
        pages: data.pagination.pages,
        total: data.pagination.total,
      });
      setThreadPage(data.pagination.page);
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (threadId: string, page = 1) => {
    setDetailLoading(true);
    try {
      const data = await forumApi.fetchThread(threadId, page, 20);
      setThread(data.thread);
      setPosts(data.posts);
      setPostPagination({
        page: data.pagination.page,
        pages: data.pagination.pages,
        total: data.pagination.total,
      });
      setPostPage(data.pagination.page);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(threadPage);
  }, [threadPage, fetchList]);

  useEffect(() => {
    if (selectedThreadId) fetchDetail(selectedThreadId, postPage);
  }, [selectedThreadId, postPage, fetchDetail]);

  const handleCreateTopic = async (title: string, body: string) => {
    await forumApi.createThread({ title, body, roomId: ROOM_ID });
    setThreadPage(1);
    fetchList(1);
  };

  const handleReply = async (body: string) => {
    if (!selectedThreadId) return;
    await forumApi.createPost(selectedThreadId, body);
    setPostPage(1);
    fetchDetail(selectedThreadId, 1);
    fetchList(threadPage);
  };

  const handleDeleteThread = async () => {
    if (!selectedThreadId || !window.confirm("Bạn có chắc muốn xóa chủ đề này?")) return;
    await forumApi.deleteThread(selectedThreadId);
    setSelectedThreadId(null);
    setThread(null);
    setPosts([]);
    fetchList(threadPage);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa trả lời này?")) return;
    await forumApi.deletePost(postId);
    if (selectedThreadId) {
      fetchDetail(selectedThreadId, postPage);
      fetchList(threadPage);
    }
  };

  const view = selectedThreadId && thread ? "detail" : "list";

  return (
    <div
      className={`flex flex-col bg-white dark:bg-gray-900 text-slate-900 dark:text-slate-100 ${
        embedded ? "min-h-[400px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-gray-700/80" : "h-screen"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-gray-700/80 bg-slate-50/80 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          {embedded && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-slate-200/80 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-400"
              aria-label="Quay lại"
            >
              ←
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">Diễn đàn</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Thảo luận theo chủ đề</div>
          </div>
        </div>
        {view === "list" && (
          <button
            type="button"
            onClick={() => setShowCreateTopic(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
          >
            <Plus size={18} />
            Tạo chủ đề
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {view === "list" && (
          <ThreadList
            threads={threads}
            pagination={threadPagination}
            loading={listLoading}
            onSelect={setSelectedThreadId}
            onPage={setThreadPage}
          />
        )}
        {view === "detail" && thread && (
          <ThreadDetail
            thread={thread}
            posts={posts}
            pagination={postPagination}
            loading={detailLoading}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onBack={() => {
              setSelectedThreadId(null);
              setThread(null);
              setPosts([]);
            }}
            onPage={setPostPage}
            onReply={() => setShowReply(true)}
            onDeleteThread={handleDeleteThread}
            onDeletePost={handleDeletePost}
          />
        )}
      </div>

      {showCreateTopic && (
        <CreateTopic
          onClose={() => setShowCreateTopic(false)}
          onSubmit={handleCreateTopic}
        />
      )}
      {showReply && (
        <ReplyForm
          onClose={() => setShowReply(false)}
          onSubmit={handleReply}
        />
      )}
    </div>
  );
}

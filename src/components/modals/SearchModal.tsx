import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "../../utils/date";

interface SearchResult {
  type: "user";
  id: string;
  title: string;
  content?: string;
  author?: string;
  createdAt: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["user"]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedTypes]);

  const performSearch = async () => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const typesParam = selectedTypes.join(",");
      const response = await fetch(
        `${serverUrl}/api/search?q=${encodeURIComponent(
          query
        )}&types=${typesParam}&limit=20`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "user") {
      navigate(`/app/profile/${result.id}`);
      onClose();
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getResultIcon = (type: string) => {
    if (type === "user") return "👤";
    return "🔍";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[10000] pt-[10vh]" style={{ animation: 'fadeIn 0.2s ease' }} onClick={onClose}>
      <div className="w-[90%] max-w-[600px] bg-white dark:bg-[#2f3136] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col max-h-[80vh]" style={{ animation: 'slideDown 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 dark:border-[#202225] flex gap-2.5 items-center">
          <div className="flex-1 relative flex items-center gap-2.5">
            <span className="text-xl text-gray-500 dark:text-[#72767d]">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-3 pr-10 border border-gray-200 dark:border-[#202225] rounded-lg text-base outline-none transition-colors duration-200 focus:border-[#5865f2]"
            />
            {query && (
              <button
                className="absolute right-2 bg-transparent border-none text-gray-400 dark:text-[#72767d] cursor-pointer p-1 text-base flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-[#3c3f44] hover:text-gray-800 dark:hover:text-[#dcddde]"
                onClick={() => setQuery("")}
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
          <button className="bg-transparent border-none text-gray-500 dark:text-[#72767d] cursor-pointer p-2 text-xl w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-[#3c3f44] hover:text-gray-800 dark:hover:text-[#dcddde]" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#202225] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-[#1a1c1f]">
          {loading ? (
            <div className="py-10 px-5 text-center text-gray-500 dark:text-[#72767d] text-sm">Searching...</div>
          ) : results.length === 0 && query.length >= 2 ? (
            <div className="py-10 px-5 text-center text-gray-500 dark:text-[#72767d] text-sm">No results found</div>
          ) : query.length < 2 ? (
            <div className="py-10 px-5 text-center text-gray-500 dark:text-[#72767d] text-sm">
              Type at least 2 characters to search
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className="flex gap-3 px-5 py-3 cursor-pointer transition-colors duration-200 border-b border-gray-100 dark:border-[#202225] hover:bg-gray-50 dark:hover:bg-[#3c3f44] last:border-b-0"
                onClick={() => handleResultClick(result)}
              >
                <div className="text-2xl shrink-0 w-8 h-8 flex items-center justify-center">{getResultIcon(result.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-gray-800 dark:text-[#dcddde] mb-1 leading-relaxed">{result.title}</div>
                  {result.content && (
                    <div className="text-[13px] text-gray-500 dark:text-[#72767d] mb-2 leading-relaxed line-clamp-2">{result.content}</div>
                  )}
                  <div className="flex gap-3 items-center text-[11px] text-gray-400 dark:text-[#72767d]">
                    {result.author && (
                      <span className="font-medium">{result.author}</span>
                    )}
                    <span className="uppercase tracking-wide px-1.5 py-0.5 bg-gray-100 dark:bg-[#3c3f44] rounded">{result.type}</span>
                    <span>
                      {formatRelativeTime(result.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 dark:border-[#202225] bg-gray-50 dark:bg-[#2f3136]">
          <span className="text-[11px] text-gray-400 dark:text-[#72767d]">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;

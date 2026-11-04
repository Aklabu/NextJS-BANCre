"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, Clock, Trash2 } from "lucide-react";
import { getPropertyChatSessions, deleteChatSession, ChatSession } from "../propertyChatApi";
import { toast } from "sonner";

interface PreviousSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  propertyName: string;
  onSelectSession: (session: ChatSession) => void;
}

export default function PreviousSessionsModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  onSelectSession,
}: PreviousSessionsModalProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(
    async (page: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await getPropertyChatSessions(propertyId, page, 9);

        if (append) {
          setSessions((prev) => [...prev, ...response.results]);
        } else {
          setSessions(response.results);
        }

        setTotalCount(response.count);
        setHasMore(response.next !== null);
        setCurrentPage(page);
      } catch (error: any) {
        console.error("Failed to fetch chat sessions:", error);
        if (!append) {
          // Provide specific error messages
          let errorMessage = "Failed to load chat sessions";
          
          if (error?.response?.status === 404) {
            errorMessage = error?.response?.data?.message || "Property not found or not accessible";
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          
          toast.error(errorMessage);
          setSessions([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [propertyId]
  );

  useEffect(() => {
    if (isOpen) {
      fetchSessions(1, false);
    }
  }, [isOpen, fetchSessions]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loadingMore || !hasMore || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    if (scrollHeight - scrollTop - clientHeight < 50) {
      fetchSessions(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loadingMore, loading, fetchSessions]);

  const handleSessionClick = (session: ChatSession) => {
    onSelectSession(session);
    onClose();
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: number,
    sessionTitle: string
  ) => {
    e.stopPropagation(); // Prevent session selection when clicking delete

    if (!confirm(`Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      await deleteChatSession(propertyId, sessionId);
      
      // Remove the session from the list
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setTotalCount((prev) => prev - 1);
      
      toast.success("Session deleted successfully");
      console.log(`Deleted session ${sessionId}`);
    } catch (error: any) {
      console.error("Failed to delete session:", error);
      
      // Provide specific error messages
      let errorMessage = "Failed to delete session";
      
      if (error?.response?.status === 403) {
        errorMessage = "You do not have permission to delete this session";
      } else if (error?.response?.status === 404) {
        errorMessage = error?.response?.data?.message || "Session not found or property not accessible";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Previous Chat Sessions
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {propertyName} • {totalCount} session{totalCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-gray-500">Loading sessions...</p>
              </div>
            ) : !sessions || sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Clock size={48} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No previous chat sessions</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start a new conversation to create your first session
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {formatDate(session.created_at)}</span>
                          {session.updated_at !== session.created_at && (
                            <span>Updated: {formatDate(session.updated_at)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, session.id, session.title)}
                        disabled={deletingSessionId === session.id}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Delete session"
                      >
                        <Trash2 
                          size={16} 
                          className={`${
                            deletingSessionId === session.id 
                              ? "text-gray-400" 
                              : "text-red-600 hover:text-red-700"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
                {loadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <p className="text-xs text-gray-500">Loading more...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

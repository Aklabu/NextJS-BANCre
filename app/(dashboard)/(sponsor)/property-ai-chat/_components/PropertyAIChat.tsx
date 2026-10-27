"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { 
  getProperties, 
  PropertyItem, 
  createChatSession, 
  sendPropertyMessage,
  getSessionMessages,
  ChatSession 
} from "../propertyChatApi";
import { toast } from "sonner";
import PreviousSessionsModal from "./PreviousSessionsModal";

type Property = PropertyItem;

type Chat = ChatSession;

type Message = {
  id: string;
  sender: "user" | "assistant";
  content: string;
};

export default function PropertyAIChat() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isPreviousSessionsModalOpen, setIsPreviousSessionsModalOpen] = useState(false);
  const propertyListRef = useRef<HTMLDivElement>(null);

  // Fetch properties from API
  const fetchProperties = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      console.log(`Fetching properties - Page: ${page}, Append: ${append}`);
      const response = await getProperties(page, 10); // Fetch 10 properties per page
      console.log("Received response:", response);
      
      if (append) {
        setProperties((prev) => [...prev, ...response.results]);
      } else {
        setProperties(response.results);
      }
      
      setTotalCount(response.count);
      setHasMore(response.next !== null);
      setCurrentPage(page);
      
      console.log(`Loaded ${response.results.length} properties. Total: ${response.count}, Has more: ${response.next !== null}`);
    } catch (error: any) {
      console.error("Failed to fetch properties:", error);
      console.error("Error details:", error?.response?.data);
      if (!append) {
        toast.error(error?.response?.data?.message || "Failed to load properties");
        setProperties([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProperties(1, false);
  }, [fetchProperties]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!propertyListRef.current || loadingMore || !hasMore || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = propertyListRef.current;
    
    // Load more when user scrolls to bottom (with 50px threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      fetchProperties(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loadingMore, loading, fetchProperties]);

  // Mock data for chats (will be replaced with API later)

  const [chats, setChats] = useState<Chat[]>([]);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    // Reset chat when switching properties
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleNewChat = async () => {
    if (!selectedProperty) {
      toast.error("Please select a property first");
      return;
    }

    try {
      // Create a new chat session for the selected property
      const session = await createChatSession(selectedProperty.id, "New Chat");
      setCurrentSessionId(session.id);
      setMessages([]);
      toast.success("New chat session created");
      
      console.log("New chat session created:", session);
    } catch (error: any) {
      console.error("Failed to create new chat:", error);
      toast.error(error?.response?.data?.message || "Failed to create new chat");
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChats(chats.filter((chat) => chat.id !== chatId));
  };

  const handleSelectSession = async (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages([]);
    
    if (!selectedProperty) return;

    try {
      // Load message history for this session
      const sessionMessages = await getSessionMessages(
        selectedProperty.id,
        session.id
      );

      // Convert API messages to component message format
      const formattedMessages: Message[] = sessionMessages.map((msg) => ({
        id: msg.id.toString(),
        sender: msg.role,
        content: msg.content,
      }));

      setMessages(formattedMessages);
      toast.success(`Loaded session: ${session.title}`);
      console.log("Loaded messages:", formattedMessages);
    } catch (error: any) {
      console.error("Failed to load session messages:", error);
      toast.error(error?.response?.data?.message || "Failed to load session messages");
    }
  };

  const handleOpenPreviousSessions = () => {
    if (!selectedProperty) {
      toast.error("Please select a property first");
      return;
    }
    setIsPreviousSessionsModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProperty) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Send message to API
      const response = await sendPropertyMessage(
        selectedProperty.id,
        inputMessage,
        currentSessionId || undefined
      );

      console.log("Full API response:", response);

      // Update session ID if this was the first message
      if (!currentSessionId) {
        setCurrentSessionId(response.session_id);
      }

      // Check if reply exists and is not empty
      if (!response.reply || response.reply.trim() === "") {
        console.warn("Received empty reply from API");
        toast.warning("No response received from AI. Please try again.");
        setIsTyping(false);
        return;
      }

      // Add AI response to messages
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        content: response.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
      console.log("Message sent successfully:", response);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error(error?.response?.data?.message || "Failed to send message");
      
      // Remove the user message if sending failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  const filteredProperties = (properties || []).filter((property) =>
    property.property_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedQuestions = [
    "Summarize this property",
    "What was renovated in 2020?",
  ];

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 bg-[#F3F4F6]">
      {/* Left Sidebar - Properties */}
      <div className="w-80 bg-white rounded-lg shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-6 pb-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-0.5">
            Your properties
          </h2>
          <p className="text-sm text-gray-500">{totalCount} total</p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Properties List */}
        <div 
          ref={propertyListRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-500">Loading properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-500">No properties found</p>
            </div>
          ) : (
            <>
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedProperty?.id === property.id
                      ? "bg-blue-50 border-l-4 border-l-blue-600"
                      : ""
                  }`}
                  onClick={() => handlePropertySelect(property)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {property.property_name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {property.property_address}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <p className="text-xs text-gray-500">Loading more properties...</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat History */}
        <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {chat.title}
                  </h4>
                </div>
                <button
                  onClick={() => handleDeleteChat(chat.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Previous Chat Sessions Button */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleOpenPreviousSessions}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Previous chat sessions
          </button>
        </div>

        {/* Fixed New Chat Button */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleNewChat}
            className="w-full bg-[#0D4DA5] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New chat
          </button>
        </div>
      </div>

      {/* Right Content - Chat Area */}
      <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
        {selectedProperty ? (
          <>
            {/* Property Header */}
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedProperty.property_name}
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                {selectedProperty.property_address} · {selectedProperty.property_type}
              </p>

              {/* Info Banner */}
              <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg">
                Chatting about this property only. Select another property on
                the left to switch.
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      message.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        message.sender === "user"
                          ? "bg-[#0D4DA5] text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">Assistant is typing...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Questions */}
            {messages.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200">
                <div className="flex gap-2">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(question)}
                      className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Ask anything about ${selectedProperty.property_name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="px-6 py-3 bg-[#0D4DA5] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Property AI chat
              </h2>
              <p className="text-gray-500">
                Pick a property, then ask anything about it.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Previous Sessions Modal */}
      {selectedProperty && (
        <PreviousSessionsModal
          isOpen={isPreviousSessionsModalOpen}
          onClose={() => setIsPreviousSessionsModalOpen(false)}
          propertyId={selectedProperty.id}
          propertyName={selectedProperty.property_name}
          onSelectSession={handleSelectSession}
        />
      )}
    </div>
  );
}

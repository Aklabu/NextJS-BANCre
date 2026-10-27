"use client";

import { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";

type Property = {
  id: string;
  name: string;
  address: string;
  type: "Commercial" | "Residential";
};

type Chat = {
  id: string;
  title: string;
  date: string;
};

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

  // Mock data
  const properties: Property[] = [
    {
      id: "1",
      name: "Downtown Office Complex",
      address: "123 Main Street, New York",
      type: "Commercial",
    },
    {
      id: "2",
      name: "Riverside Apartments",
      address: "456 River Road, Brooklyn",
      type: "Residential",
    },
    {
      id: "3",
      name: "[Property name]",
      address: "[Address]",
      type: "Residential",
    },
  ];

  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "What is the occupancy rate?",
      date: "",
    },
    {
      id: "2",
      title: "Property Analysis Discussion",
      date: "",
    },
    {
      id: "3",
      title: "New Chat",
      date: "",
    },
  ]);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    // Initialize with mock messages
    setMessages([
      {
        id: "1",
        sender: "user",
        content: "What is the occupancy rate?",
      },
      {
        id: "2",
        sender: "assistant",
        content:
          "The occupancy rate for this property is 85.5%, which is above the market average. [AI reply continues here]",
      },
      {
        id: "3",
        sender: "user",
        content: "What about parking spaces?",
      },
      {
        id: "4",
        sender: "assistant",
        content:
          "The property has 100 parking spaces available. [AI reply continues here]",
      },
    ]);
  };

  const handleNewChat = () => {
    setMessages([]);
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      date: "",
    };
    setChats([newChat, ...chats]);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats(chats.filter((chat) => chat.id !== chatId));
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedProperty) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: inputMessage,
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        content: "Assistant is typing...",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const filteredProperties = properties.filter((property) =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <p className="text-sm text-gray-500">25 total</p>
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
        <div className="flex-1 overflow-y-auto">
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
                    {property.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {property.address}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
          <button className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
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
                {selectedProperty.name}
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                {selectedProperty.address} · {selectedProperty.type}
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
                  placeholder={`Ask anything about ${selectedProperty.name}...`}
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
    </div>
  );
}

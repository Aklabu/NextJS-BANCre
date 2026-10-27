import api from "@/lib/apiClient";

/**
 * PROPERTY CHAT API
 * Base URL: http://localhost:8000/api/
 * 
 * Endpoints:
 * - GET /api/properties/ - List all properties (paginated)
 * - GET /api/properties/<property_id>/chat/sessions/ - List all chat sessions for a property (paginated)
 * - GET /api/properties/<property_id>/chat/sessions/<session_id>/ - Get message history for a session
 * - POST /api/properties/<property_id>/chat/sessions/ - Create a new chat session
 * - DELETE /api/properties/<property_id>/chat/sessions/<session_id>/ - Delete a chat session
 * - POST /api/properties/<property_id>/chat/ - Send message and get AI response
 * 
 * IMPORTANT NOTES:
 * - Authentication: All endpoints require Token authentication
 * - Permissions: User must be a Sponsor
 * - Pagination: Default page size, can be customized with ?page_size query param
 * - Chat Sessions: Can be created with custom title or auto-generated from first message
 * - Conversation Context: Previous messages are automatically included for context
 * - Delete Operation: Permanently removes session and all messages
 */

// ==================== TYPE DEFINITIONS ====================

export interface PropertyItem {
  id: number;
  place_id: string | null;
  property_name: string;
  property_address: string;
  property_type: "Commercial" | "Residential";
  latitude: string;
  longitude: string;
  property_image_url: string | null;
  memorandum_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPropertiesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PropertyItem[];
}

export interface ChatSession {
  id: number;
  property: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedSessionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatSession[];
}

export interface CreateSessionRequest {
  title?: string;
}

export interface CreateSessionResponse {
  success: boolean;
  message: string;
  data: ChatSession;
}

export interface SendMessageRequest {
  message: string;
  session_id?: number;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    session_id: number;
    reply: string;
  };
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface GetMessagesResponse {
  success: boolean;
  message: string;
  data: ChatMessage[];
}

export interface DeleteSessionResponse {
  success: boolean;
  message: string;
  data: null;
}

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
  errors: null | any;
}

// ==================== API FUNCTIONS ====================

/**
 * 1. GET /api/properties/
 * Get paginated list of all properties owned by the authenticated user
 * 
 * @param page - Page number (default: 1)
 * @param page_size - Items per page (default: 10)
 * @returns Paginated properties response
 */
export async function getProperties(
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedPropertiesResponse> {
  try {
    const response = await api.get<PaginatedPropertiesResponse | ApiResponse<PaginatedPropertiesResponse>>(
      "/api/properties/",
      {
        params: { page, page_size }
      }
    );
    
    console.log("Properties API Response:", response.data);
    
    // Handle both wrapped and unwrapped responses
    if (response.data && 'data' in response.data && response.data.data) {
      // Wrapped response: { success, statusCode, data: { count, results, ... } }
      return response.data.data;
    } else if (response.data && 'results' in response.data) {
      // Direct response: { count, results, next, previous }
      return response.data as PaginatedPropertiesResponse;
    } else {
      console.error("Unexpected API response structure:", response.data);
      throw new Error("Unexpected API response structure");
    }
  } catch (error: any) {
    console.error("Failed to fetch properties:", error);
    console.error("Error response:", error?.response?.data);
    throw error;
  }
}

/**
 * 2. GET /api/properties/<property_id>/chat/sessions/
 * Get paginated list of all chat sessions for a specific property
 * 
 * @param propertyId - ID of the property
 * @param page - Page number (default: 1)
 * @param page_size - Items per page (default: 10)
 * @returns Paginated chat sessions response
 */
export async function getPropertyChatSessions(
  propertyId: number,
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedSessionsResponse> {
  try {
    const response = await api.get<PaginatedSessionsResponse>(
      `/api/properties/${propertyId}/chat/sessions/`,
      {
        params: { page, page_size }
      }
    );
    
    console.log("Chat sessions response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch chat sessions:", error);
    console.error("Error details:", error?.response?.data);
    throw error;
  }
}

/**
 * 3. POST /api/properties/<property_id>/chat/sessions/
 * Create a new chat session for a specific property with optional title
 * 
 * @param propertyId - ID of the property
 * @param title - Optional custom title for the session
 * @returns Created chat session details
 */
export async function createChatSession(
  propertyId: number,
  title?: string
): Promise<ChatSession> {
  try {
    const payload: CreateSessionRequest = title ? { title } : {};
    
    const response = await api.post<CreateSessionResponse>(
      `/api/properties/${propertyId}/chat/sessions/`,
      payload
    );
    
    console.log("Create session response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Failed to create chat session:", error);
    console.error("Error details:", error?.response?.data);
    throw error;
  }
}

/**
 * 4. GET /api/properties/<property_id>/chat/sessions/<session_id>/
 * Retrieve complete message history for a specific chat session
 * 
 * @param propertyId - ID of the property
 * @param sessionId - ID of the chat session
 * @returns Array of messages with role and content
 */
export async function getSessionMessages(
  propertyId: number,
  sessionId: number
): Promise<ChatMessage[]> {
  try {
    const response = await api.get<GetMessagesResponse>(
      `/api/properties/${propertyId}/chat/sessions/${sessionId}/`
    );
    
    console.log("Session messages response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Failed to fetch session messages:", error);
    console.error("Error details:", error?.response?.data);
    throw error;
  }
}

/**
 * 5. DELETE /api/properties/<property_id>/chat/sessions/<session_id>/
 * Permanently delete a chat session and all its messages
 * 
 * @param propertyId - ID of the property
 * @param sessionId - ID of the chat session to delete
 * @returns Success message
 */
export async function deleteChatSession(
  propertyId: number,
  sessionId: number
): Promise<void> {
  try {
    const response = await api.delete<DeleteSessionResponse>(
      `/api/properties/${propertyId}/chat/sessions/${sessionId}/`
    );
    
    console.log("Delete session response:", response.data);
  } catch (error: any) {
    console.error("Failed to delete chat session:", error);
    console.error("Error details:", error?.response?.data);
    throw error;
  }
}

/**
 * 6. POST /api/properties/<property_id>/chat/
 * Send a message and get an AI response about a specific property
 * 
 * @param propertyId - ID of the property to chat about
 * @param message - User's message
 * @param sessionId - Optional session ID to continue existing conversation
 * @returns Session ID and AI reply
 */
export async function sendPropertyMessage(
  propertyId: number,
  message: string,
  sessionId?: number
): Promise<{ session_id: number; reply: string }> {
  try {
    const payload: SendMessageRequest = {
      message,
      ...(sessionId && { session_id: sessionId })
    };
    
    const response = await api.post<SendMessageResponse>(
      `/api/properties/${propertyId}/chat/`,
      payload
    );
    
    console.log("Send message response:", response.data);
    
    // Check if response.data.data exists and has the expected structure
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    // If response.data directly contains session_id and reply
    if (response.data && 'session_id' in response.data && 'reply' in response.data) {
      return {
        session_id: response.data.session_id as number,
        reply: response.data.reply as string
      };
    }
    
    console.warn("Unexpected response structure:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Failed to send message:", error);
    console.error("Error details:", error?.response?.data);
    throw error;
  }
}

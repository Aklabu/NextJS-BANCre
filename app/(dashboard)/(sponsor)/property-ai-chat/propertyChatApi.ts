import api from "@/lib/apiClient";

/**
 * PROPERTY CHAT API - WORKS FOR BOTH SPONSORS AND LENDERS
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
 * - Authentication: All endpoints require Token authentication (Bearer token)
 * - Permissions: Works for both Sponsors and Lenders
 *   - Sponsors: Access their own properties
 *   - Lenders: Access properties with active loan requests they can view
 * - Pagination: Default page size, can be customized with ?page_size query param
 * - Chat Sessions: Can be created with custom title or auto-generated from first message
 * - Conversation Context: Previous messages are automatically included for context
 * - Delete Operation: Permanently removes session and all messages
 * 
 * KEY POINTS FOR LENDERS:
 * ========================
 * 1. ACCESS RESTRICTION:
 *    - All chat APIs require the property to have an ACTIVE loan request
 *    - Attempting to chat about properties without active loan requests returns 404
 *    - Error message: "This property is not available or does not have any active loan requests."
 * 
 * 2. SESSION ISOLATION:
 *    - Lenders can only see and manage their own chat sessions
 *    - Attempting to access another user's session returns 403 Forbidden
 *    - Error message: "You do not have permission to access this chat session."
 * 
 * 3. AUTO-TITLE GENERATION:
 *    - If the first message is sent without creating a session explicitly:
 *      * A new session is automatically created
 *      * Session title is auto-generated from the first 60 characters of the message
 *    - Example: Message "What is the current occupancy rate..." → Title "What is the current occupancy rate and rental income"
 * 
 * 4. CONTEXT-AWARE AI:
 *    - The AI chatbot has access to all property documents
 *    - Can answer detailed questions about:
 *      * Financial metrics (occupancy rate, rental income, expenses)
 *      * Capital expenditures (CapEx plans)
 *      * Property specifications (units, square footage, amenities)
 *      * Market analysis and valuations
 *      * Debt service coverage and loan terms
 *    - Previous messages in the session are used for context in follow-up questions
 * 
 * 5. ERROR HANDLING:
 *    - 400 Bad Request: Invalid or missing required fields
 *    - 401 Unauthorized: Authentication failed or token expired
 *    - 403 Forbidden: Permission denied (not your session)
 *    - 404 Not Found: Property/session not found or no active loan request
 *    - 503 Service Unavailable: AI service temporarily unavailable
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
  user: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedSessionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  page_size: number;
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
  session: number;
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
 * 1. GET /api/properties/ (Sponsors) or GET /api/properties/map/ (Lenders)
 * Get paginated list of all properties accessible by the authenticated user
 * 
 * - Sponsors: Access their own properties via /api/properties/ (paginated)
 * - Lenders: Access properties with active loan requests via /api/properties/map/ (array, converted to paginated)
 * 
 * @param page - Page number (default: 1) - Note: For lenders, all properties returned in single call
 * @param page_size - Items per page (default: 10) - Note: For lenders, client-side pagination
 * @returns Paginated properties response
 */
export async function getProperties(
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedPropertiesResponse> {
  try {
    // Determine user role from localStorage
    let userRole: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const rawCreds = localStorage.getItem("userCredentials");
        if (rawCreds) {
          const parsedCreds = JSON.parse(rawCreds);
          const userData = parsedCreds?.user && typeof parsedCreds.user === "object"
            ? parsedCreds.user
            : parsedCreds;
          userRole = (userData?.customer_type || userData?.role || parsedCreds?.customer_type || parsedCreds?.role)?.toLowerCase();
        }
      } catch (error) {
        console.error("Failed to determine user role:", error);
      }
    }

    const isLender = userRole === "lender" || userRole === "lander";
    
    console.log("Fetching properties for role:", userRole);
    
    if (isLender) {
      // Lenders: Use /api/properties/map/ which returns an array (not paginated)
      const response = await api.get<ApiResponse<PropertyItem[]> | PropertyItem[]>(
        "/api/properties/map/"
      );
      
      console.log("Lender properties API Response:", response.data);
      
      // Extract array from wrapped or direct response
      let propertiesArray: PropertyItem[];
      
      if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        // Wrapped response: { success, statusCode, data: PropertyItem[] }
        propertiesArray = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        propertiesArray = response.data;
      } else {
        console.error("Unexpected lender API response structure:", response.data);
        throw new Error("Unexpected API response structure");
      }
      
      // Convert to paginated format with client-side pagination
      const startIndex = (page - 1) * page_size;
      const endIndex = startIndex + page_size;
      const paginatedResults = propertiesArray.slice(startIndex, endIndex);
      const totalCount = propertiesArray.length;
      const hasNext = endIndex < totalCount;
      const hasPrevious = page > 1;
      
      return {
        count: totalCount,
        next: hasNext ? `page=${page + 1}` : null,
        previous: hasPrevious ? `page=${page - 1}` : null,
        results: paginatedResults
      };
      
    } else {
      // Sponsors: Use /api/properties/ which is server-side paginated
      const response = await api.get<PaginatedPropertiesResponse | ApiResponse<PaginatedPropertiesResponse>>(
        "/api/properties/",
        {
          params: { page, page_size }
        }
      );
      
      console.log("Sponsor properties API Response:", response.data);
      
      // Handle both wrapped and unwrapped responses
      if (response.data && 'data' in response.data && response.data.data) {
        // Wrapped response: { success, statusCode, data: { count, results, ... } }
        return response.data.data;
      } else if (response.data && 'results' in response.data) {
        // Direct response: { count, results, next, previous }
        return response.data as PaginatedPropertiesResponse;
      } else {
        console.error("Unexpected sponsor API response structure:", response.data);
        throw new Error("Unexpected API response structure");
      }
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
 * @param page_size - Items per page (default: 9)
 * @returns Paginated chat sessions response
 * 
 * Success: Returns list of sessions with pagination metadata
 * Errors:
 * - 404: Property not available or no active loan requests (for lenders)
 * - 404: Property not found
 */
export async function getPropertyChatSessions(
  propertyId: number,
  page: number = 1,
  page_size: number = 9
): Promise<PaginatedSessionsResponse> {
  try {
    const response = await api.get<ApiResponse<PaginatedSessionsResponse> | PaginatedSessionsResponse>(
      `/api/properties/${propertyId}/chat/sessions/`,
      {
        params: { page, page_size }
      }
    );
    
    console.log("Chat sessions response:", response.data);
    
    // Handle wrapped response format
    if (response.data && 'data' in response.data && response.data.data) {
      // Wrapped response: { success, statusCode, data: { count, results, ... } }
      return response.data.data;
    } else if (response.data && 'results' in response.data) {
      // Direct response: { count, results, next, previous, ... }
      return response.data as PaginatedSessionsResponse;
    } else {
      console.error("Unexpected API response structure:", response.data);
      throw new Error("Unexpected API response structure");
    }
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
 * @param title - Optional custom title for the session (defaults to "New Chat" if not provided)
 * @returns Created chat session details including id, property, user, title, and timestamps
 * 
 * Success: Returns the newly created session with 201 status
 * Errors:
 * - 404: Property not available or no active loan requests (for lenders)
 * - 404: Property not found
 * - 400: Invalid request data
 */
export async function createChatSession(
  propertyId: number,
  title?: string
): Promise<ChatSession> {
  try {
    const payload: CreateSessionRequest = title ? { title } : {};
    
    const response = await api.post<CreateSessionResponse | ApiResponse<ChatSession>>(
      `/api/properties/${propertyId}/chat/sessions/`,
      payload
    );
    
    console.log("Create session response:", response.data);
    
    // Handle both wrapped and direct response formats
    if (response.data && 'data' in response.data && response.data.data) {
      // Wrapped response: { success, statusCode, message, data: ChatSession }
      return response.data.data;
    } else if (response.data && 'id' in response.data) {
      // Direct response: ChatSession object
      return response.data as unknown as ChatSession;
    } else {
      console.error("Unexpected API response structure:", response.data);
      throw new Error("Unexpected API response structure");
    }
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
 * @returns Array of messages with id, session, role, content, and created_at
 * 
 * Success: Returns array of messages (can be empty for new sessions)
 * Errors:
 * - 404: Property not available or no active loan requests (for lenders)
 * - 404: Session not found
 * - 403: User does not have permission to access this session
 */
export async function getSessionMessages(
  propertyId: number,
  sessionId: number
): Promise<ChatMessage[]> {
  try {
    const response = await api.get<GetMessagesResponse | ApiResponse<ChatMessage[]>>(
      `/api/properties/${propertyId}/chat/sessions/${sessionId}/`
    );
    
    console.log("Session messages response:", response.data);
    
    // Handle wrapped response format
    if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      // Wrapped response: { success, statusCode, message, data: ChatMessage[] }
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      // Direct response: ChatMessage[]
      return response.data;
    } else {
      console.error("Unexpected API response structure:", response.data);
      throw new Error("Unexpected API response structure");
    }
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
 * @returns void (success indicated by no error thrown)
 * 
 * Success: Returns 200 OK with success message
 * Errors:
 * - 404: Property not available or no active loan requests (for lenders)
 * - 404: Session not found
 * - 403: User does not have permission to delete this session (not owner)
 * 
 * IMPORTANT: This operation is permanent and cannot be undone
 */
export async function deleteChatSession(
  propertyId: number,
  sessionId: number
): Promise<void> {
  try {
    const response = await api.delete<DeleteSessionResponse | ApiResponse<null>>(
      `/api/properties/${propertyId}/chat/sessions/${sessionId}/`
    );
    
    console.log("Delete session response:", response.data);
    
    // Delete operation completed successfully if no error thrown
    // Response contains success message but we don't need to return it
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

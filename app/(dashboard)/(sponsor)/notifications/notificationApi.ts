import api from "@/lib/apiClient";

/**
 * NOTIFICATIONS API
 * Base URL: http://localhost:8000/api/notifications/
 * 
 * Endpoints:
 * - GET /api/notifications/ - List all notifications (paginated)
 * - GET /api/notifications/unread-count/ - Get unread notification count
 * - PATCH /api/notifications/read-all/ - Mark all notifications as read
 * - DELETE /api/notifications/clear-all/ - Delete all notifications
 * - PATCH /api/notifications/<int:pk>/read/ - Mark single notification as read
 * - DELETE /api/notifications/<int:pk>/ - Delete single notification
 * - GET /api/notifications/preferences/ - Get notification preferences
 * - PATCH /api/notifications/preferences/ - Update notification preferences
 * 
 * IMPORTANT NOTES:
 * - Authentication: All endpoints require JWT Bearer token in Authorization header
 * - Permissions: Users can only access their own notifications (403 on unauthorized access)
 * - Pagination: Default page size is 9 items, maximum is 100 items
 * - URL Order: Bulk operations (/read-all/, /clear-all/) come before /<id>/ routes
 * - Related IDs: memorandum_id, loan_request_id, quote_id are plain integers (not FKs)
 * - Response Format: All responses follow standard structure with success, statusCode, message, timestamp, data, errors
 */

// ==================== TYPE DEFINITIONS ====================

/**
 * Notification Types Reference:
 * - MEMORANDUM_GENERATED: Credit memorandum has been generated
 * - LOAN_REQUEST_CREATED: New loan request has been created
 * - LOAN_REQUEST_UPDATED: Loan request status has been updated
 * - QUOTE_SUBMITTED: New quote has been submitted for a loan
 * - QUOTE_ACCEPTED: Quote has been accepted
 * - QUOTE_DECLINED: Quote has been declined
 * - MANUAL: Manually created notification
 */
export type NotificationType =
  | "MEMORANDUM_GENERATED"
  | "LOAN_REQUEST_CREATED"
  | "LOAN_REQUEST_UPDATED"
  | "QUOTE_SUBMITTED"
  | "QUOTE_ACCEPTED"
  | "QUOTE_DECLINED"
  | "MANUAL";

export interface NotificationItem {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  memorandum_id: number | null;
  loan_request_id: number | null;
  quote_id: number | null;
}

export interface PaginatedNotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: NotificationItem[];
}

/**
 * Standard API Response Wrapper
 * All successful responses follow this structure:
 * {
 *   "success": true/false,
 *   "statusCode": <HTTP_STATUS_CODE>,
 *   "message": "<descriptive_message>",
 *   "timestamp": "<ISO_8601_timestamp>",
 *   "data": <response_data_or_null>,
 *   "errors": <validation_errors_or_null>
 * }
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
  errors: null | any;
}

export interface UnreadCountData {
  unread_count: number;
}

export interface MarkAllAsReadData {
  updated_count: number;
}

export interface ClearAllNotificationsData {
  deleted_count: number;
}

export interface NotificationPreferences {
  quote_emails_enabled: boolean;
  updated_at: string;
}

export interface UpdatePreferencesPayload {
  quote_emails_enabled: boolean;
}

// ==================== API FUNCTIONS ====================

/**
 * 1. GET /api/notifications/
 * Get paginated list of all notifications for the authenticated user
 * 
 * @param page - Page number (default: 1)
 * @param page_size - Items per page (default: 9, max: 100)
 * @returns Paginated notifications response
 */
export async function getNotifications(
  page: number = 1,
  page_size: number = 9
): Promise<PaginatedNotificationsResponse> {
  try {
    const response = await api.get<ApiResponse<PaginatedNotificationsResponse>>(
      "/api/notifications/",
      {
        params: { page, page_size }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }
}

/**
 * 2. GET /api/notifications/unread-count/
 * Get the count of unread notifications (for badge display)
 * 
 * @returns Unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await api.get<ApiResponse<UnreadCountData>>(
      "/api/notifications/unread-count/"
    );
    return response.data.data.unread_count;
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return 0;
  }
}

/**
 * 3. PATCH /api/notifications/<notification_id>/read/
 * Mark a specific notification as read
 * 
 * @param notificationId - ID of the notification to mark as read
 * @returns Updated notification item
 */
export async function markNotificationAsRead(
  notificationId: number
): Promise<NotificationItem> {
  try {
    const response = await api.patch<ApiResponse<NotificationItem>>(
      `/api/notifications/${notificationId}/read/`
    );
    return response.data.data;
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as read:`, error);
    throw error;
  }
}

/**
 * 4. PATCH /api/notifications/read-all/
 * Mark all unread notifications as read in bulk
 * 
 * @returns Number of notifications marked as read
 */
export async function markAllNotificationsAsRead(): Promise<number> {
  try {
    const response = await api.patch<ApiResponse<MarkAllAsReadData>>(
      "/api/notifications/read-all/"
    );
    return response.data.data.updated_count;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }
}

/**
 * 5. DELETE /api/notifications/<notification_id>/
 * Delete a specific notification
 * 
 * @param notificationId - ID of the notification to delete
 * @returns void
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  try {
    await api.delete<ApiResponse<null>>(
      `/api/notifications/${notificationId}/`
    );
  } catch (error) {
    console.error(`Failed to delete notification ${notificationId}:`, error);
    throw error;
  }
}

/**
 * 6. DELETE /api/notifications/clear-all/
 * Delete all notifications for the authenticated user
 * 
 * @returns Number of notifications deleted
 */
export async function clearAllNotifications(): Promise<number> {
  try {
    const response = await api.delete<ApiResponse<ClearAllNotificationsData>>(
      "/api/notifications/clear-all/"
    );
    return response.data.data.deleted_count;
  } catch (error) {
    console.error("Failed to clear all notifications:", error);
    throw error;
  }
}

/**
 * 7. GET /api/notifications/preferences/
 * Get user's notification preference settings (email notifications for quotes)
 * 
 * @returns Notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await api.get<ApiResponse<NotificationPreferences>>(
      "/api/notifications/preferences/"
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch notification preferences:", error);
    throw error;
  }
}

/**
 * 8. PATCH /api/notifications/preferences/
 * Update user's notification preference settings
 * 
 * @param preferences - Preferences to update
 * @returns Updated notification preferences
 */
export async function updateNotificationPreferences(
  preferences: UpdatePreferencesPayload
): Promise<NotificationPreferences> {
  try {
    const response = await api.patch<ApiResponse<NotificationPreferences>>(
      "/api/notifications/preferences/",
      preferences
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    throw error;
  }
}

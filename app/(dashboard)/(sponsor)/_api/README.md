# Sponsor Loan Requests API

This directory contains all API integration code for the Sponsor dashboard loan requests functionality.

## 📁 Files

```
_api/
├── loan-requests-api.ts           # Loan requests CRUD operations
├── loan-request-detail-api.ts     # Quote detail and accept/decline operations
├── loan-requests-api-docs.md      # Complete API endpoint documentation
├── INTEGRATION_SUMMARY.md         # Integration details and changes
└── README.md                      # This file
```

## 🚀 Quick Start

### Import the API functions

```typescript
// From loan-requests-api.ts
import {
  // Loan Requests CRUD
  fetchLoanRequests,
  createLoanRequest,
  updateLoanRequest,
  deleteLoanRequest,
  
  // Dashboard
  fetchSponsorDashboard,
  fetchQuoteCounts,
  
  // Error helpers
  extractApiErrorMessage,
  isForbiddenError,
  isBadRequestError,
  
  // Types
  type SponsorLoanRequestItem,
  type CreateLoanRequestPayload,
  type UpdateLoanRequestPayload,
} from '../_api/loan-requests-api';

// From loan-request-detail-api.ts
import {
  // Request & Quote Details
  fetchLoanRequestDetail,
  fetchQuotesForLoanRequest,
  fetchQuoteDetail,
  
  // Quote Actions
  acceptQuote,
  declineQuote,
  
  // Types
  type LoanRequestDetail,
  type QuoteDetail,
} from '../_api/loan-request-detail-api';
```

### Example: Fetch all loan requests

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchLoanRequests } from '../_api/loan-requests-api';

function MyComponent() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['loan-requests'],
    queryFn: () => fetchLoanRequests(1, 20), // page 1, 20 items
  });
  
  return (
    <div>
      {requests?.map(request => (
        <div key={request.id}>{request.property_name}</div>
      ))}
    </div>
  );
}
```

### Example: Create a loan request with error handling

```typescript
import { createLoanRequest, extractApiErrorMessage } from '../_api/loan-requests-api';
import { toast } from 'sonner';

async function handleCreate() {
  try {
    const newRequest = await createLoanRequest({
      property: 5,
      requested_amount: "5000000.00",
      loan_term: 60,
      ltv: "75.00"
    });
    
    toast.success('Loan request created successfully!');
    return newRequest;
    
  } catch (error) {
    const message = extractApiErrorMessage(error);
    // Returns user-friendly message like:
    // "property: You do not own this property."
    // or "You must publish the property's memorandum..."
    
    toast.error(message);
  }
}
```

### Example: Update a loan request

```typescript
import { updateLoanRequest } from '../_api/loan-requests-api';

async function handleUpdate(requestId: number) {
  try {
    const updated = await updateLoanRequest(requestId, {
      requested_amount: "5500000.00",
      loan_term: 72,
    });
    
    console.log('Updated:', updated);
    
  } catch (error) {
    // Handle error
    if (isBadRequestError(error)) {
      // Validation error or closed request
    }
    
    if (isForbiddenError(error)) {
      // Not the owner
    }
  }
}
```

### Example: Delete a loan request

```typescript
import { deleteLoanRequest } from '../_api/loan-requests-api';

async function handleDelete(requestId: number) {
  try {
    await deleteLoanRequest(requestId);
    toast.success('Loan request deleted');
    
  } catch (error) {
    const message = extractApiErrorMessage(error);
    toast.error(message);
  }
}
```

### Example: Accept a quote

```typescript
import { acceptQuote } from '../_api/loan-request-detail-api';

async function handleAcceptQuote(quoteId: number) {
  try {
    await acceptQuote(quoteId);
    toast.success('Quote accepted successfully!');
    
    // Refresh data
    queryClient.invalidateQueries(['loan-requests']);
    queryClient.invalidateQueries(['sponsor-dashboard']);
    
  } catch (error) {
    toast.error(extractApiErrorMessage(error));
  }
}
```

### Example: Fetch loan request details with quotes

```typescript
import { fetchLoanRequestDetail, fetchQuotesForLoanRequest } from '../_api/loan-request-detail-api';

async function loadRequestDetails(requestId: number) {
  try {
    const request = await fetchLoanRequestDetail(requestId);
    const quotes = await fetchQuotesForLoanRequest(requestId);
    
    console.log('Request:', request.property_name);
    console.log('Quotes received:', quotes.length);
    
  } catch (error) {
    console.error('Failed to load details:', error);
  }
}
```

## 📚 Documentation

- **API Endpoints**: See [loan-requests-api-docs.md](./loan-requests-api-docs.md)
- **Integration Details**: See [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
- **Type Definitions**: Check `loan-requests-api.ts` for full TypeScript types

## 🔑 Key Types

### SponsorLoanRequestItem
```typescript
interface SponsorLoanRequestItem {
  id: number;
  property: number;
  property_name: string;
  property_address: string;
  property_type: string;
  occupancy?: string;
  year_built?: number;
  property_image_url?: string | null;
  requested_amount: string;
  loan_term: number;
  ltv: string;
  status: string; // 'Active' | 'Under Review' | 'Closed' | 'Pending'
  created_at?: string;
  updated_at?: string;
  memorandum_links?: Array<{id: number; title: string; url: string}>;
  document_links?: Array<{id: number; url: string}>;
}
```

### CreateLoanRequestPayload
```typescript
interface CreateLoanRequestPayload {
  property: number;
  requested_amount: string | number;
  loan_term: number;
  ltv: string | number;
}
```

### UpdateLoanRequestPayload
```typescript
interface UpdateLoanRequestPayload {
  requested_amount?: string | number;
  loan_term?: number;
  ltv?: string | number;
}
```

## 🛡️ Error Handling

All API functions throw errors on failure. Use the provided helper functions for consistent error handling:

### extractApiErrorMessage(error)
Extracts user-friendly error messages from API responses:
- Handles field-specific validation errors
- Handles general error messages
- Provides fallback for network errors

### isForbiddenError(error)
Returns `true` if error is 403 (Permission Denied)

### isBadRequestError(error)
Returns `true` if error is 400 (Validation Error)

## 🔒 Authentication

All endpoints require JWT authentication. The token should be included in the Authorization header:

```
Authorization: Bearer <access_token>
```

The `apiClient` (imported from `@/lib/apiClient`) handles this automatically.

## 📊 Status Values

| Status | Description |
|--------|-------------|
| `Active` | Request is open and accepting quotes |
| `Under Review` | Being reviewed by lenders |
| `Closed` | Request is closed (cannot be updated) |
| `Pending` | Initial status |

## ⚠️ Important Notes

1. **Sponsors Only**: Only Sponsor accounts can create, update, or delete loan requests
2. **Property Ownership**: Can only create requests for owned properties
3. **Memorandum Required**: Property must have published memorandum
4. **Closed Requests**: Cannot update or delete closed requests
5. **Lender Visibility**: Lenders can only view Active requests

## 🔄 API Response Format

All endpoints return a standardized response:

```typescript
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T | null;
  errors: Record<string, string[]> | null;
}
```

The API functions automatically extract the `data` field, so you work directly with the typed data.

## 🐛 Debugging

Enable detailed logging:

```typescript
// API functions already log errors to console
// Check browser console for detailed error information
```

## 📞 Support

For API issues or questions, refer to:
1. [loan-requests-api-docs.md](./loan-requests-api-docs.md) - Complete endpoint documentation
2. [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - Integration details
3. Backend API documentation

# Loan Requests API Documentation

## Base URL
`http://localhost:8000` or as configured in `NEXT_PUBLIC_BASE_URL`

## Authentication
All endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer <access_token>
```

---

## 1. LOAN REQUESTS ENDPOINTS

### 1.1 List/Create Loan Requests

**Endpoint:** `GET/POST /api/loans/requests/`

**Authentication:** Required (JWT Token)

**Permissions:**
- Both Sponsors and Lenders (GET)
- Sponsors only (POST)

#### GET - List Loan Requests

**Description:** 
- Sponsors see their own loan requests
- Lenders see all Active loan requests

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `page_size` (optional): Number of items per page (default: 9)

**Request Example:**
```http
GET /api/loans/requests/?page=1&page_size=9
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": {
    "count": 25,
    "next": "http://localhost:8000/api/loans/requests/?page=2",
    "previous": null,
    "total_pages": 3,
    "current_page": 1,
    "page_size": 9,
    "results": [
      {
        "id": 1,
        "property": 5,
        "property_name": "Sunset Plaza Apartments",
        "property_address": "123 Main St, Los Angeles, CA",
        "property_type": "Multifamily",
        "occupancy": "92.50",
        "year_built": 2015,
        "property_image_url": "http://localhost:8000/media/properties/sunset_plaza.jpg",
        "requested_amount": "5000000.00",
        "loan_term": 60,
        "ltv": "75.00",
        "status": "Active",
        "created_at": "2026-10-20T08:15:30.000000Z"
      }
    ]
  },
  "errors": null
}
```

#### POST - Create Loan Request

**Description:** Create a new loan request (Sponsors only)

**Request Body:**
```json
{
  "property": 5,
  "requested_amount": "5000000.00",
  "loan_term": 60,
  "ltv": "75.00"
}
```

**Request Example:**
```http
POST /api/loans/requests/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "property": 5,
  "requested_amount": "5000000.00",
  "loan_term": 60,
  "ltv": "75.00"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Loan request created successfully.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": {
    "id": 1,
    "property": 5,
    "property_name": "Sunset Plaza Apartments",
    "property_address": "123 Main St, Los Angeles, CA",
    "property_type": "Multifamily",
    "occupancy": "92.50",
    "year_built": 2015,
    "property_image_url": "http://localhost:8000/media/properties/sunset_plaza.jpg",
    "requested_amount": "5000000.00",
    "loan_term": 60,
    "ltv": "75.00",
    "status": "Active",
    "created_at": "2026-10-26T10:30:00.000000Z",
    "updated_at": "2026-10-26T10:30:00.000000Z",
    "memorandum_links": [
      {
        "id": 10,
        "title": "Investment Memorandum Q3 2026",
        "url": "http://localhost:8000/api/memorandums/10/"
      }
    ],
    "document_links": [
      {
        "id": 3,
        "url": "http://localhost:8000/media/media_files/financial_report.pdf"
      }
    ]
  },
  "errors": null
}
```

**Error Responses:**

**400 - Property Not Owned:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Loan request creation failed.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": null,
  "errors": {
    "property": [
      "You do not own this property."
    ]
  }
}
```

**400 - No Published Memorandum:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Loan request creation failed.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": null,
  "errors": {
    "property": [
      "You must publish the property's memorandum before submitting a loan request."
    ]
  }
}
```

**403 - Lender Attempting Creation:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Only Sponsor accounts can create loan requests.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": null,
  "errors": null
}
```

---

### 1.2 Retrieve/Update/Delete Loan Request

**Endpoint:** `GET/PATCH/DELETE /api/loans/requests/<int:pk>/`

**Authentication:** Required

#### GET - Retrieve Loan Request Details

**Description:** Retrieve detailed information about a specific loan request

**Request Example:**
```http
GET /api/loans/requests/1/
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Loan request retrieved successfully.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": {
    "id": 1,
    "property": 5,
    "property_name": "Sunset Plaza Apartments",
    "property_address": "123 Main St, Los Angeles, CA",
    "property_type": "Multifamily",
    "occupancy": "92.50",
    "year_built": 2015,
    "property_image_url": "http://localhost:8000/media/properties/sunset_plaza.jpg",
    "requested_amount": "5000000.00",
    "loan_term": 60,
    "ltv": "75.00",
    "status": "Active",
    "created_at": "2026-10-20T08:15:30.000000Z",
    "updated_at": "2026-10-26T10:30:00.000000Z",
    "memorandum_links": [
      {
        "id": 10,
        "title": "Investment Memorandum Q3 2026",
        "url": "http://localhost:8000/api/memorandums/10/"
      }
    ],
    "document_links": [
      {
        "id": 3,
        "url": "http://localhost:8000/media/media_files/financial_report.pdf"
      }
    ]
  },
  "errors": null
}
```

**Error Response (404) - Lender Viewing Non-Active Request:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Loan request not found.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": null,
  "errors": null
}
```

#### PATCH - Update Loan Request

**Description:** Update loan request details (Sponsors only, cannot update closed requests)

**Request Body (all fields optional):**
```json
{
  "requested_amount": "5500000.00",
  "loan_term": 72,
  "ltv": "80.00",
  "status": "Under Review"
}
```

**Request Example:**
```http
PATCH /api/loans/requests/1/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "requested_amount": "5500000.00",
  "status": "Under Review"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Loan request updated successfully.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": {
    "id": 1,
    "property": 5,
    "property_name": "Sunset Plaza Apartments",
    "property_address": "123 Main St, Los Angeles, CA",
    "property_type": "Multifamily",
    "occupancy": "92.50",
    "year_built": 2015,
    "property_image_url": "http://localhost:8000/media/properties/sunset_plaza.jpg",
    "requested_amount": "5500000.00",
    "loan_term": 60,
    "ltv": "75.00",
    "status": "Under Review",
    "created_at": "2026-10-20T08:15:30.000000Z",
    "updated_at": "2026-10-26T10:35:00.000000Z",
    "memorandum_links": [...],
    "document_links": [...]
  },
  "errors": null
}
```

**Error Responses:**

**400 - Updating Closed Request:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Update failed.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": null,
  "errors": {
    "status": [
      "Cannot update a closed loan request."
    ]
  }
}
```

**403 - Permission Denied:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You do not have permission to update this loan request.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": null,
  "errors": null
}
```

#### DELETE - Delete Loan Request

**Description:** Delete a loan request (Sponsors only)

**Request Example:**
```http
DELETE /api/loans/requests/1/
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Loan request deleted successfully.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": null,
  "errors": null
}
```

**Error Response (403):**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You do not have permission to delete this loan request.",
  "timestamp": "2026-10-26T10:30:00.000000Z",
  "data": null,
  "errors": null
}
```

---

## Status Values

Loan request status can be one of:
- `Active` - Request is open and accepting quotes
- `Under Review` - Request is being reviewed
- `Closed` - Request is closed (cannot be updated)
- `Pending` - Initial status

---

## Notes

1. **Property Ownership:** Sponsors can only create loan requests for properties they own
2. **Memorandum Requirement:** Property must have a published memorandum before creating a loan request
3. **Lender Visibility:** Lenders can only see Active loan requests
4. **Closed Requests:** Closed loan requests cannot be updated or deleted
5. **Pagination:** The API supports pagination with configurable page size
6. **Image URLs:** Property image URLs are returned with proper base URL configuration

# Loan Quote Detail API Documentation

## Overview
This document describes the API endpoint for retrieving detailed information about a specific loan quote.

## Endpoint

```
GET /api/loans/quotes/{quote_id}/
```

## Authentication
- **Required**: Yes
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <access_token>`

## Access Control
Only the following users can view a quote:
- The **lender** who submitted the quote
- The **sponsor** who owns the associated loan request

## URL Parameters

| Parameter | Type    | Required | Description              |
|-----------|---------|----------|--------------------------|
| quote_id  | integer | Yes      | The ID of the loan quote |

## Success Response (200 OK)

### Example Request
```http
GET /api/loans/quotes/5/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example Response
```json
{
    "success": true,
    "statusCode": 200,
    "message": "Quote retrieved successfully.",
    "timestamp": "2026-10-26T14:30:45.123456Z",
    "data": {
        "id": 5,
        "loan_request": 12,
        "lender": 8,
        "lender_name": "ABC Capital Partners",
        "guarantor": "John Smith, XYZ Holdings LLC",
        "status": "Submitted",
        "expires_at": "2026-11-15T23:59:59Z",
        "submitted_at": "2026-10-20T10:15:30Z",
        "updated_at": "2026-10-20T10:15:30Z",
        "loan_amount": "5000000.00",
        "initial_funding": "3000000.00",
        "future_funding": "2000000.00",
        "sponsor_equity": "1250000.00",
        "max_as_is_ltv": "70.00",
        "max_ltc": "75.00",
        "max_as_stabilized_ltv": "65.00",
        "min_as_is_dy": "9.50",
        "min_stabilized_dy": "10.00",
        "term": 36,
        "interest_rate": "7.25",
        "amortization": "Interest Only",
        "prepayment": "Yield Maintenance",
        "origination_fee": "1.50",
        "capex_reserve": "150000.00",
        "ff_and_e_reserve": "75000.00",
        "interest_carry_reserve": "200000.00",
        "extension_conditions": "Two 12-month extension options subject to debt service coverage ratio of 1.25x",
        "collateral": "First mortgage lien on subject property",
        "recourse": "Non-recourse with standard carve-outs",
        "dscr": 1.31
    },
    "errors": null
}
```

## Error Responses

### 1. Unauthorized (401)
**Scenario**: Missing or invalid authentication token

```json
{
    "success": false,
    "statusCode": 401,
    "message": "Authentication credentials were not provided.",
    "timestamp": "2026-10-26T14:30:45.123456Z",
    "data": null,
    "errors": {
        "detail": "Authentication credentials were not provided."
    }
}
```

### 2. Forbidden (403)
**Scenario**: User doesn't have permission to view this quote (not the lender or the sponsor of the loan request)

```json
{
    "success": false,
    "statusCode": 403,
    "message": "You do not have permission to view this quote.",
    "timestamp": "2026-10-26T14:30:45.123456Z",
    "data": null,
    "errors": null
}
```

### 3. Not Found (404)
**Scenario**: Quote ID doesn't exist

```json
{
    "success": false,
    "statusCode": 404,
    "message": "Not found.",
    "timestamp": "2026-10-26T14:30:45.123456Z",
    "data": null,
    "errors": {
        "detail": "Not found."
    }
}
```

## Field Descriptions

| Field                  | Type             | Description                                                    |
|-----------------------|------------------|----------------------------------------------------------------|
| id                    | integer          | Unique identifier for the quote                                |
| loan_request          | integer          | ID of the associated loan request                              |
| lender                | integer          | ID of the lender user                                          |
| lender_name           | string           | Name of the lending institution                                |
| guarantor             | string           | Guarantor information                                          |
| status                | string           | One of: "Submitted", "Under Review", "Accepted", "Declined", "Expired" |
| expires_at            | datetime (nullable) | When the quote expires (ISO 8601 format)                    |
| submitted_at          | datetime         | When the quote was submitted (ISO 8601 format)                 |
| updated_at            | datetime         | Last update timestamp (ISO 8601 format)                        |
| loan_amount           | decimal          | Total loan amount                                              |
| initial_funding       | decimal          | Initial funding amount                                         |
| future_funding        | decimal          | Future funding amount                                          |
| sponsor_equity        | decimal          | Required sponsor equity                                        |
| max_as_is_ltv         | decimal          | Maximum as-is Loan-to-Value percentage                         |
| max_ltc               | decimal          | Maximum Loan-to-Cost percentage                                |
| max_as_stabilized_ltv | decimal          | Maximum as-stabilized LTV percentage                           |
| min_as_is_dy          | decimal          | Minimum as-is debt yield percentage                            |
| min_stabilized_dy     | decimal          | Minimum stabilized debt yield percentage                       |
| term                  | integer          | Loan term in months                                            |
| interest_rate         | decimal          | Interest rate percentage                                       |
| amortization          | string           | Amortization schedule details                                  |
| prepayment            | string           | Prepayment terms                                               |
| origination_fee       | decimal          | Origination fee percentage                                     |
| capex_reserve         | decimal          | Capital expenditure reserve amount                             |
| ff_and_e_reserve      | decimal          | Furniture, fixtures, and equipment reserve                     |
| interest_carry_reserve| decimal          | Interest carry reserve amount                                  |
| extension_conditions  | string           | Conditions for loan extension                                  |
| collateral            | string           | Collateral details                                             |
| recourse              | string           | Recourse terms                                                 |
| dscr                  | decimal (computed) | Debt Service Coverage Ratio (calculated field)               |

## Important Notes

### DSCR Calculation
The DSCR (Debt Service Coverage Ratio) is **automatically computed** by the backend using the formula:
```
DSCR = (loan_amount × min_as_is_dy / 100) / (loan_amount × interest_rate / 100)
```
This is a read-only calculated field and cannot be set directly.

### Timestamp Format
All timestamps follow **ISO 8601 format** with timezone information:
```
YYYY-MM-DDTHH:MM:SS.ffffffZ
```
Example: `2026-10-26T14:30:45.123456Z`

### Quote Status Values
The `status` field can have one of the following values:
- **"Submitted"**: Quote has been submitted and is pending review
- **"Under Review"**: Quote is being reviewed by the sponsor
- **"Accepted"**: Quote has been accepted by the sponsor
- **"Declined"**: Quote has been declined by the sponsor
- **"Expired"**: Quote has expired based on the `expires_at` date

### Access Control Details
- **Lenders** can only view quotes they have submitted
- **Sponsors** can only view quotes for loan requests they own
- Any attempt to access a quote without proper permissions will result in a **403 Forbidden** error
- The backend automatically checks user role and ownership before returning data

## Frontend Implementation

### API Client Location
```
app/(dashboard)/(sponsor)/_api/loan-request-detail-api.ts
```

### Usage Example
```typescript
import { fetchQuoteDetail } from '@/app/(dashboard)/(sponsor)/_api/loan-request-detail-api';

try {
  const quote = await fetchQuoteDetail(5);
  console.log('Quote:', quote);
} catch (error) {
  console.error('Failed to fetch quote:', error.message);
}
```

### Type Definitions
```typescript
// Located in: app/(dashboard)/(sponsor)/loan/_components/loan-types.ts
export interface LoanQuoteDetail {
  id: number;
  loan_request: number;
  lender: number;
  lender_name: string;
  guarantor: string;
  status: string;
  expires_at: string | null;
  submitted_at: string;
  updated_at: string;
  loan_amount: string;
  initial_funding: string;
  future_funding: string;
  sponsor_equity: string;
  max_as_is_ltv: string;
  max_ltc: string;
  max_as_stabilized_ltv: string;
  min_as_is_dy: string;
  min_stabilized_dy: string;
  term: string | number;
  interest_rate: string | number;
  amortization: string;
  prepayment: string;
  origination_fee: string | number;
  capex_reserve: string;
  ff_and_e_reserve: string;
  interest_carry_reserve: string;
  extension_conditions: string;
  collateral: string;
  recourse: string;
  dscr: number;
}
```

## Related Endpoints

- **GET /api/loans/requests/{id}/**: Get loan request details
- **GET /api/loans/requests/{id}/quotes/**: Get all quotes for a loan request
- **POST /api/loans/quotes/{id}/accept/**: Accept a quote
- **POST /api/loans/quotes/{id}/decline/**: Decline a quote

# Loan Requests Page - New Design

## Overview
Redesigned loan requests page for lenders with a modern card-based grid layout and map view toggle.

## Components

### 1. LoanRequestsGrid.tsx
Main component that orchestrates the entire page.

**Features:**
- List/Map view toggle
- Search by property name or address
- Filter by property type, amount, and term
- Pagination (6 items per page)
- Mock data structure for design purposes

**State Management:**
- `viewMode`: Toggle between "list" and "map"
- `searchQuery`: Text search input
- `propertyTypeFilter`: Filter by property type
- `amountFilter`: Filter by loan amount range
- `termFilter`: Filter by loan term range
- `currentPage`: Current pagination page

### 2. LoanRequestCard.tsx
Individual property card component.

**Layout:**
- Status badge (Active)
- Property image placeholder
- Property name and address
- Three-column grid: Amount, Term, LTV
- Additional info: Type, Occupancy, Year Built
- Two action buttons: "Submit quote" and "Details"

### 3. LoanRequestsMapView.tsx
Google Maps integration for map view.

**Features:**
- 2D/Satellite/Street view toggle
- Interactive markers for each property
- Info window popup on marker click
- Property photo, name, address, type
- "View loan request" button in popup

### 4. types.ts
Shared TypeScript types for type safety.

## Mock Data Structure

```typescript
{
  id: number;
  propertyName: string;
  address: string;
  amount: string; // e.g., "$5.0M"
  term: string; // e.g., "5 yrs"
  ltv: string; // e.g., "75%"
  propertyType: string;
  occupancy: string; // e.g., "85.5%"
  yearBuilt: string;
  status: string;
  propertyImage: string | null;
  location: { lat: number; lng: number; }
}
```

## API Integration Points (To Be Implemented)

### Required API Endpoints:
1. **GET /api/v1/loans/requests/** - Fetch all loan requests
2. **GET /api/v1/loans/requests/:id/** - Fetch single loan request details

### Data Transformation Needed:
- Convert API numeric values to display strings (e.g., 5000000 → "$5.0M")
- Convert term from months to years display
- Calculate and format LTV percentage
- Handle property image URL resolution

### Actions to Implement:
1. `handleSubmitQuote(id)` - Navigate to quote submission page
2. `handleViewDetails(id)` - Navigate to loan request detail page
3. Apply filters to API requests or client-side filtering
4. Implement pagination with API
5. Implement search functionality

## Styling
- Uses Tailwind CSS utility classes
- Responsive design (mobile, tablet, desktop)
- Gray-50 background for page
- White cards with border and hover effects
- Blue-600 primary action color

## Dependencies
- @react-google-maps/api - For map functionality
- react-icons/fi - For icons
- next/image - For optimized images

## Environment Variables Required
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Next Steps
1. Replace mock data with actual API integration
2. Implement navigation to detail and quote pages
3. Add loading states
4. Add error handling
5. Implement actual filtering logic
6. Add responsive breakpoints testing
7. Implement actual pagination with backend

// Display type for UI components
export type LoanRequest = {
  id: number;
  propertyId: number;
  propertyName: string;
  address: string;
  amount: string;
  term: string;
  ltv: string;
  propertyType: string;
  occupancy: string;
  yearBuilt: string;
  status: string;
  propertyImage: string;
  location: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  rawAmount: number;
  rawTerm: number;
};

export type FilterState = {
  searchQuery: string;
  propertyType: string;
  amount: string;
  term: string;
};

export type ViewMode = "list" | "map";

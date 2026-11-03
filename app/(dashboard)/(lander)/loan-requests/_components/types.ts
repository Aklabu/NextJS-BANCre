export type LoanRequest = {
  id: number;
  propertyName: string;
  address: string;
  amount: string;
  term: string;
  ltv: string;
  propertyType: string;
  occupancy: string;
  yearBuilt: string;
  status: string;
  propertyImage: string | null;
  location: {
    lat: number;
    lng: number;
  };
};

export type FilterState = {
  searchQuery: string;
  propertyType: string;
  amount: string;
  term: string;
};

export type ViewMode = "list" | "map";

//========== Section Block Types (new API format) ===========

export interface HeadingBlock {
  type: "heading";
  level: number;
  text: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface ListBlock {
  type: "list";
  items: string[];
}

export interface TableBlock {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface KeyValueRow {
  key: string;
  label: string;
  value: string;
  value_type: string;
}

export interface KeyValueTableBlock {
  type: "key_value_table";
  rows: KeyValueRow[];
}

export type SectionBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | KeyValueTableBlock;

export interface MemorandumTableData {
  columns: string[];
  rows: (string | number | null | undefined)[][];
}

export interface MemorandumSection {
  id: number;
  section_type: string; // e.g., "property_information", "executive_summary", "financial_analysis"
  section_key?: string; // Alternative identifier for sections
  label?: string; // Display label for the section
  title: string;
  content: string;
  blocks?: SectionBlock[];
  attachment?: string | null; // Relative file path
  attachment_url?: string | null; // Full URL for download
  order: number;
  updated_at?: string;
  // Additional fields used in dynamic sections
  image?: string | null;
  image_url?: string | null;
  table_data?: MemorandumTableData | null;
  is_regeneratable?: boolean;
}

//========== Memorandum Detail Page Types ===========

export interface MemorandumDetailData {
  title: string;
  subtitle: string;
  heroImage: string;
  galleryImages: string[];
  property_images?: string[];
  thumbnail_url?: string | null;
  property_image_url?: string | null;
  executiveSummary: string;
  propertyOverview: PropertyOverviewData;
  propertyOverviewContent?: string;
  propertyHighlights: string;
  areaOverview: AreaOverviewData;
  areaHighlights: string;
  marketSummary: MarketSummaryData;
  financingSummary: string;
  presentedBy: string;
  confidential: boolean;
  investmentOpportunity: string;
  propertyName: string;
  location: string;
  propertyStats: PropertyStats;
  offeringDate: string;
}

//========== Property Overview Types ===========

export interface PropertyOverviewData {
  propertyName: string;
  address: string;
  zipCode: string;
  yearBuilt: number;
  yearRenovated?: number;
  propertyType: string;
  numberOfUnits: number;
  rentableArea: number;
  occupancy: number;
  parkingSpaces: number;
}

//========== Property Stats Types ===========

export interface PropertyStats {
  propertyType: string;
  units: number;
  yearBuilt: number;
  occupancy: number;
}

//========== Area Overview Types ===========

export interface AreaOverviewData {
  description: string;
  neighborhoodDescription: string;
  localAmenities: string;
}

//========== Market Summary Types ===========

export interface MarketSummaryData {
  description: string;
  keyIndicators: MarketIndicator[];
}

export interface MarketIndicator {
  label: string;
  value: string;
}

//========== Table of Contents Types ===========

export interface TableOfContentsItem {
  id: number;
  title: string;
  pageNumber: number;
  anchorId?: string;
}

//========== Additional Section Types ===========

export interface AdditionalSection {
  id: string;
  label: string;
  icon: string;
}

//========== Tab Types ===========

export type MemorandumTab = "editor" | "preview";

//========== Component Props Types ===========

export interface MemorandumHeaderProps {
  memorandumId?: number | string;
  title: string;
  subtitle: string;
  status?: string; // "draft", "published", "generating", "failed"
  mode?: string;
  activeTab: MemorandumTab;
  onTabChange: (tab: MemorandumTab) => void;
  canPublish?: boolean;
  isPublishing?: boolean;
  onPublish?: () => void;
  onExport?: () => void;
  onRegenerateAll?: () => void;
  isRegeneratingAll?: boolean;
}

export interface HeroSectionProps {
  heroImage: string;
  galleryImages: string[];
  title: string;
}

export interface ExecutiveSummaryProps {
  content: string;
  isAiGenerated: boolean;
  onEdit?: (content: string) => void | Promise<void>;
}

export interface PropertyOverviewProps {
  data: PropertyOverviewData;
  markdownContent?: string;
  onEdit?: (content: string) => void | Promise<void>;
  onAiGenerate?: () => void;
}

export interface PropertyHighlightsProps {
  highlights: string;
  isAiGenerated: boolean;
  onEdit?: (content: string) => void | Promise<void>;
}

export interface AreaOverviewProps {
  data: AreaOverviewData;
  isAiGenerated: boolean;
  onEdit?: (content: string) => void | Promise<void>;
}

export interface AreaHighlightsProps {
  highlights: string;
  isAiGenerated: boolean;
  initialImageUrl?: string;
  onEdit?: (content: string) => void | Promise<void>;
  onImageUpload?: (file: File) => Promise<string | void>;
}

export interface MarketSummaryProps {
  data: MarketSummaryData;
  isAiGenerated: boolean;
  onEdit?: (content: string) => void | Promise<void>;
}

export interface FinancingSummaryProps {
  content: string;
  onEdit?: (content: string) => void | Promise<void>;
  onAiGenerate?: () => void;
}

export interface AddSectionsProps {
  sections: AdditionalSection[];
  onAddSection: (sectionId: string) => void;
}

//========== Section Form Data Types ===========

export interface SectionFormData {
  sectionTitle: string;
  sectionContent: string;
  sectionType: string;
}

//========== Financial Analysis Types ===========

export interface LoanQuote {
  lender: string;
  leverage: string;
  dscr: string;
  amortization: string;
  loanType: string;
  rate: string;
  indexSpread: string;
  originationFee: string;
  prepayment: string;
}

export interface LoanRequest {
  loanAmount: string;
  estimatedValue: string;
  ltv: string;
  financingType: string;
  term: string;
  interestRate: string;
  amortization: string;
  prepayment: string;
  dscrIoi: string;
  dyNoi: string;
}

export interface PropertyDetails {
  propertyName: string;
  address: string;
  cityState: string;
  yearBuilt: string;
  yearRenovated: string;
  rentableArea: string;
  occupancy: string;
}

export interface SourceItem {
  source: string;
  amount: string;
  psf: string;
}

export interface UseItem {
  use: string;
  amount: string;
  psf: string;
}

export interface FinancialPerformance {
  category: string;
  trailing12: string;
  date: string;
  percentage: string;
  underwriting: string;
  inPlace: string;
  psf: string;
}

export interface FinancialAnalysisData {
  loanQuotes: LoanQuote[];
  loanRequest: LoanRequest;
  propertyDetails: PropertyDetails;
  sources: SourceItem[];
  uses: UseItem[];
  totalSources: string;
  totalUses: string;
  financialPerformance: FinancialPerformance[];
  loanRatingNote: string;
}

//========== Sales Comparables Types ===========

export interface SalesComparable {
  id: number;
  address: string;
  saleDate: string;
  salePrice: string;
  priceUnit: string;
  units: number;
  yearBuilt: number;
  squareFeet: number;
  capRate: string;
}

export interface SalesComparablesData {
  comparables: SalesComparable[];
  mapImage: string;
}

//========== Lease Comparables Types ===========

export interface LeaseComparable {
  id: number;
  address: string;
  unitType: string;
  squareFeet: number;
  monthlyRent: string;
  rentPsf: string;
  leaseDate: string;
}

export interface LeaseStats {
  averageRent: string;
  avgRentPsf: string;
  marketTrend: string;
}

export interface LeaseComparablesData {
  comparables: LeaseComparable[];
  stats: LeaseStats;
}

//========== Area Amenities Types ===========

export interface Amenity {
  id: number;
  name: string;
  category: string;
  distance: string;
  rating?: number;
  icon: string;
}

export interface AreaAmenitiesData {
  heroImage: string;
  amenities: Amenity[];
}

//========== Sponsorship Types ===========

export interface SponsorshipData {
  companyName: string;
  companyLogo: string;
  description: string;
  totalAssets: string;
  propertiesManaged: number;
  yearEstablished: number;
}

//========== Disclaimer Types ===========

export interface DisclaimerNotice {
  title: string;
  content: string;
}

export interface DisclaimerCard {
  id: number;
  icon: string;
  title: string;
  description: string;
}

export interface DisclaimerData {
  mainNotices: DisclaimerNotice[];
  cards: DisclaimerCard[];
}

//========== Preview Cover Types ===========

export interface PreviewCoverStats {
  yearBuilt: number;
}

export interface PreviewCoverProps {
  presentedBy: string;
  confidential: boolean;
  investmentOpportunity: string;
  propertyName: string;
  location: string;
  stats: PreviewCoverStats;
  offeringDate: string;
  coverImage?: string;
}

export interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

export interface PreviewSectionProps {
  sectionNumber: number;
  title: string;
  children: React.ReactNode;
  anchorId?: string;
}

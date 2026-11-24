// ============================================================
// Section Block Types — prose sections use blocks[]
// ============================================================

export interface HeadingBlock {
  type: "heading";
  level: number;
  content: string; // API field name is "content"
}

export interface ParagraphBlock {
  type: "paragraph";
  content: string;
}

/** bullet_list — array of string items */
export interface BulletListBlock {
  type: "bullet_list";
  items: string[];
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

/** Generic table block inside prose sections */
export interface TableBlock {
  type: "table";
  columns: { key: string; label: string; data_type: string; sortable: boolean }[];
  rows: Record<string, string>[];
}

export type SectionBlock =
  | HeadingBlock
  | ParagraphBlock
  | BulletListBlock
  | KeyValueTableBlock
  | TableBlock;

// ============================================================
// section_data Envelope — table sections use this instead of blocks
// ============================================================

export type SectionDataStatus = "complete" | "no_data";

/** Shared outer envelope for every table section */
export interface SectionDataEnvelope<T> {
  schema_version: string;
  type: string;
  status: SectionDataStatus;
  data: T;
}

// ---- financial_analysis ----
export interface FinancialAnalysisRow {
  label: string;
  values: number[];
  category: "income" | "expense" | "noi";
}

export interface FinancialAnalysisKpi {
  label: string;
  value: number;
  format: "percent" | "currency" | "number" | "text";
}

export interface FinancialAnalysisData {
  type: "financial_analysis";
  periods: string[];
  rows: FinancialAnalysisRow[];
  kpis: FinancialAnalysisKpi[];
}

// ---- financing_summary ----
export interface FinancingLoan {
  lender: string;
  status: string;
  loan_amount: number;
  interest_rate: number;
  rate_type: string;
  maturity_date: string | null;
  amortization_years: number | null;
  loan_term_years: number | null;
  ltv: number | null;
  ltc: number | null;
  monthly_interest: number | null;
  monthly_principal: number | null;
  annual_debt_service: number | null;
  prepayment_terms: string | null;
  recourse: string | null;
  guarantees: string | null;
  notes: string | null;
}

export interface FinancingReserve {
  label: string;
  annual: number;
  monthly: number;
}

export interface FinancingCoverage {
  period: string;
  dscr: number;
}

export interface FinancingSummaryData {
  type: "financing_summary";
  loans: FinancingLoan[];
  reserves: FinancingReserve[];
  coverage: FinancingCoverage[];
  missing_fields: string[];
}

// ---- market_summary ----
export interface MarketSummarySection {
  heading: string;
  paragraphs: string[];
}

export interface MarketSummaryMetric {
  label: string;
  value: string | number;
  format: "percent" | "currency" | "number" | "text";
}

export interface MarketSummaryData {
  type: "market_summary";
  sections: MarketSummarySection[];
  metrics: MarketSummaryMetric[];
  tables: unknown[];
  data_gaps: string[];
}

// ---- sales_comparables / lease_comparables ----
export interface ComparablesSubjectContext {
  address: string;
  units: number;
  notes: string;
}

export interface ComparablesData {
  type: "sales_comparables" | "lease_comparables";
  status: SectionDataStatus;
  columns: string[];
  rows: string[][];
  subject_context: ComparablesSubjectContext | null;
  reason: string | null;
}

// Union of all section_data.data shapes
export type SectionDataPayload =
  | FinancialAnalysisData
  | FinancingSummaryData
  | MarketSummaryData
  | ComparablesData;

// ============================================================
// MemorandumSection — single section from API
// ============================================================

/** Legacy table_data shape (kept for backwards compat with other pages) */
export interface MemorandumTableData {
  columns: string[];
  rows: (string | number | null | undefined)[][];
}

export interface MemorandumSection {
  id: number;
  section_type: string;
  section_key?: string;
  label?: string;
  title: string;
  content: string;
  blocks?: SectionBlock[] | null;
  /** New API: structured data for table sections */
  section_data?: SectionDataEnvelope<SectionDataPayload> | null;
  /** Legacy: kept for backwards compat */
  table_data?: MemorandumTableData | null;
  attachment?: string | null;
  attachment_url?: string | null;
  order: number;
  updated_at?: string;
  image?: string | null;
  image_url?: string | null;
  is_regeneratable?: boolean;
  markdown?: string | null;
}

// ============================================================
// Memorandum top-level API response (data object)
// ============================================================

export interface MemorandumApiData {
  id: number;
  title: string;
  property: number;
  property_name: string;
  property_address: string;
  property_type: string;
  number_of_units: number;
  rentable_area: string;
  year_built: number;
  year_renovated: number | null;
  occupancy: string;
  parking_spaces: number;
  property_image_url: string | null;
  status: "generating" | "draft" | "published" | "failed";
  progress: number;
  current_batch: number;
  created_at: string;
  updated_at: string;
  sections: MemorandumSection[];
}

// ============================================================
// Memorandum Detail Page Types (UI state shapes)
// ============================================================

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
  marketSummary: LegacyMarketSummaryData;
  financingSummary: string;
  presentedBy: string;
  confidential: boolean;
  investmentOpportunity: string;
  propertyName: string;
  location: string;
  propertyStats: PropertyStats;
  offeringDate: string;
}

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

export interface PropertyStats {
  propertyType: string;
  units: number;
  yearBuilt: number;
  occupancy: number;
}

export interface AreaOverviewData {
  description: string;
  neighborhoodDescription: string;
  localAmenities: string;
}

/** Legacy market summary shape used by older UI components */
export interface LegacyMarketSummaryData {
  description: string;
  keyIndicators: MarketIndicator[];
}

export interface MarketIndicator {
  label: string;
  value: string;
}

// ============================================================
// Table of Contents
// ============================================================

export interface TableOfContentsItem {
  id: number;
  title: string;
  pageNumber: number;
  anchorId?: string;
}

// ============================================================
// Additional Section / Tab Types
// ============================================================

export interface AdditionalSection {
  id: string;
  label: string;
  icon: string;
}

export type MemorandumTab = "editor" | "preview";

// ============================================================
// Component Props
// ============================================================

export interface MemorandumHeaderProps {
  memorandumId?: number | string;
  title: string;
  subtitle: string;
  status?: string;
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
  data: LegacyMarketSummaryData;
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

export interface SectionFormData {
  sectionTitle: string;
  sectionContent: string;
  sectionType: string;
}

// ============================================================
// Legacy Financial Analysis (UI-only shapes, not from API)
// ============================================================

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

export interface FinancialAnalysisUIData {
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

// ============================================================
// Comparables (legacy UI shapes)
// ============================================================

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

// ============================================================
// Area Amenities / Sponsorship / Disclaimer (UI-only)
// ============================================================

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

export interface SponsorshipData {
  companyName: string;
  companyLogo: string;
  description: string;
  totalAssets: string;
  propertiesManaged: number;
  yearEstablished: number;
}

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

// ============================================================
// Preview / Cover component props
// ============================================================

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

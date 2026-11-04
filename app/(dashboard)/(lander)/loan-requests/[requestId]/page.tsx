"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Briefcase,
  Info,
  ExternalLink,
  ChevronRight,
  Eye,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";
import {
  formatSectionTitle,
  parsePropertyInformationFromSections,
  sanitizeInlineMarkdownText,
} from "@/lib/memorandum";
import PreviewCover from "@/app/(dashboard)/(sponsor)/memorandum/_components/DetailPageComponent/PreviewCover";
import TableOfContents from "@/app/(dashboard)/(sponsor)/memorandum/_components/DetailPageComponent/TableOfContents";
import DynamicPreviewSections from "@/app/(dashboard)/(sponsor)/memorandum/_components/DetailPageComponent/DynamicPreviewSections";
import {
  getSubmitQuotePath,
  saveLoanQuotePrefillState,
} from "@/lib/quote-submit-state";
import {
  fetchLoanRequestDetail,
  normalizeImageUrl,
  formatCurrency,
  formatLoanTerm,
  formatPercent,
  formatDateTime,
  getFileNameFromUrl,
  isPdfUrl,
  isImageUrl,
  getMemorandumIdFromLink,
  downloadDocument,
  type LoanRequestDetail,
  type MemorandumLink,
  type DocumentLink,
} from "./api";

type ApiEnvelope<T> = {
  data?: T;
};

import type { MemorandumSection } from "@/types/memorandum-detail";

type MemorandumDetail = {
  id: number;
  title: string;
  status?: string;
  mode?: string;
  property_name?: string;
  property_address?: string;
  property_type?: string;
  number_of_units?: number;
  year_built?: number;
  occupancy?: string | number;
  sponsor_name?: string;
  created_at?: string;
  sections?: MemorandumSection[];
};

const FALLBACK_PROPERTY_IMAGE = "/images/SponsorDashboard.png";

const toNumber = (value: string | number | undefined | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const requestId = Array.isArray(params.requestId)
    ? params.requestId[0]
    : params.requestId;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<LoanRequestDetail | null>(null);
  const [imageSrc, setImageSrc] = useState(FALLBACK_PROPERTY_IMAGE);
  const [memorandumLoading, setMemorandumLoading] = useState(false);
  const [memorandumDetails, setMemorandumDetails] = useState<
    MemorandumDetail[]
  >([]);
  const [selectedMemorandumId, setSelectedMemorandumId] = useState<
    number | null
  >(null);

  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'memorandum'>('overview');

  const fetchMemorandumDetails = useCallback(
    async (links: MemorandumLink[]) => {
      const validMemorandums = links
        .map((item) => ({
          link: item,
          memorandumId: getMemorandumIdFromLink(item),
        }))
        .filter(
          (
            item,
          ): item is {
            link: MemorandumLink;
            memorandumId: number;
          } => Number.isFinite(item.memorandumId),
        );

      if (validMemorandums.length === 0) {
        setMemorandumDetails([]);
        setSelectedMemorandumId(null);
        return;
      }

      setMemorandumLoading(true);

      try {
        const responses = await Promise.all(
          validMemorandums.map(async ({ memorandumId }) => {
            const response = await api.get<ApiEnvelope<MemorandumDetail>>(
              `/api/memorandums/${memorandumId}/`,
            );

            return response.data?.data ?? null;
          }),
        );

        const fetchedMemorandums = responses
          .filter((item): item is MemorandumDetail => Boolean(item))
          .sort((a, b) => a.id - b.id);

        const publishedMemorandums = fetchedMemorandums.filter(
          (item) => String(item.status || "").toLowerCase() === "published",
        );

        const memorandumsToUse =
          publishedMemorandums.length > 0
            ? publishedMemorandums
            : fetchedMemorandums;

        setMemorandumDetails(memorandumsToUse);
        setSelectedMemorandumId(
          memorandumsToUse[0]?.id ?? validMemorandums[0].memorandumId,
        );
      } catch (error) {
        console.error("Failed to load memorandum details", error);
        toast.error("Unable to load memorandum details right now.");
        setMemorandumDetails([]);
        setSelectedMemorandumId(null);
      } finally {
        setMemorandumLoading(false);
      }
    },
    [],
  );

  const fetchDetail = useCallback(async () => {
    if (!requestId) return;

    setLoading(true);
    try {
      const payload = await fetchLoanRequestDetail(Number(requestId));
      setDetail(payload);
      setImageSrc(normalizeImageUrl(payload?.property_image_url));
      setSelectedDocumentIndex(0);

      if (payload?.memorandum_links?.length) {
        await fetchMemorandumDetails(payload.memorandum_links);
      } else {
        setMemorandumDetails([]);
        setSelectedMemorandumId(null);
      }
    } catch (error: any) {
      console.error("Failed to load loan request detail", error);
      toast.error(error.message || "Unable to load loan request detail right now.");
      setDetail(null);
      setMemorandumDetails([]);
      setSelectedMemorandumId(null);
    } finally {
      setLoading(false);
    }
  }, [fetchMemorandumDetails, requestId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const documents = detail?.document_links || [];
  const selectedDocument = useMemo<DocumentLink | null>(() => {
    if (documents.length === 0) return null;
    return documents[selectedDocumentIndex] || documents[0] || null;
  }, [documents, selectedDocumentIndex]);

  const selectedMemorandum = useMemo(() => {
    if (memorandumDetails.length === 0) return null;
    if (selectedMemorandumId === null) return memorandumDetails[0];
    return (
      memorandumDetails.find((item) => item.id === selectedMemorandumId) ||
      memorandumDetails[0]
    );
  }, [memorandumDetails, selectedMemorandumId]);

  const memorandumSections = useMemo(() => {
    const sections = selectedMemorandum?.sections || [];
    return [...sections].sort((a, b) => {
      if (a.order === b.order) {
        return a.id - b.id;
      }
      return a.order - b.order;
    });
  }, [selectedMemorandum?.sections]);

  const parsedPropertyInformation = useMemo(
    () => parsePropertyInformationFromSections(memorandumSections),
    [memorandumSections],
  );

  const memorandumTableItems = useMemo(
    () =>
      memorandumSections.map((section, index) => ({
        id: index + 1,
        title:
          section.label ||
          section.title ||
          formatSectionTitle(section.section_key || section.section_type),
        pageNumber: index + 3,
        anchorId: `preview-section-${section.id}`,
      })),
    [memorandumSections],
  );

  const memorandumPropertyName =
    sanitizeInlineMarkdownText(
      selectedMemorandum?.property_name ||
        parsedPropertyInformation.propertyName ||
        detail?.property_name ||
        "Property",
    ) || "Property";

  const memorandumLocation =
    sanitizeInlineMarkdownText(
      selectedMemorandum?.property_address ||
        parsedPropertyInformation.address ||
        detail?.property_address ||
        "",
    ) || "";

  const memorandumPropertyType =
    sanitizeInlineMarkdownText(
      selectedMemorandum?.property_type ||
        parsedPropertyInformation.propertyType ||
        detail?.property_type ||
        "N/A",
    ) || "N/A";

  const memorandumUnits =
    Number(selectedMemorandum?.number_of_units) > 0
      ? Number(selectedMemorandum?.number_of_units)
      : Number(parsedPropertyInformation.numberOfUnits) || 0;

  const memorandumYearBuilt =
    Number(selectedMemorandum?.year_built) > 0
      ? Number(selectedMemorandum?.year_built)
      : Number(parsedPropertyInformation.yearBuilt) ||
        Number(detail?.year_built) ||
        0;

  const memorandumOccupancy =
    Number(selectedMemorandum?.occupancy) > 0
      ? Number(selectedMemorandum?.occupancy)
      : Number(parsedPropertyInformation.occupancy) ||
        Number(detail?.occupancy) ||
        0;

  const handleSubmitQuote = () => {
    if (!detail) {
      toast.error("Loan request details are unavailable.");
      return;
    }

    const numericRequestId = Number(detail.id);
    if (!Number.isFinite(numericRequestId) || numericRequestId <= 0) {
      toast.error("Invalid loan request id.");
      return;
    }

    saveLoanQuotePrefillState(numericRequestId, {
      requestId: numericRequestId,
      propertyName: detail.property_name,
      propertyAddress: detail.property_address,
      propertyType: detail.property_type,
      requestedAmount: Number(detail.requested_amount),
      loanTerm: Number(detail.loan_term),
      ltv: Number(detail.ltv),
      occupancy: Number(detail.occupancy),
      yearBuilt: Number(detail.year_built),
      propertyImageUrl: imageSrc,
    });

    router.push(getSubmitQuotePath(numericRequestId));
  };

  useEffect(() => {
    const cleanupPreview = () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };

    if (!selectedDocument?.url) {
      cleanupPreview();
      setPreviewUrl(null);
      setPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    let isActive = true;

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      cleanupPreview();

      try {
        const response = await api.get(selectedDocument.url, {
          responseType: "blob",
        });

        if (!isActive) return;

        const blobUrl = URL.createObjectURL(response.data as Blob);
        previewObjectUrlRef.current = blobUrl;
        setPreviewUrl(blobUrl);
      } catch (error) {
        console.error("Failed to load request document preview", error);
        if (isActive) {
          setPreviewError("Unable to render this document preview.");
        }
      } finally {
        if (isActive) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isActive = false;
      cleanupPreview();
    };
  }, [selectedDocument?.url]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500">Loading loan request details...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 text-gray-300 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Loan Request Not Found</h2>
            <p className="text-sm text-gray-500 mt-2">The requested loan details could not be found.</p>
          </div>
          <Link
            href="/loan-requests"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Loan Requests
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending' || statusLower === 'open') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (statusLower === 'approved' || statusLower === 'active') return 'bg-green-100 text-green-800 border-green-200';
    if (statusLower === 'rejected' || statusLower === 'closed') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/loan-requests"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Requests</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {detail.property_name}
                  </h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(detail.status || 'pending')}`}>
                    {detail.status || 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {detail.property_address}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmitQuote}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 font-medium"
            >
              <Briefcase className="w-4 h-4" />
              Submit Quote
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Property Image */}
        <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8 shadow-xl">
          <Image
            src={imageSrc}
            alt={detail.property_name}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImageSrc(FALLBACK_PROPERTY_IMAGE)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-sm font-medium">
                <Building2 className="w-4 h-4" />
                {detail.property_type || 'N/A'}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Built {detail.year_built || 'N/A'}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-sm font-medium">
                <Info className="w-4 h-4" />
                Request #{detail.id}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested Amount</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(detail.requested_amount)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Loan Term</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatLoanTerm(detail.loan_term)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">LTV Ratio</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPercent(detail.ltv)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Occupancy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPercent(detail.occupancy)}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-1 px-2 pt-2" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Info className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Documents
                {documents.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                    {documents.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('memorandum')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'memorandum'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                Memorandum
                {memorandumDetails.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                    {memorandumDetails.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Property Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Property Name</p>
                      <p className="text-base text-gray-900">{detail.property_name || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Address</p>
                      <p className="text-base text-gray-900">{detail.property_address || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Property Type</p>
                      <p className="text-base text-gray-900">{detail.property_type || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Year Built</p>
                      <p className="text-base text-gray-900">{detail.year_built ?? '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Occupancy Rate</p>
                      <p className="text-base text-gray-900">{formatPercent(detail.occupancy)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Loan Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Requested Amount</p>
                      <p className="text-base text-gray-900 font-semibold">{formatCurrency(detail.requested_amount)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Loan Term</p>
                      <p className="text-base text-gray-900">{formatLoanTerm(detail.loan_term)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Loan-to-Value (LTV)</p>
                      <p className="text-base text-gray-900">{formatPercent(detail.ltv)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Request Status</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(detail.status || 'pending')}`}>
                        {detail.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Timeline
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Created Date</p>
                      <p className="text-base text-gray-900">{formatDateTime(detail.created_at)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Last Updated</p>
                      <p className="text-base text-gray-900">{formatDateTime(detail.updated_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitQuote}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 font-semibold"
                  >
                    <Briefcase className="w-5 h-5" />
                    Submit Your Quote
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Document Library
                  </h2>
                  {documents.length > 0 && (
                    <p className="text-sm text-gray-500">{documents.length} document{documents.length !== 1 ? 's' : ''} available</p>
                  )}
                </div>

                {documents.length > 0 ? (
                  <div className="space-y-6">
                    {/* Document Selector */}
                    <div className="flex flex-wrap gap-2">
                      {documents.map((document, index) => (
                        <button
                          key={document.id}
                          type="button"
                          onClick={() => setSelectedDocumentIndex(index)}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                            index === selectedDocumentIndex
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          Document {index + 1}
                        </button>
                      ))}
                    </div>

                    {selectedDocument && (
                      <div className="space-y-4">
                        {/* Document Info */}
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {getFileNameFromUrl(selectedDocument.url)}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {isPdfUrl(selectedDocument.url) ? 'PDF Document' : isImageUrl(selectedDocument.url) ? 'Image File' : 'Document'}
                              </p>
                            </div>
                          </div>
                          <a
                            href={previewUrl || selectedDocument.url}
                            download={getFileNameFromUrl(selectedDocument.url)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>

                        {/* Document Preview */}
                        <div className="rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 shadow-inner">
                          <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Document Preview
                            </span>
                          </div>
                          <div className="h-[500px] md:h-[600px] xl:h-[700px]">
                            {previewLoading ? (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center space-y-3">
                                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                                  <p className="text-sm text-gray-500">Loading document preview...</p>
                                </div>
                              </div>
                            ) : previewError ? (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center space-y-3 max-w-md px-4">
                                  <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                                  <p className="text-sm text-gray-600">{previewError}</p>
                                </div>
                              </div>
                            ) : previewUrl && isPdfUrl(selectedDocument.url) ? (
                              <iframe
                                src={`${previewUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full"
                                title="Loan request document preview"
                              />
                            ) : previewUrl && isImageUrl(selectedDocument.url) ? (
                              <div className="h-full p-4 flex items-center justify-center">
                                <img
                                  src={previewUrl}
                                  alt="Loan request document preview"
                                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center space-y-3">
                                  <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                                  <p className="text-sm text-gray-600">Preview not available for this document type.</p>
                                  <a
                                    href={previewUrl || selectedDocument.url}
                                    download={getFileNameFromUrl(selectedDocument.url)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download to View
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Available</h3>
                    <p className="text-sm text-gray-500">There are no documents attached to this loan request yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'memorandum' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    Investment Memorandum
                  </h2>
                  {memorandumDetails.length > 0 && (
                    <p className="text-sm text-gray-500">{memorandumDetails.length} memorandum{memorandumDetails.length !== 1 ? 's' : ''} available</p>
                  )}
                </div>

                {memorandumLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading memorandum details...</p>
                  </div>
                ) : selectedMemorandum ? (
                  <div className="space-y-6">
                    {memorandumDetails.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {memorandumDetails.map((memorandum, index) => (
                          <button
                            key={memorandum.id}
                            type="button"
                            onClick={() => setSelectedMemorandumId(memorandum.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                              memorandum.id === selectedMemorandum.id
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            <FileCheck className="w-4 h-4" />
                            Memorandum {index + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                      <div className="p-6 md:p-10 lg:p-12">
                        <PreviewCover
                          presentedBy={
                            selectedMemorandum.sponsor_name || "Memorandum Team"
                          }
                          confidential
                          investmentOpportunity="INVESTMENT OFFERING"
                          propertyName={memorandumPropertyName}
                          location={memorandumLocation}
                          stats={{
                            yearBuilt: memorandumYearBuilt,
                          }}
                          offeringDate={new Date(
                            selectedMemorandum.created_at || Date.now(),
                          ).toLocaleDateString()}
                        />

                        <TableOfContents items={memorandumTableItems} />
                        <DynamicPreviewSections sections={memorandumSections} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Memorandum Available</h3>
                    <p className="text-sm text-gray-500">There is no investment memorandum attached to this loan request yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

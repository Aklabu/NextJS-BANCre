"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Calendar, 
  Home,
  TrendingUp,
  DollarSign,
  FileText,
  Download,
  ExternalLink,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchLenderPropertyDetail,
  normalizeImageUrl,
  formatCurrency,
  formatNumber,
  formatSquareFeet,
  formatPercent,
  formatDate,
  getFileNameFromUrl,
  type LenderPropertyDetail,
} from "../../api";

const Page = () => {
  const params = useParams();
  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const numericPropertyId = Number(propertyId);

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<LenderPropertyDetail | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchProperty = useCallback(async () => {
    if (!Number.isFinite(numericPropertyId) || numericPropertyId <= 0) {
      toast.error("Invalid property ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchLenderPropertyDetail(numericPropertyId);
      setProperty(data);
    } catch (error: any) {
      console.error("Failed to load property details", error);
      toast.error(error.message || "Unable to load property details.");
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [numericPropertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const allImages = useMemo(() => {
    if (!property) return [];
    const images = [property.property_image_url, ...property.property_photos_urls];
    return images.filter(Boolean).map((url) => normalizeImageUrl(url));
  }, [property]);

  const currentImage = allImages[selectedImageIndex] || normalizeImageUrl(null);

  const mapLink = useMemo(() => {
    if (!property) return "";
    const lat = property.latitude;
    const lng = property.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }, [property]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Property Not Found</h2>
            <p className="text-sm text-gray-500 mt-2">
              This property is not available or does not have any active loan requests.
            </p>
          </div>
          <Link
            href="/my-quotes"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Quotes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/my-quotes"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Quotes
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.property_name}</h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {property.property_address}
              </p>
            </div>
            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium">
              <Building2 className="w-4 h-4 mr-2" />
              {property.property_type}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Image Gallery */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative h-96 bg-gray-100">
            <Image
              src={currentImage}
              alt={property.property_name}
              fill
              className="object-cover"
              unoptimized
            />
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedImageIndex
                        ? "bg-white w-8"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {allImages.length > 1 && (
            <div className="p-4 border-t border-gray-200 flex gap-2 overflow-x-auto">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex
                      ? "border-blue-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${property.property_name} - Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                Property Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Number of Units</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatNumber(property.number_of_units)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Rentable Area</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatSquareFeet(property.rentable_area)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Year Built</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {property.year_built || "-"}
                  </p>
                </div>
                {property.year_renovated && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Year Renovated</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {property.year_renovated}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 font-medium">Occupancy Rate</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatPercent(property.occupancy)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Parking Spaces</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatNumber(property.parking_spaces)}
                  </p>
                </div>
              </div>

              {mapLink && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Active Loan Requests */}
            {property.active_loan_requests.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Active Loan Requests ({property.active_loan_requests.length})
                </h2>
                <div className="space-y-4">
                  {property.active_loan_requests.map((loan) => (
                    <div
                      key={loan.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Request ID</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">#{loan.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Requested Amount</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {formatCurrency(loan.requested_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Loan Term</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {loan.loan_term} months
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">LTV</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {formatPercent(loan.ltv)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Created {formatDate(loan.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memorandums */}
            {property.memorandums.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Investment Memorandums ({property.memorandums.length})
                </h2>
                <div className="space-y-3">
                  {property.memorandums.map((memo) => (
                    <div
                      key={memo.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{memo.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {formatDate(memo.created_at)} • Updated {formatDate(memo.updated_at)}
                          </p>
                        </div>
                        <a
                          href={memo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Documents ({property.documents.length})
              </h2>
              {property.documents.length > 0 ? (
                <div className="space-y-2">
                  {property.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={normalizeImageUrl(doc.file_url)}
                      download={getFileNameFromUrl(doc.file_url)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                    >
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getFileNameFromUrl(doc.file_url)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No documents available
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Property Info
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Property ID</p>
                  <p className="text-gray-900 mt-1">#{property.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Place ID</p>
                  <p className="text-gray-900 mt-1 break-all font-mono text-xs">
                    {property.place_id}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Coordinates</p>
                  <p className="text-gray-900 mt-1 font-mono text-xs">
                    {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Created</p>
                  <p className="text-gray-900 mt-1">{formatDate(property.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Last Updated</p>
                  <p className="text-gray-900 mt-1">{formatDate(property.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

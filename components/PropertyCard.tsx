"use client";
import { useState, useEffect } from "react";
import Button from "./Button";
import { IoLocationOutline } from "react-icons/io5";
import {
  LuBuilding2,
  LuCalendar,
  LuWrench,
  LuParkingMeter as LuParkingCircle,
  LuFileText,
  LuTrash2,
} from "react-icons/lu";
import { TbRulerMeasure } from "react-icons/tb";
import { MdOutlineOtherHouses } from "react-icons/md";
import Image from "next/image";
import { useRouter } from "next/navigation";

const FALLBACK_IMAGE = "/images/SponsorDashboard.png";

const normalizeImageUrl = (url?: string | null) => {
  if (!url) return FALLBACK_IMAGE;

  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      trimmed.startsWith("http://")
    ) {
      return trimmed.replace(/^http:\/\//, "https://");
    }
    return trimmed;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  if (!baseUrl) return trimmed;

  return `${baseUrl}/${trimmed.replace(/^\/+/, "")}`;
};

// ── API shape (full detail response) ────────────────────────────────────────

export interface PropertyDocument {
  id: number;
  file_url: string;
  uploaded_at: string;
}

export interface PropertyDetail {
  id: number;
  property: string;
  title: string;
  property_address: string;
  property_type: string;
  number_of_units?: number;
  rentable_area?: string;
  year_built?: number;
  year_renovated?: number | null;
  occupancy?: string;
  parking_spaces?: number;
  property_image_url?: string | null;
  thumbnail_url?: string | null;
  property_images?: string[];
  image_url?: string | null;
  image?: string | null;
  sponsor?: string;
  created_at?: string;
  updated_at?: string;
  documents?: PropertyDocument[];
  // list-only fields (map endpoint) — optional
  latitude?: string;
  longitude?: string;
  location: string;
  status: string;
  link?: string;
  link2?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

type PropertyCardProps = {
  data: PropertyDetail;
  size?: "small" | "large";
  secondaryButtonText?: string;
  secondaryButtonClassName?: string;
  onSecondaryAction?: () => void;
  onRequestLoan?: () => void;
  onDelete?: () => void;
};

const sizeStyles = {
  small: "w-[380px] lg:w-full xl:w-[438px] h-auto",
  large: "w-full h-auto",
};

// Pill colour per property type
const typePillColor: Record<string, string> = {
  Multifamily: "bg-blue-100 text-blue-700",
  multifamily: "bg-blue-100 text-blue-700",
  Retail: "bg-orange-100 text-orange-700",
  retail: "bg-orange-100 text-orange-700",
  Industrial: "bg-yellow-100 text-yellow-700",
  industrial: "bg-yellow-100 text-yellow-700",
  Office: "bg-purple-100 text-purple-700",
  office: "bg-purple-100 text-purple-700",
  Mixed: "bg-teal-100 text-teal-700",
  mixed: "bg-teal-100 text-teal-700",
  Other: "bg-gray-100 text-gray-700",
  other: "bg-gray-100 text-gray-700",
};

const PropertyCard = ({
  data,
  size = "large",
  secondaryButtonText = "View Quotes",
  secondaryButtonClassName = "button-outline",
  onSecondaryAction,
  onRequestLoan,
  onDelete,
}: PropertyCardProps) => {
  const router = useRouter();

  // Debug: Log what PropertyCard is actually receiving
  useEffect(() => {
    if (data.id === 37) { // Empire State Building
      console.log('PropertyCard received data:', data);
      console.log('Has number_of_units field?', 'number_of_units' in data);
      console.log('number_of_units value:', data.number_of_units);
      console.log('number_of_units !== undefined?', data.number_of_units !== undefined);
    }
  }, [data]);

  const rawImage =
    data.thumbnail_url ||
    data.property_image_url ||
    (Array.isArray(data.property_images) && data.property_images.length > 0
      ? data.property_images[0]
      : null) ||
    data.image_url ||
    data.image;

  const propertyImageSrc = normalizeImageUrl(rawImage);
  const [imageError, setImageError] = useState(false);

  // Reset error state if image src changes
  useEffect(() => {
    setImageError(false);
  }, [propertyImageSrc]);

  const hasPrimaryLink = Boolean(data.link);

  const pillColor =
    typePillColor[data.property_type?.trim()] ?? "bg-gray-100 text-gray-700";

  const hasDocuments = data.documents && data.documents.length > 0;
  const hasCoordinates = Boolean(data.latitude && data.longitude);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString();
  };

  const formatCoordinate = (value?: string) => {
    if (!value) return "-";
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return value;
    return parsed.toFixed(6);
  };

  return (
    <div
      className={`group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${sizeStyles[size]}`}
    >
      {/* ── Image Section with Overlay ── */}
      <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <Image
          src={imageError ? FALLBACK_IMAGE : propertyImageSrc}
          alt={data.title || "Property"}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          unoptimized
          onError={() => setImageError(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Property Type Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md bg-white/90 shadow-lg ${pillColor.replace('bg-', 'bg-opacity-90 ')}`}
          >
            {data.property_type}
          </span>
        </div>
        
        {/* Delete Button */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-4 right-4 p-2 text-white hover:text-red-500 transition-all"
            title="Delete property"
          >
            <LuTrash2 className="text-xl drop-shadow-lg" />
          </button>
        )}

        {/* Property Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-white text-xl font-bold leading-tight drop-shadow-lg line-clamp-2">
            {data.title}
          </h2>
        </div>
      </div>

      {/* ── Content Body ── */}
      <div className="flex flex-col flex-grow p-5 space-y-4">
        
        {/* Address */}
        <div className="flex items-start gap-2 text-gray-700">
          <IoLocationOutline className="text-xl shrink-0 mt-0.5 text-blue-600" />
          <span className="text-sm leading-relaxed line-clamp-2">{data.location}</span>
        </div>

        {/* Created Date */}
        {data.created_at !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <LuCalendar className="text-base text-gray-500" />
            <span className="font-medium">Created: {formatDate(data.created_at)}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-4">
          {data.number_of_units !== undefined && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MdOutlineOtherHouses className="text-lg text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Units</span>
                <span className="text-base font-bold text-gray-900">{data.number_of_units}</span>
              </div>
            </div>
          )}

          {data.occupancy !== undefined && (
            <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="p-2 bg-green-100 rounded-lg">
                <LuBuilding2 className="text-lg text-green-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Occupancy</span>
                <span className="text-base font-bold text-gray-900">{data.occupancy}%</span>
              </div>
            </div>
          )}

          {data.rentable_area !== undefined && (
            <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3 border border-purple-100">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TbRulerMeasure className="text-lg text-purple-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Rentable</span>
                <span className="text-sm font-bold text-gray-900">{Number(data.rentable_area).toLocaleString()} sqft</span>
              </div>
            </div>
          )}

          {data.year_built !== undefined && (
            <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-3 border border-orange-100">
              <div className="p-2 bg-orange-100 rounded-lg">
                <LuCalendar className="text-lg text-orange-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Built</span>
                <span className="text-base font-bold text-gray-900">{data.year_built}</span>
              </div>
            </div>
          )}

          {data.year_renovated != null && (
            <div className="flex items-center gap-2 bg-teal-50 rounded-lg p-3 border border-teal-100">
              <div className="p-2 bg-teal-100 rounded-lg">
                <LuWrench className="text-lg text-teal-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Renovated</span>
                <span className="text-base font-bold text-gray-900">{data.year_renovated}</span>
              </div>
            </div>
          )}

          {data.parking_spaces !== undefined && (
            <div className="flex items-center gap-2 bg-indigo-50 rounded-lg p-3 border border-indigo-100">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <LuParkingCircle className="text-lg text-indigo-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Parking</span>
                <span className="text-base font-bold text-gray-900">{data.parking_spaces}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Documents Info (only when detail data is present) ── */}
        {data.documents !== undefined && (
          <div className="flex items-center gap-2 text-sm pt-3 border-t border-gray-200">
            <div className={`p-2 rounded-lg ${hasDocuments ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <LuFileText className={`text-base ${hasDocuments ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            {hasDocuments ? (
              <span className="text-gray-700 font-medium">
                {data.documents!.length} document{data.documents!.length !== 1 ? "s" : ""} attached
              </span>
            ) : (
              <span className="text-gray-500">No documents uploaded</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;

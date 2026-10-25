"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LuCalendar,
  LuDollarSign,
  LuPercent,
  LuPencil,
  LuTrash2,
  LuArrowUpRight,
} from "react-icons/lu";
import { IoLocationOutline } from "react-icons/io5";
import type { SponsorLoanRequestItem } from "../_api/loan-requests-api";

const FALLBACK_IMAGE = "/images/SponsorDashboard.png";

interface SponsorLoanRequestCardProps {
  request: SponsorLoanRequestItem;
  onEdit: (request: SponsorLoanRequestItem) => void;
  onDelete: (request: SponsorLoanRequestItem) => void;
  onViewQuotes?: (request: SponsorLoanRequestItem) => void;
  isDeleting?: boolean;
}

export default function SponsorLoanRequestCard({
  request,
  onEdit,
  onDelete,
  onViewQuotes,
  isDeleting = false,
}: SponsorLoanRequestCardProps) {
  const [imgError, setImgError] = useState(false);

  const rawImage =
    request.thumbnail_url ||
    request.property_image_url ||
    (Array.isArray(request.property_images) && request.property_images.length > 0
      ? request.property_images[0]
      : null);

  const imageSrc = imgError || !rawImage ? FALLBACK_IMAGE : rawImage;

  const formattedAmount = Number(request.requested_amount || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );

  const getStatusDisplay = (status: string) => {
    const s = (status || "").toLowerCase();
    
    if (s.includes("accept") || s.includes("approved") || s === "closed") {
      return {
        label: "Closed",
        className: "bg-gray-100 text-gray-700 border-gray-300"
      };
    }
    
    if (s.includes("review") || s.includes("pending") || s.includes("quote")) {
      return {
        label: "Under Review",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200"
      };
    }
    
    if (s.includes("decline") || s.includes("reject")) {
      return {
        label: "Closed",
        className: "bg-gray-100 text-gray-700 border-gray-300"
      };
    }
    
    // Default - Active status
    return {
      label: "Active",
      className: "bg-blue-50 text-blue-700 border-blue-200"
    };
  };

  const statusDisplay = getStatusDisplay(request.status);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top Image + Badge */}
        <div className="relative w-full h-48 bg-gray-100">
          <Image
            src={imageSrc}
            alt={request.property_name}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Status Badge - Top Right */}
          <span
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-md text-xs font-semibold border backdrop-blur-sm ${statusDisplay.className}`}
          >
            {statusDisplay.label}
          </span>

          {/* Property info overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg font-bold mb-1 truncate">
              {request.property_name}
            </h3>
            <p className="text-sm text-white/90 flex items-center gap-1 mb-2 truncate">
              <IoLocationOutline className="shrink-0" />
              <span className="truncate">
                {request.property_address || "No address specified"}
              </span>
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-1 rounded bg-white/20 backdrop-blur-sm font-medium capitalize">
                {request.property_type || "Commercial"}
              </span>
            </div>
          </div>
        </div>

        {/* Loan Terms Grid */}
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Requested Amount */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Amount</span>
              <span className="text-base font-bold text-gray-900">
                ${formattedAmount}
              </span>
            </div>

            {/* Loan Term */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Term</span>
              <span className="text-base font-bold text-gray-900">
                {(request.loan_term / 12).toFixed(0)} yrs
              </span>
            </div>

            {/* Target LTV */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">LTV</span>
              <span className="text-base font-bold text-gray-900">
                {request.ltv}%
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">3 quotes</span> received
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onEdit(request)}
          className="flex-1 py-2 px-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          title="Edit request"
        >
          Edit
        </button>

        <button
          type="button"
          disabled={isDeleting}
          onClick={() => onDelete(request)}
          className="flex-1 py-2 px-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          title="Delete request"
        >
          Delete
        </button>

        {onViewQuotes ? (
          <button
            type="button"
            onClick={() => onViewQuotes(request)}
            className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            View
          </button>
        ) : (
          <Link
            href={`/loan?requestId=${request.id}`}
            className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            View
          </Link>
        )}
      </div>
    </div>
  );
}

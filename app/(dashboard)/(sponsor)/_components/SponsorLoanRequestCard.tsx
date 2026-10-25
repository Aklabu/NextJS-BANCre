"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { HiDotsVertical } from "react-icons/hi";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import type { SponsorLoanRequestItem } from "../_api/loan-requests-api";

const FALLBACK_IMAGE = "/images/SponsorDashboard.png";

export interface SponsorLoanRequestCardProps {
  request: SponsorLoanRequestItem;
  onEdit: (request: SponsorLoanRequestItem) => void;
  onDelete: (request: SponsorLoanRequestItem) => void;
  onViewQuotes?: (request: SponsorLoanRequestItem) => void;
  isDeleting?: boolean;
  quotesCount?: number; // Number of quotes received for this request
}

export default function SponsorLoanRequestCard({
  request,
  onEdit,
  onDelete,
  onViewQuotes,
  isDeleting = false,
  quotesCount = 0,
}: SponsorLoanRequestCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

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
        className: "bg-gray-100 text-gray-700"
      };
    }
    
    if (s.includes("review") || s.includes("pending")) {
      return {
        label: "Under Review",
        className: "bg-purple-50 text-purple-700"
      };
    }
    
    if (s.includes("decline") || s.includes("reject")) {
      return {
        label: "Closed",
        className: "bg-gray-100 text-gray-700"
      };
    }
    
    // Default - Active status
    return {
      label: "Active",
      className: "bg-blue-50 text-blue-700"
    };
  };

  const statusDisplay = getStatusDisplay(request.status);

  const handleEdit = () => {
    setShowMenu(false);
    onEdit(request);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(request);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Property Image with Status Badge Overlay */}
      <div className="relative w-full h-44 bg-gray-100">
        <Image
          src={imageSrc}
          alt={request.property_name}
          fill
          className="object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
        
        {/* Status Badge - Overlay on top left of image */}
        <span
          className={`absolute top-3 left-3 px-3 py-1 rounded-md text-xs font-medium ${statusDisplay.className}`}
        >
          {statusDisplay.label}
        </span>

        {/* 3-Dot Menu - Top Right */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="More options"
          >
            <HiDotsVertical className="w-5 h-5 text-white drop-shadow-md" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <LuPencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
              >
                <LuTrash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="px-4 pb-4">
        {/* Property Name */}
        <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
          {request.property_name}
        </h3>
        
        {/* Property Address */}
        <p className="text-xs text-gray-600 mb-1 truncate">
          {request.property_address || "No address specified"}
        </p>

        {/* Property Type & Year Built */}
        <p className="text-xs text-gray-600 mb-3">
          {request.property_type || "Commercial"} · Built {request.year_built || "[Year built]"}
        </p>

        {/* Loan Terms Grid */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* Amount */}
          <div>
            <p className="text-xs text-gray-600 mb-1">Amount</p>
            <p className="text-sm font-bold text-gray-900">${formattedAmount}</p>
          </div>

          {/* Term */}
          <div>
            <p className="text-xs text-gray-600 mb-1">Term</p>
            <p className="text-sm font-bold text-gray-900">
              {(request.loan_term / 12).toFixed(0)} yrs
            </p>
          </div>

          {/* LTV */}
          <div>
            <p className="text-xs text-gray-600 mb-1">LTV</p>
            <p className="text-sm font-bold text-gray-900">{request.ltv}%</p>
          </div>
        </div>

        {/* Footer with Quote Count and View Button */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-900">
            {quotesCount > 0 ? (
              <>{quotesCount} quote{quotesCount !== 1 ? 's' : ''}</>
            ) : (
              <span className="text-gray-500">Quote accepted</span>
            )}
          </div>
          
          {onViewQuotes ? (
            <button
              type="button"
              onClick={() => onViewQuotes(request)}
              className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              View request
            </button>
          ) : (
            <Link
              href={`/loan?requestId=${request.id}`}
              className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors inline-block"
            >
              View request
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

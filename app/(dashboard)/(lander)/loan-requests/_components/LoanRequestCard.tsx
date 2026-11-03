"use client";

import Image from "next/image";
import { LoanRequest } from "./types";

type LoanRequestCardProps = {
  request: LoanRequest;
  onSubmitQuote: (id: number) => void;
  onViewDetails: (id: number) => void;
};

const LoanRequestCard = ({
  request,
  onSubmitQuote,
  onViewDetails,
}: LoanRequestCardProps) => {
  const fallbackImage = "/images/SponsorDashboard.png";

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Property Image with Status Badge */}
      <div className="relative h-40 bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          Property photo
        </div>
        {request.propertyImage && (
          <Image
            src={request.propertyImage}
            alt={request.propertyName}
            fill
            className="object-cover"
            unoptimized
          />
        )}
        {/* Status Badge on Image */}
        <div className="absolute top-3 left-3">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            {request.status}
          </span>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {request.propertyName}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{request.address}</p>

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-sm font-semibold text-gray-900">
              {request.amount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Term</p>
            <p className="text-sm font-semibold text-gray-900">
              {request.term}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">LTV</p>
            <p className="text-sm font-semibold text-gray-900">
              {request.ltv}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-600 mb-4">
          {request.propertyType} · {request.occupancy} occupied · Built{" "}
          {request.yearBuilt}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onSubmitQuote(request.id)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit quote
          </button>
          <button
            onClick={() => onViewDetails(request.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoanRequestCard;

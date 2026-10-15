"use client";

import React from "react";
import { PreviewCoverProps } from "@/types/memorandum-detail";

//========== Preview Cover Component ===========

const PreviewCover: React.FC<PreviewCoverProps> = ({
  presentedBy,
  confidential,
  investmentOpportunity,
  propertyName,
  location,
  stats,
  offeringDate,
  coverImage,
}) => {
  return (
    <section
      className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-2xl hover:shadow-[0_25px_80px_rgba(0,0,0,0.25)] transition-all duration-500"
      style={{
        minHeight: "700px",
      }}
    >
      {/* Enhanced gradient overlay with animation */}
      <div
        className="absolute inset-0 rounded-2xl animate-gradient-shift"
        style={
          {
            backgroundImage: coverImage
              ? `linear-gradient(135deg, rgba(13,53,130,0.95) 0%, rgba(79,70,229,0.92) 25%, rgba(139,92,246,0.90) 50%, rgba(59,130,246,0.92) 75%, rgba(13,53,130,0.95) 100%), url(${coverImage})`
              : `linear-gradient(135deg, #0D3582 0%, #4F46E5 25%, #8B5CF6 50%, #3B82F6 75%, #0D3582 100%)`,
            backgroundSize: "400% 400%",
            backgroundPosition: "center",
          } as React.CSSProperties
        }
      />

      {/* Decorative animated circles */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Content overlay */}
      <div
        className="relative z-10 flex flex-col justify-between h-full px-8 py-10 md:px-12 md:py-14"
        style={{ minHeight: "700px" }}
      >
        {/* Enhanced top badges */}
        <div className="flex justify-between items-start gap-3">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative text-white text-xs tracking-widest uppercase px-5 py-2.5 rounded-xl backdrop-blur-md font-semibold border border-white/20 bg-white/10">
              Presented by {presentedBy}
            </div>
          </div>
          {confidential && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative text-white text-xs tracking-wider uppercase px-5 py-2.5 rounded-xl backdrop-blur-md font-semibold border border-white/20 bg-white/10">
                Confidential
              </div>
            </div>
          )}
        </div>

        {/* Enhanced center content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl px-8 py-10 border border-white/10 shadow-2xl">
            <p className="text-white/90 text-xs uppercase tracking-[0.4em] mb-4 font-semibold">
              {investmentOpportunity}
            </p>
            
            {/* Fancy divider with glow effect */}
            <div className="flex items-center justify-center mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/50"></div>
              <div className="mx-3 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse"></div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/50"></div>
            </div>

            <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight drop-shadow-2xl">
              {propertyName}
            </h1>
            
            {location && (
              <p className="text-white/95 text-lg md:text-xl mb-8 font-medium drop-shadow-lg">
                {location}
              </p>
            )}

            {/* Year Built - text only */}
            <div className="flex justify-center mt-8">
              <div className="text-center">
                <p className="text-white/80 text-[10px] uppercase tracking-widest mb-1 font-bold">
                  Year Built
                </p>
                <p className="text-white text-lg font-bold">
                  {stats.yearBuilt || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced footer */}
        <div className="flex justify-between items-end text-white/80 text-xs font-medium backdrop-blur-sm bg-white/5 rounded-lg px-4 py-2 border border-white/10">
          <span>{offeringDate}</span>
          <span className="tracking-wider">FOR QUALIFIED INVESTORS ONLY</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
};

export default PreviewCover;

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
      className="relative w-full rounded-sm overflow-hidden mb-6"
      style={{
        minHeight: "700px",
      }}
    >
      {/* Background with gradient overlay — matching PDF design */}
      <div
        className="absolute inset-0 rounded-none"
        style={
          {
            backgroundImage: coverImage
              ? `linear-gradient(135deg, rgba(13,53,130,0.92) 0%, rgba(30,90,180,0.88) 50%, rgba(13,53,130,0.94) 100%), url(${coverImage})`
              : `linear-gradient(135deg, #0D3582 0%, #1E5AB4 50%, #0D3582 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } as React.CSSProperties
        }
      />

      {/* Content overlay */}
      <div
        className="relative z-10 flex flex-col justify-between h-full px-8 py-10 md:px-12 md:py-14"
        style={{ minHeight: "700px" }}
      >
        {/* Top bar */}
        <div className="flex justify-between items-start">
          <div
            className="text-white text-xs tracking-widest uppercase px-4 py-2 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            Presented by {presentedBy}
          </div>
          {confidential && (
            <div
              className="text-white text-xs tracking-wider uppercase px-4 py-2 rounded"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              Confidential
            </div>
          )}
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-white/80 text-xs uppercase tracking-[0.35em] mb-3">
            {investmentOpportunity}
          </p>
          <div
            className="w-20 h-[2px] mx-auto mb-6"
            style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
          />
          <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            {propertyName}
          </h1>
          {location && (
            <p className="text-white/90 text-lg md:text-xl mb-8">{location}</p>
          )}

          {/* Year Built — text only, no box */}
          <div className="flex justify-center mt-6 w-full">
            <div className="text-center">
              <p className="text-white/70 text-[9px] uppercase tracking-wider mb-0.5">
                Year Built
              </p>
              <p className="text-white text-base font-semibold">
                {stats.yearBuilt || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end text-white/70 text-xs">
          <span>{offeringDate}</span>
          <span>FOR QUALIFIED INVESTORS ONLY</span>
        </div>
      </div>
    </section>
  );
};

export default PreviewCover;

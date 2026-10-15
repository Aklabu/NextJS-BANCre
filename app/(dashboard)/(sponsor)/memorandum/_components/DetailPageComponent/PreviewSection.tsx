"use client";

import React from "react";
import { PreviewSectionProps } from "@/types/memorandum-detail";

//========== Preview Section Wrapper Component ===========

const PreviewSection: React.FC<PreviewSectionProps> = ({
  sectionNumber,
  title,
  children,
  anchorId,
}) => {
  return (
    <section
      id={anchorId}
      className="bg-white mb-8 scroll-mt-28"
    >
      {/* Section Header - matching PDF design */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-1 w-10 rounded"
            style={{ backgroundColor: "#0D4DA5" }}
          />
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: "#0D4DA5" }}
          >
            Section {sectionNumber}
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        <div
          className="h-[3px] w-16 rounded mt-1"
          style={{ backgroundColor: "#0D4DA5" }}
        />
      </div>

      {/* Section Content */}
      <div className="text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
};

export default PreviewSection;

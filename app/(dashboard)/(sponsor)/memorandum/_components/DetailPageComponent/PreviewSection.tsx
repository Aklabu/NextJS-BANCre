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
      className="relative overflow-hidden backdrop-blur-sm bg-white/90 border-2 border-gray-200/80 hover:border-blue-200/60 rounded-2xl p-6 md:p-8 mb-6 scroll-mt-28 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Subtle decorative corner gradient */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-50/30 to-transparent rounded-2xl pointer-events-none"></div>
      
      {/* Section Header - Enhanced design */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Section {sectionNumber}
            </span>
          </div>
        </div>
        
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <span className="w-1 h-7 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></span>
          {title}
        </h2>
        
        <div className="flex items-center gap-2 ml-4">
          <div className="h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-sm"></div>
          <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
        </div>
      </div>

      {/* Section Content */}
      <div className="relative z-10 text-gray-700 leading-relaxed prose prose-sm md:prose-base max-w-none">
        {children}
      </div>
    </section>
  );
};

export default PreviewSection;

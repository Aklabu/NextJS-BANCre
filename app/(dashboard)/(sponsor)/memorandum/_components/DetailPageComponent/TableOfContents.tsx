"use client";

import React from "react";
import { TableOfContentsProps } from "@/types/memorandum-detail";

//========== Table of Contents Component ===========

const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const handleScrollToSection = (anchorId?: string) => {
    if (!anchorId) return;

    const targetSection = document.getElementById(anchorId);
    targetSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="bg-white mb-8">
      {/* Header - matching PDF design */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="h-1 w-12 rounded"
            style={{ backgroundColor: "#0D4DA5" }}
          />
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "#0D4DA5" }}
          >
            Contents
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Table of Contents</h2>
        <div
          className="h-1 w-20 rounded mt-2"
          style={{ backgroundColor: "#0D4DA5" }}
        />
      </div>

      {/* Items */}
      <div className="space-y-0">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleScrollToSection(item.anchorId)}
            className="w-full text-left flex items-center py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-200"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{
                backgroundColor: "#DBEAFE",
                color: "#0D4DA5",
              }}
            >
              {item.id}
            </div>
            <span className="ml-4 flex-1 text-sm text-gray-800 font-medium">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default TableOfContents;

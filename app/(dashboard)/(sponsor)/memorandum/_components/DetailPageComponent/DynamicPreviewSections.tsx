"use client";

import React, { useState } from "react";
import Image from "next/image";
import PreviewSection from "./PreviewSection";
import SectionMarkdown from "./SectionMarkdown";
import ExcelTableView from "./ExcelTableView";
import { BsFileEarmarkSpreadsheet } from "react-icons/bs";
import { FiFileText, FiLayers } from "react-icons/fi";

import {
  formatSectionTitle,
  parseKeyValueContentToTable,
  stripLeadingSectionHeading,
} from "./section-utils";
import type { MemorandumSection } from "@/types/memorandum-detail";

type DynamicPreviewSectionsProps = {
  sections: MemorandumSection[];
};

const DynamicPreviewSections: React.FC<DynamicPreviewSectionsProps> = ({
  sections,
}) => {
  // Global view preference: "table" (default as requested) or "document"
  const [globalMode, setGlobalMode] = useState<"table" | "document">("table");

  // Per-section overrides if user toggles a specific section
  const [sectionOverrides, setSectionOverrides] = useState<
    Record<number, "table" | "document">
  >({});

  const toggleSectionMode = (sectionId: number, mode: "table" | "document") => {
    setSectionOverrides((prev) => ({
      ...prev,
      [sectionId]: mode,
    }));
  };

  return (
    <div>
      {/* ====== Sections Rendering ====== */}
      {sections.map((section, index) => {
        const sectionTitle =
          section.label ||
          section.title ||
          formatSectionTitle(section.section_key || section.section_type);

        const contentToRender = stripLeadingSectionHeading(
          section.content || "",
          sectionTitle,
        );

        const sectionImage = section.image_url || section.image;
        const hasExplicitTable = Boolean(
          section.table_data?.columns?.length &&
            section.table_data?.rows?.length,
        );
        const keyValueTable = !hasExplicitTable
          ? parseKeyValueContentToTable(contentToRender)
          : null;

        const activeTable = hasExplicitTable
          ? section.table_data
          : keyValueTable;

        const hasTableCapability = Boolean(activeTable);
        const hasProseContent = Boolean(
          contentToRender && contentToRender.trim().length > 0,
        );
        const canToggleView = hasTableCapability && hasProseContent;

        // Current active mode for this section
        const effectiveMode =
          sectionOverrides[section.id] ||
          (hasTableCapability ? globalMode : "document");

        return (
          <PreviewSection
            key={section.id}
            sectionNumber={index + 1}
            title={sectionTitle}
            anchorId={`preview-section-${section.id}`}
          >
            <div className="rounded-md p-4 bg-gray-50">
              {/* Optional Section Image */}
              {sectionImage ? (
                <div className="mb-4 rounded-md overflow-hidden border border-gray-200">
                  <div className="relative w-full h-[220px]">
                    <Image
                      src={sectionImage}
                      alt={`${sectionTitle} image`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}

              {/* Section-level toggle (when both table and prose exist) */}
              {canToggleView ? (
                <div className="mb-3 flex items-center justify-end pb-2 border-b border-gray-200">
                  <div className="flex items-center rounded-md bg-white p-0.5 border border-gray-300 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleSectionMode(section.id, "table")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        effectiveMode === "table"
                          ? "bg-[#0D4DA5] text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <BsFileEarmarkSpreadsheet size={11} />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSectionMode(section.id, "document")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        effectiveMode === "document"
                          ? "bg-gray-700 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FiFileText size={11} />
                      <span>Narrative</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Render based on effectiveMode */}
              {effectiveMode === "table" && activeTable ? (
                <ExcelTableView
                  tableData={activeTable}
                  title={sectionTitle}
                  subtitle={
                    section.section_key
                      ? `Section: ${section.section_key}`
                      : undefined
                  }
                />
              ) : hasProseContent ? (
                <SectionMarkdown
                  content={contentToRender}
                  className="text-gray-700 leading-relaxed"
                />
              ) : activeTable ? (
                /* Fallback to table if no prose exists */
                <ExcelTableView
                  tableData={activeTable}
                  title={sectionTitle}
                  subtitle={
                    section.section_key
                      ? `Section: ${section.section_key}`
                      : undefined
                  }
                />
              ) : null}
            </div>
          </PreviewSection>
        );
      })}
    </div>
  );
};

export default DynamicPreviewSections;

"use client";

import React, { useState } from "react";
import Image from "next/image";
import PreviewSection from "./PreviewSection";
import SectionMarkdown from "./SectionMarkdown";
import BlockRenderer from "./BlockRenderer";
import SectionDataRenderer from "./SectionDataRenderer";
import ExcelTableView from "./ExcelTableView";
import { BsFileEarmarkSpreadsheet } from "react-icons/bs";
import { FiFileText } from "react-icons/fi";

import {
  formatSectionTitle,
  parseKeyValueContentToTable,
  stripLeadingSectionHeading,
} from "./section-utils";
import type {
  MemorandumSection,
  SectionDataEnvelope,
  SectionDataPayload,
} from "@/types/memorandum-detail";

/** Section types that use section_data instead of content/blocks */
const TABLE_SECTION_TYPES = new Set([
  "financial_analysis",
  "financing_summary",
  "market_summary",
  "sales_comparables",
  "lease_comparables",
]);

type DynamicPreviewSectionsProps = {
  sections: MemorandumSection[];
};

const DynamicPreviewSections: React.FC<DynamicPreviewSectionsProps> = ({
  sections,
}) => {
  const [sectionOverrides, setSectionOverrides] = useState<
    Record<number, "table" | "document">
  >({});

  const toggleSectionMode = (
    sectionId: number,
    mode: "table" | "document",
  ) => {
    setSectionOverrides((prev) => ({ ...prev, [sectionId]: mode }));
  };

  return (
    <div>
      {sections.map((section, index) => {
        const sectionTitle =
          section.label ||
          section.title ||
          formatSectionTitle(section.section_key || section.section_type);

        const sectionIdentifier = (
          section.section_key ||
          section.section_type ||
          ""
        ).toLowerCase();

        const contentToRender = stripLeadingSectionHeading(
          section.content || "",
          sectionTitle,
        );

        const sectionImage = section.image_url || section.image;

        // ---- Determine rendering strategy ----
        const isSectionDataTable =
          TABLE_SECTION_TYPES.has(sectionIdentifier) &&
          section.section_data != null &&
          section.section_data.status != null;

        const hasBlocks =
          Array.isArray(section.blocks) && section.blocks.length > 0;

        // Legacy path
        const hasExplicitLegacyTable = Boolean(
          section.table_data?.columns?.length &&
            section.table_data?.rows?.length,
        );
        const keyValueTable =
          !hasExplicitLegacyTable && !isSectionDataTable
            ? parseKeyValueContentToTable(contentToRender)
            : null;
        const activeLegacyTable = hasExplicitLegacyTable
          ? section.table_data
          : keyValueTable;

        const hasTableCapability =
          isSectionDataTable || Boolean(activeLegacyTable);
        const hasProseContent = Boolean(
          contentToRender && contentToRender.trim().length > 0,
        );
        const canToggleView =
          hasTableCapability && hasProseContent && !isSectionDataTable;

        const effectiveMode =
          sectionOverrides[section.id] ||
          (hasTableCapability ? "table" : "document");

        return (
          <PreviewSection
            key={section.id}
            sectionNumber={index + 1}
            title={sectionTitle}
            anchorId={`preview-section-${section.id}`}
          >
            <div className="rounded-md p-4 bg-gray-50">
              {/* Optional section image */}
              {sectionImage && (
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
              )}

              {/* View toggle for legacy sections that have both table + prose */}
              {canToggleView && (
                <div className="mb-3 flex items-center justify-end pb-2 border-b border-gray-200">
                  <div className="flex items-center rounded-md bg-white p-0.5 border border-gray-300 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        toggleSectionMode(section.id, "table")
                      }
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
                      onClick={() =>
                        toggleSectionMode(section.id, "document")
                      }
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
              )}

              {/* ---- Render content ---- */}

              {/* 1. New API — section_data table sections */}
              {isSectionDataTable && section.section_data && (
                <SectionDataRenderer
                  sectionData={
                    section.section_data as SectionDataEnvelope<SectionDataPayload>
                  }
                  sectionType={sectionIdentifier}
                />
              )}

              {/* 2. Legacy table */}
              {!isSectionDataTable &&
                effectiveMode === "table" &&
                activeLegacyTable && (
                  <ExcelTableView
                    tableData={activeLegacyTable}
                    title={sectionTitle}
                    subtitle={
                      section.section_key
                        ? `Section: ${section.section_key}`
                        : undefined
                    }
                  />
                )}

              {/* 3. Prose — blocks[] preferred, markdown fallback */}
              {!isSectionDataTable &&
                (effectiveMode === "document" || !activeLegacyTable) &&
                (hasBlocks ? (
                  <BlockRenderer blocks={section.blocks!} />
                ) : hasProseContent ? (
                  <SectionMarkdown
                    content={contentToRender}
                    className="text-gray-700 leading-relaxed"
                  />
                ) : activeLegacyTable ? (
                  /* Pure-table section with no prose — show table in document mode too */
                  <ExcelTableView
                    tableData={activeLegacyTable}
                    title={sectionTitle}
                    subtitle={
                      section.section_key
                        ? `Section: ${section.section_key}`
                        : undefined
                    }
                  />
                ) : null)}
            </div>
          </PreviewSection>
        );
      })}
    </div>
  );
};

export default DynamicPreviewSections;

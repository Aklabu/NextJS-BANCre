"use client";

import { useEffect, useState, useMemo } from "react";
import { FiCheck, FiEdit, FiX, FiFileText } from "react-icons/fi";
import { BsFileEarmarkSpreadsheet } from "react-icons/bs";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import SectionMarkdown from "./SectionMarkdown";
import ExcelTableView from "./ExcelTableView";
import YearlyComparisonTable from "./YearlyComparisonTable";

import type {
  MemorandumSection,
  MemorandumTableData,
} from "@/types/memorandum-detail";
import {
  formatSectionTitle,
  parseKeyValueContentToTable,
  stripLeadingSectionHeading,
} from "./section-utils";

type DynamicSectionEditorCardProps = {
  section: MemorandumSection;
  onSave: (
    sectionId: number,
    content: string,
    tableData?: MemorandumTableData | null,
  ) => Promise<void>;
  onRegenerate?: (sectionId: number, sectionKey?: string, customInstruction?: string) => Promise<void>;
};

const DynamicSectionEditorCard = ({
  section,
  onSave,
  onRegenerate,
}: DynamicSectionEditorCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(section.content || "");
  const [editedTableData, setEditedTableData] =
    useState<MemorandumTableData | null>(section.table_data || null);

  // Default view mode: "table" if table_data exists or is convertible, otherwise "document"
  const [viewMode, setViewMode] = useState<"table" | "document">("table");

  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);
  const [showRegeneratePrompt, setShowRegeneratePrompt] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");

  // Role-based access control
  const { user } = useAuth();
  const isSponsor = user?.customer_type === "Sponsor" || user?.role === "Sponsor";

  const sectionTitle =
    section.label ||
    section.title ||
    formatSectionTitle(section.section_key || section.section_type);

  // Determine the section identifier (use section_key if available, fallback to section_type)
  const sectionIdentifier = (section.section_key || section.section_type || "").toLowerCase();
  
  // Backend supports regeneration for all sections
  // Show regenerate button if onRegenerate callback is provided and is_regeneratable is not explicitly false
  const shouldShowRegenerateButton = section.is_regeneratable !== false && onRegenerate;

  const contentToRender = stripLeadingSectionHeading(
    editedContent,
    sectionTitle,
  );

  const hasExplicitTable = Boolean(
    editedTableData?.columns?.length && editedTableData?.rows?.length,
  );
  const keyValueTable = !hasExplicitTable
    ? parseKeyValueContentToTable(contentToRender)
    : null;

  const activeTable = hasExplicitTable
    ? editedTableData
    : keyValueTable;

  const hasTableCapability = Boolean(activeTable);
  const hasProseContent = Boolean(contentToRender && contentToRender.trim().length > 0);
  const canToggleView = hasTableCapability && hasProseContent;

  // Detect if this section should use yearly comparison format
  // Check if table has YEAR column and LINE ITEM column
  const shouldUseYearlyComparison = useMemo(() => {
    if (!activeTable?.columns || !activeTable?.rows) return false;
    
    const hasYearColumn = activeTable.columns.some(col => 
      String(col).toLowerCase().includes('year') ||
      String(col).toLowerCase().includes('date')
    );
    const hasLineItemColumn = activeTable.columns.some(col => 
      String(col).toLowerCase().includes('line item') ||
      String(col).toLowerCase().includes('property') ||
      String(col).toLowerCase() === 'item'
    );
    
    // Check if section type is one that benefits from yearly comparison
    const yearlyComparisonSections = [
      'sales_comparables',
      'lease_comparables', 
      'financial_analysis',
      'rent_roll'
    ];
    
    const isYearlySection = yearlyComparisonSections.some(type => 
      sectionIdentifier.includes(type)
    );
    
    return hasYearColumn && hasLineItemColumn && isYearlySection;
  }, [activeTable, sectionIdentifier]);

  useEffect(() => {
    setEditedContent(section.content || "");
    setEditedTableData(section.table_data || null);
    if (section.table_data?.columns?.length) {
      setViewMode("table");
    }
  }, [section.content, section.table_data, section.id]);

  const handleSave = async () => {
    const contentToSave = editedContent;

    // Table sections might have empty content string
    if (!hasExplicitTable && contentToSave.trim() === "") {
      toast.error("Section content cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      await onSave(section.id, contentToSave, editedTableData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(section.content || "");
    setEditedTableData(section.table_data || null);
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    try {
      setIsRegeneratingSection(true);
      // Pass sectionIdentifier (section_key or section_type) for reference
      await onRegenerate(
        section.id, 
        sectionIdentifier || undefined,
        customInstruction.trim() || undefined
      );
      setShowRegeneratePrompt(false);
      setCustomInstruction("");
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden backdrop-blur-sm bg-white/90 border-2 rounded-2xl p-5 md:p-7 mb-6 transition-all duration-300 w-full max-w-full min-w-0 shadow-lg hover:shadow-xl ${
        isEditing
          ? "border-emerald-400/60 shadow-emerald-100"
          : "border-gray-200/80 hover:border-blue-200/60"
      }`}
    >
      {/* Subtle decorative corner gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50/40 to-transparent rounded-2xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5 gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></span>
              {sectionTitle}
            </h3>
            {hasTableCapability ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/50 flex items-center gap-1.5 shadow-sm">
                <BsFileEarmarkSpreadsheet size={11} />
                Excel Table
              </span>
            ) : null}

            {/* View Mode Switcher */}
            {canToggleView ? (
              <div className="flex items-center rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 p-1 border border-slate-200/80 text-xs ml-0 sm:ml-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-emerald-700 shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                  title="View as Excel Spreadsheet"
                >
                  <BsFileEarmarkSpreadsheet className="text-emerald-600" size={12} />
                  <span>Spreadsheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("document")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
                    viewMode === "document"
                      ? "bg-white text-slate-800 shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                  title="View as Continuous Document Narrative"
                >
                  <FiFileText className="text-slate-600" size={12} />
                  <span>Narrative</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* AI Regenerate button - only shown for sponsors */}
            {isSponsor && shouldShowRegenerateButton && !isEditing && (
              <button
                onClick={() => setShowRegeneratePrompt(!showRegeneratePrompt)}
                disabled={isRegeneratingSection || isSaving}
                className="group flex items-center gap-2 text-indigo-700 hover:text-indigo-800 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/60 transition-all duration-200 disabled:opacity-60 shadow-sm hover:shadow-md cursor-pointer"
                type="button"
                title="Regenerate this section with AI"
              >
                <Sparkles
                  className={`w-4 h-4 text-indigo-600 ${
                    isRegeneratingSection ? "animate-spin" : "group-hover:scale-110 transition-transform"
                  }`}
                />
                <span>
                  {isRegeneratingSection ? "Regenerating..." : "Regenerate"}
                </span>
              </button>
            )}

            {/* Edit button - only shown for sponsors */}
            {isSponsor && !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="group flex items-center gap-2 text-emerald-700 hover:text-emerald-800 text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/60 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                type="button"
              >
                <FiEdit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {hasTableCapability ? "Edit Table" : "Edit"}
              </button>
            ) : isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                  type="button"
                >
                  <FiCheck className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 text-sm px-3 py-2 rounded-xl hover:bg-gray-100 disabled:opacity-60 transition-all duration-200 cursor-pointer"
                  type="button"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* AI Regenerate Custom Instruction Prompt */}
        {showRegeneratePrompt && (
          <div className="mb-5 p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  AI Regeneration
                </h4>
                <p className="text-xs text-indigo-700 mt-1.5 leading-relaxed">
                  Add custom instructions to guide the AI (optional)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRegeneratePrompt(false);
                  setCustomInstruction("");
                }}
                className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-100 rounded-lg transition-colors"
                type="button"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g., Focus on sustainability features, Emphasize cap rate..."
              className="w-full px-4 py-3 text-sm border border-indigo-300/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/80 backdrop-blur-sm resize-y min-h-[90px] transition-all"
              disabled={isRegeneratingSection}
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowRegeneratePrompt(false);
                  setCustomInstruction("");
                }}
                disabled={isRegeneratingSection}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-white/60 rounded-lg disabled:opacity-50 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isRegeneratingSection}
                className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
                type="button"
              >
                <Sparkles className={`w-4 h-4 ${isRegeneratingSection ? "animate-spin" : ""}`} />
                {isRegeneratingSection ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        )}

        {/* Primary Content */}
        {viewMode === "table" && activeTable ? (
          <div className="mb-4">
            {shouldUseYearlyComparison ? (
              <YearlyComparisonTable
                tableData={activeTable}
                title={sectionTitle}
              />
            ) : (
              <ExcelTableView
                tableData={activeTable}
                title={sectionTitle}
                subtitle={
                  section.section_key ? `Section: ${section.section_key}` : undefined
                }
                editable={isEditing}
                onTableDataChange={(newTable) => {
                  setEditedTableData(newTable);
                }}
              />
            )}
          </div>
        ) : (
          <div className="mt-4">
            {!isEditing ? (
              <div className="prose prose-sm md:prose-base max-w-none">
                <SectionMarkdown
                  content={contentToRender}
                  className="text-sm md:text-base text-gray-700 leading-relaxed"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Section Content (Markdown)
                </label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[180px] px-4 py-3 border-2 border-gray-300 focus:border-emerald-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm md:text-base resize-y font-mono bg-white shadow-inner transition-all"
                  placeholder="Write section content in markdown..."
                />
              </div>
            )}
          </div>
        )}

        {/* Attachment Download - Special emphasis for financial sections */}
        {section.attachment_url && (
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                  <BsFileEarmarkSpreadsheet className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Excel Financial Model Available
                  </p>
                  <p className="text-xs text-blue-700">
                    Download the full financial analysis spreadsheet
                  </p>
                </div>
              </div>
              <a
                href={section.attachment_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Excel
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">
            {sectionTitle}
          </h3>
          {hasTableCapability ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <BsFileEarmarkSpreadsheet size={11} />
              Excel Table Enabled
            </span>
          ) : null}

          {/* View Mode Switcher (When both Table and Document Prose are available) */}
          {canToggleView ? (
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs ml-0 sm:ml-2">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-white text-emerald-800 shadow-xs border border-slate-200 font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="View as Excel Spreadsheet"
              >
                <BsFileEarmarkSpreadsheet className="text-emerald-700" size={12} />
                <span>Spreadsheet</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("document")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === "document"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="View as Continuous Document Narrative"
              >
                <FiFileText className="text-slate-600" size={12} />
                <span>Narrative</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* AI Regenerate button - show for all non-table sections */}
          {shouldShowRegenerateButton && !isEditing && (
            <button
              onClick={() => setShowRegeneratePrompt(!showRegeneratePrompt)}
              disabled={isRegeneratingSection || isSaving}
              className="flex items-center gap-1.5 text-indigo-700 hover:text-indigo-800 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-50 border border-indigo-200 transition-colors disabled:opacity-60 shadow-2xs cursor-pointer"
              type="button"
              title="Regenerate this section with AI"
            >
              <Sparkles
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 ${
                  isRegeneratingSection ? "animate-spin" : ""
                }`}
              />
              <span>
                {isRegeneratingSection ? "Regenerating..." : "Regenerate with AI"}
              </span>
            </button>
          )}

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
              type="button"
            >
              <FiEdit className="w-4 h-4" />
              {hasTableCapability ? "Edit Table" : "Edit"}
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 shadow-xs cursor-pointer"
                type="button"
              >
                <FiCheck className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-700 text-sm px-2.5 py-1.5 disabled:opacity-60 cursor-pointer"
                type="button"
              >
                <FiX className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Regenerate Custom Instruction Prompt */}
      {showRegeneratePrompt && (
        <div className="mb-4 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-semibold text-indigo-900">
                AI Regeneration Prompt
              </h4>
              <p className="text-xs text-indigo-700 mt-1">
                Provide optional instructions to guide the AI (e.g., "Focus on sustainability features" or "Emphasize cap rate compression")
              </p>
            </div>
            <button
              onClick={() => {
                setShowRegeneratePrompt(false);
                setCustomInstruction("");
              }}
              className="text-indigo-600 hover:text-indigo-800 p-1"
              type="button"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="Enter custom instructions for AI regeneration (optional)..."
            className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-y min-h-[80px]"
            disabled={isRegeneratingSection}
          />

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setShowRegeneratePrompt(false);
                setCustomInstruction("");
              }}
              disabled={isRegeneratingSection}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegeneratingSection}
              className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 font-medium cursor-pointer"
              type="button"
            >
              <Sparkles className={`w-4 h-4 ${isRegeneratingSection ? "animate-spin" : ""}`} />
              {isRegeneratingSection ? "Regenerating..." : "Generate"}
            </button>
          </div>
        </div>
      )}

};

export default DynamicSectionEditorCard;

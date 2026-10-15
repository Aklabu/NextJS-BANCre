"use client";

import React from "react";
import { MemorandumHeaderProps } from "@/types/memorandum-detail";
import { FaDownload } from "react-icons/fa6";
import { useRouter } from "next/navigation";

const MemorandumHeader: React.FC<MemorandumHeaderProps> = ({
  memorandumId,
  title,
  subtitle,
  activeTab,
  onTabChange,
  canPublish = false,
  isPublishing = false,
  onPublish,
  onExport,
}) => {
  const router = useRouter();

  return (
    <div className="mb-4 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0 max-w-full">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-normal text-gray-900 break-words">
                {title}
              </h1>
              {/* Subtitle removed - show "Back to Editor" button instead when in preview mode */}
              {activeTab === "preview" ? (
                <button
                  onClick={() => onTabChange("editor")}
                  className="mt-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition"
                  type="button"
                >
                  ← Back to Editor
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeTab === "editor" ? (
                <button
                  onClick={() => onTabChange("preview")}
                  className="group relative px-7 py-3 cursor-pointer flex items-center gap-2 font-semibold text-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 transition-all duration-300 group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-pink-600"></div>
                  <span className="relative flex items-center gap-2">
                    Take a Final Review
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              ) : null}

              {activeTab === "preview" && canPublish && onPublish ? (
                <button
                  onClick={onPublish}
                  disabled={isPublishing}
                  className="group relative px-6 py-3 cursor-pointer flex items-center gap-2 font-semibold text-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 transition-all duration-300 group-hover:from-emerald-700 group-hover:via-teal-700 group-hover:to-green-700"></div>
                  <span className="relative flex items-center gap-2">
                    {isPublishing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Publishing...
                      </>
                    ) : (
                      <>
                        Publish
                        <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              ) : null}

              {activeTab === "preview" ? (
                <button
                  onClick={() => {
                    if (onExport) {
                      onExport();
                      return;
                    }

                    if (!memorandumId) return;
                    router.push(`/memorandum/${memorandumId}/download`);
                  }}
                  disabled={!memorandumId && !onExport}
                  className="group relative px-6 py-3 cursor-pointer flex items-center gap-2 font-semibold text-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-600 to-blue-700 transition-all duration-300 group-hover:from-blue-600 group-hover:via-cyan-700 group-hover:to-blue-800"></div>
                  <span className="relative flex items-center gap-2">
                    Export
                    <FaDownload size={16} className="transition-transform group-hover:translate-y-0.5" />
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorandumHeader;

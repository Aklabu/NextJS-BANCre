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
              <p className="text-gray-600 text-sm md:text-base mt-1 break-words">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "editor" ? (
                <button
                  onClick={() => onTabChange("preview")}
                  className="px-6 py-2.5 cursor-pointer flex items-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                  type="button"
                >
                  Take a Final Review
                </button>
              ) : null}

              {activeTab === "preview" && canPublish && onPublish ? (
                <button
                  onClick={onPublish}
                  disabled={isPublishing}
                  className="px-4 py-2 cursor-pointer flex items-center bg-emerald-600 text-white rounded-full duration-300 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {isPublishing ? "Publishing..." : "Publish"}
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
                  className="px-4 py-2 cursor-pointer flex items-center bg-blue-400 text-white rounded-full duration-500 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export
                  <FaDownload size={18} className="inline-block ml-2 text-white" />
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

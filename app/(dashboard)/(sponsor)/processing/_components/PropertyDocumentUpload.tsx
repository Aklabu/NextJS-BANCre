"use client";

import React, { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, X } from "lucide-react";
import type { FileItem } from "./useFileUpload";

type PropertyDocumentUploadProps = {
  documents: FileItem[];
  onAddDocuments: (files: File[]) => void;
  onRemoveDocument: (documentId: string) => void;
  imageCount?: number;
  maxFiles?: number;
};

export const PropertyDocumentUpload = ({
  documents,
  onAddDocuments,
  onRemoveDocument,
  imageCount = 0,
  maxFiles = 20,
}: PropertyDocumentUploadProps) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onAddDocuments(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onAddDocuments(Array.from(e.dataTransfer.files));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalFiles = imageCount + documents.length;

  return (
    <div className="rounded-2xl border border-[#E5E7EB] p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <Label className="text-sm font-semibold text-gray-800">Property Documents</Label>
          <p className="text-xs text-[#4A5565] mt-1">
            Upload property documents (PDF, Excel, Word, PowerPoint, images) - max {maxFiles} total files including images.
          </p>
        </div>
        <span className="text-xs text-[#4A5565]">
          {totalFiles}/{maxFiles}
        </span>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-[#D1D5DB]"
        }`}
      >
        <div className="flex justify-center mb-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-2">Drag and drop documents here</p>
        <p className="text-xs text-[#4A5565] mb-4">or browse from your device</p>

        <Input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc"
          multiple
          onChange={handleSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-md border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse Documents
        </button>
      </div>

      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-[#4A5565]">{formatFileSize(doc.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveDocument(doc.id)}
                aria-label={`Remove ${doc.name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white text-gray-700 shadow-sm hover:bg-gray-50 flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

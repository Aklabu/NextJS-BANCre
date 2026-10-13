"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImagePlus, X } from "lucide-react";
import type { ImageItem } from "./useFileUpload";

type PropertyImageUploadProps = {
  images: ImageItem[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (imageId: string) => void;
  maxImages?: number;
};

export const PropertyImageUpload = ({
  images,
  onAddImages,
  onRemoveImage,
  maxImages = 6,
}: PropertyImageUploadProps) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const imagePreviews = useMemo(
    () =>
      images.map((image) => ({
        ...image,
        url: image.source === "upload" ? URL.createObjectURL(image.file) : image.url,
      })),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.source === "upload") {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [imagePreviews]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onAddImages(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onAddImages(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="rounded-2xl border border-[#E5E7EB] p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <Label className="text-sm font-semibold text-gray-800">Property Images</Label>
          <p className="text-xs text-[#4A5565] mt-1">
            {images.length > 0 && images.some((img) => img.source === "place")
              ? `${images.filter((img) => img.source === "place").length} image${
                  images.filter((img) => img.source === "place").length > 1 ? "s" : ""
                } fetched from Google Maps. `
              : ""}
            Remove any photo or append new uploads (max {maxImages} images).
          </p>
        </div>
        <span className="text-xs text-[#4A5565]">
          {images.length}/{maxImages}
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
            <ImagePlus className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-2">Drag and drop property images here</p>
        <p className="text-xs text-[#4A5565] mb-4">or browse from your device</p>

        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-md border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse Images
        </button>
      </div>

      {imagePreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imagePreviews.map((preview) => (
            <div
              key={preview.id}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
                {preview.source === "place" ? "Fetched" : "New"}
              </span>
              <button
                type="button"
                onClick={() => onRemoveImage(preview.id)}
                aria-label={`Remove ${preview.name}`}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-black/55 text-white shadow-sm hover:bg-black/70"
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

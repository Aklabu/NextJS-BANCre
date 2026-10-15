"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { HeroSectionProps } from "@/types/memorandum-detail";

//========== Hero Section Component ===========

const FALLBACK_IMAGE = "/images/SponsorDashboard.png";

const normalizeImageUrl = (image?: string) => {
  if (!image) return "";

  const trimmed = image.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  if (!baseUrl) return trimmed;

  return `${baseUrl}/${trimmed.replace(/^\/+/, "")}`;
};

const HeroSection: React.FC<HeroSectionProps> = ({
  heroImage,
  galleryImages,
  title,
}) => {
  //========== State ===========
  const [selectedImage, setSelectedImage] = useState<string>(
    normalizeImageUrl(heroImage),
  );

  useEffect(() => {
    const normalizedHero = normalizeImageUrl(heroImage);
    setSelectedImage(normalizedHero || "");
  }, [heroImage]);

  return (
    <div className="mb-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* ====== Hero Image Container ====== */}
      <div className="relative w-full h-64 md:h-96 lg:h-[500px] rounded-xl overflow-hidden mb-4 border border-gray-200 shadow-sm">
        <Image
          src={selectedImage || FALLBACK_IMAGE}
          alt={title}
          fill
          className="object-cover"
          priority
          unoptimized
          onError={() => setSelectedImage(FALLBACK_IMAGE)}
        />
        {/* ====== Hero Title Overlay ====== */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 md:p-8 flex items-end justify-between">
          <div>
            <span className="inline-block bg-blue-600/90 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-md mb-2">
              Featured Property Photo
            </span>
            <h2 className="text-white text-lg md:text-2xl font-bold drop-shadow-sm">{title}</h2>
          </div>
        </div>
      </div>

      {/* Property Gallery & Assets section removed - only hero image shown above */}
    </div>
  );
};

export default HeroSection;

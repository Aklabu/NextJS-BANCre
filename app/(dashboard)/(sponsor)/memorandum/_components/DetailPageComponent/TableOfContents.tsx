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
    <section className="relative mb-10 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl opacity-60"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
      
      <div className="relative backdrop-blur-sm bg-white/70 border-2 border-gray-200/80 shadow-2xl rounded-3xl p-8 hover:shadow-[0_20px_70px_rgba(0,0,0,0.12)] transition-all duration-500">
        {/* Enhanced header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-md opacity-50"></div>
              <div className="relative h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Contents
            </span>
          </div>
          
          <h2 className="text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
              Table of Contents
            </span>
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg"></div>
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 shadow-md"></div>
            <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-pink-300 to-orange-300"></div>
          </div>
        </div>

        {/* Enhanced items */}
        <div className="space-y-1">
          {items.map((item, index) => {
            const gradients = [
              { from: "#3B82F6", to: "#2563EB", glow: "rgba(59, 130, 246, 0.4)" },
              { from: "#8B5CF6", to: "#7C3AED", glow: "rgba(139, 92, 246, 0.4)" },
              { from: "#EC4899", to: "#DB2777", glow: "rgba(236, 72, 153, 0.4)" },
            ];
            const gradient = gradients[index % 3];
            
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScrollToSection(item.anchorId)}
                className="group w-full text-left flex items-center gap-4 py-4 px-4 hover:px-5 rounded-2xl hover:bg-white/80 transition-all duration-300 cursor-pointer border border-transparent hover:border-white/60 hover:shadow-xl relative overflow-hidden"
              >
                {/* Hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-blue-50/50 group-hover:via-purple-50/50 group-hover:to-pink-50/50 transition-all duration-300 rounded-2xl"></div>
                
                <div className="relative z-10 flex items-center gap-4 flex-1">
                  {/* Fancy number badge */}
                  <div className="relative shrink-0">
                    <div 
                      className="absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`, filter: `drop-shadow(0 0 8px ${gradient.glow})` }}
                    ></div>
                    <div 
                      className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                      style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                    >
                      {item.id}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <span className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors leading-snug">
                    {item.title}
                  </span>
                  
                  {/* Arrow icon */}
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TableOfContents;

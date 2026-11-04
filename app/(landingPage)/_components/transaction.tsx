"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

const transactions = [
  {
    id: 1,
    title: "Sheraton Miami Freedom Park",
    location: "Miami, FL",
    image: "/images/img2.jpg",
    type: "Hospitality",
    value: "$125M",
    status: "Closed"
  },
  {
    id: 2,
    title: "Sheraton Miami Freedom Park",
    location: "Miami, FL",
    image: "/images/img3.jpg",
    type: "Mixed-Use",
    value: "$89M",
    status: "Closed"
  },
  {
    id: 3,
    title: "945 Bryant",
    location: "San Francisco, CA",
    image: "/images/img2.jpg",
    type: "Office",
    value: "$156M",
    status: "Closed"
  },
  {
    id: 4,
    title: "Marram Montauk",
    location: "Montauk, NY",
    image: "/images/img3.jpg",
    type: "Hospitality",
    value: "$42M",
    status: "Closed"
  },
  {
    id: 5,
    title: "Pioneer Building",
    location: "San Francisco, CA",
    image: "/images/img2.jpg",
    type: "Office",
    value: "$78M",
    status: "Closed"
  },
  {
    id: 6,
    title: "Sycamore Haus",
    location: "West Hollywood, CA",
    image: "/images/img3.jpg",
    type: "Multifamily",
    value: "$63M",
    status: "Closed"
  },
];

const Transaction = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="transactions" className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 py-20 md:py-28 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        {/* Premium Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-full text-blue-700 text-sm font-semibold mb-6 shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span>PORTFOLIO SHOWCASE</span>
          </div>

          {/* Main Heading with Gradient */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
              Our Transactions
            </span>
          </h2>

          {/* Subtitle with better typography */}
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-3">
              Includes transactions previously completed by employees of BANCre.com
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-8 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">$550M+</span>
                <span className="text-gray-500 text-xs md:text-sm mt-1">Total Transaction Value</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-gray-300" />
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">25+</span>
                <span className="text-gray-500 text-xs md:text-sm mt-1">Markets Served</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-gray-300" />
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">100%</span>
                <span className="text-gray-500 text-xs md:text-sm mt-1">Success Rate</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Slider with Coverflow Effect */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <Swiper
            modules={[Autoplay, EffectCoverflow, Pagination]}
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            slidesPerView="auto"
            loop={true}
            speed={800}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2.5,
              slideShadows: false,
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            breakpoints={{
              0: { 
                slidesPerView: 1,
                spaceBetween: 20,
              },
              768: { 
                slidesPerView: 2,
                spaceBetween: 30,
              },
              1024: { 
                slidesPerView: 3,
                spaceBetween: 40,
              },
            }}
            className="!pb-16"
          >
            {transactions.map((tx, index) => (
              <SwiperSlide key={tx.id} className="!w-[340px] md:!w-[380px]">
                {({ isActive }) => (
                  <motion.div
                    animate={{
                      scale: isActive ? 1 : 0.9,
                      opacity: isActive ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.3 }}
                    className="group relative"
                  >
                    {/* Main Card - Image Only */}
                    <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100">
                      {/* Image Section */}
                      <div className="relative h-80 md:h-96 overflow-hidden">
                        {/* Property Type Badge */}
                        <div className="absolute top-4 left-4 z-20">
                          <div className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-semibold rounded-full shadow-md">
                            {tx.type}
                          </div>
                        </div>

                        {/* Image with Gradient Overlay */}
                        <div className="relative h-full">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                          <Image
                            src={tx.image}
                            alt={tx.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                      </div>

                      {/* Decorative shine effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>

      {/* Custom Pagination Styles */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          background: #9CA3AF;
          opacity: 0.5;
          width: 10px;
          height: 10px;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          background: linear-gradient(to right, #2563EB, #9333EA);
          opacity: 1;
          width: 32px;
          border-radius: 5px;
        }
      `}</style>
    </section>
  );
};

export default Transaction;

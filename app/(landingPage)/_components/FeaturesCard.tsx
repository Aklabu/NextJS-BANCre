"use client";
import React from 'react';
import { motion } from 'framer-motion';

type FeaturesCardProps = {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    iconBgColor?: string;
};

const FeaturesCard = ({
    title = "Feature Title",
    description = "Feature description goes here.",
    icon,
    iconBgColor = "#E5E7EB",

}: FeaturesCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className='relative group w-full max-w-[360px] h-full'
        >
            {/* Outer glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-700" />
            
            {/* Main card */}
            <div className="relative h-full bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg group-hover:shadow-2xl transition-all duration-500">
                {/* Top gradient accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Animated gradient orb background */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Content container */}
                <div className="relative p-6 flex flex-col gap-4 h-full">
                    {/* Icon section with premium design */}
                    <div className="relative">
                        <motion.div 
                            style={{ backgroundColor: iconBgColor }} 
                            className='relative p-3.5 rounded-xl inline-block shadow-md group-hover:shadow-xl transition-all duration-500 border border-white/50'
                            whileHover={{ 
                                scale: 1.05,
                                rotate: [0, -3, 3, 0],
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Icon glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="relative z-10 scale-90">
                                {icon}
                            </div>
                        </motion.div>

                        {/* Floating badge */}
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-100 scale-0">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    {/* Title with premium typography */}
                    <div className="space-y-1.5">
                        <h3 className='text-gray-900 font-bold text-lg leading-tight tracking-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-500'>
                            {title}
                        </h3>
                        
                        {/* Decorative underline */}
                        <div className="h-0.5 w-0 group-hover:w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500" />
                    </div>

                    {/* Description with better readability */}
                    <div className="flex-1">
                        <p className='text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-500'>
                            {description}
                        </p>
                    </div>

                    {/* Bottom decorative element */}
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                        <span>Learn more</span>
                        <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                </div>

                {/* Corner accent - top right */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 via-purple-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Corner accent - bottom left */}
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-500/10 via-blue-500/5 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Shine effect overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                </div>
            </div>
        </motion.div>
    );
};

export default FeaturesCard;
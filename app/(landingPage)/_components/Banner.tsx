"use client";
import { FaAngleRight } from "react-icons/fa6";
import { motion } from "framer-motion";

const Banner = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative"
    >
      <div className="w-full h-[90vh] bg-[linear-gradient(255.49deg,rgba(0,0,0,0)_-2%,rgba(0,0,0,0.54)_58.53%),url('/images/banner.png')] bg-no-repeat bg-center bg-cover relative flex flex-col items-center justify-center text-white overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        
        {/* Subtle animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />

        {/* Content container */}
        <div className="flex flex-col w-full items-start gap-6 px-4 lg:px-8 md:absolute bottom-8 lg:bottom-16 z-10">
          {/* Main Heading with enhanced styling */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl md:text-4xl lg:text-6xl font-bold leading-tight w-full lg:w-10/12 xl:w-8/12 drop-shadow-2xl"
          >
            Your Banker for{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              Commercial Real Estate
            </span>
            <br />
            Powered by AI
          </motion.h1>

          <div className="w-full flex gap-6 flex-col md:flex-row justify-between items-start md:items-end">
            {/* Subtitle with better spacing */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full lg:w-7/12"
            >
              <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed text-white/95 drop-shadow-lg">
                Loan Origination, Brokerage and Capital Markets.{" "}
                <span className="font-semibold text-blue-300">Faster, Cheaper, Smarter</span>
              </p>
              
              {/* Key features badges */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium">
                  <span className="mr-2">⚡</span>
                  AI-Powered
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium">
                  <span className="mr-2">🔒</span>
                  Secure
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium">
                  <span className="mr-2">⏱️</span>
                  Real-Time
                </div>
              </div>
            </motion.div>

            {/* Enhanced CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative group"
            >
              {/* Button glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500" />
              
              <button
                className="relative button-primary px-6 py-3 rounded-full text-sm md:text-base flex items-center gap-3 cursor-pointer whitespace-nowrap shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 font-semibold"
                onClick={() => {
                  document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>VIEW TRANSACTIONS</span>
                <FaAngleRight className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </motion.div>
  );
};

export default Banner;

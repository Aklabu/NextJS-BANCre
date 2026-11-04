import Banner from "./_components/Banner";
import HowItWorksOne from "./_components/HowItWorksOne";
import HowItWorksTwo from "./_components/HowItWorksTwo";
import BlackButtonRightIcon from "../../components/BlackButtonRightIcon";
import { FaArrowRight } from "react-icons/fa6";
import Headline from "@/components/Headline";
import Description from "@/components/Description";
import Features from "./_components/Features";
import Carousel from "./_components/Carousel";
import ComponentAnimation from "./_components/Animation";
import Partners from "./_components/Partners";
import Transaction from "./_components/transaction";

const page = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <Banner />

      {/* AI Document Viewer Section - Premium Design */}
      <section className="relative bg-gradient-to-b from-white via-gray-50 to-white py-8 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.05),transparent_50%)]" />
        <ComponentAnimation />
      </section>

      {/* Transactions Section - Enhanced */}
      <section className="relative bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
        <Transaction />
      </section>

      {/* Features Section - Modern Dark Theme */}
      <section className="relative z-0 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A]">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <Features />
      </section>

      {/* Partners Section - Premium Layout */}
      <section className="relative text-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col gap-12 py-24 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_60%)]" />
        
        <div className="relative z-10">
          <div className="inline-block mb-4">
            <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-6" />
          </div>
          <Headline text="Our Network of Partners" />
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto px-4">
            Trusted by leading institutions and organizations across the commercial real estate industry
          </p>
        </div>
        
        <div className="relative z-10">
          <Partners />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
      </section>

      {/* CTA Section - Enterprise Grade */}
      <section className="relative py-20 z-0 bg-white overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#D1D5DB_0.8px,transparent_0.8px)] bg-size-[24px_24px] opacity-40" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 -z-10" />

        <div className="my-16 relative">
          {/* Decorative Element */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-2xl" />
          </div>

          <div className="text-center space-y-6 px-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              Join Our Network
            </div>

            <Headline text="Join the BANCre Capital Markets Network" />
            
            <Description
              text="Become a BANCre broker and leverage technology to build your own capital markets 
                  origination business."
            />

            {/* Enhanced Contact Button */}
            <div className="flex items-center justify-center pt-8">
              {/* Primary CTA Button - Premium Design */}
              <div className="relative group">
                {/* Animated gradient border */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-xl opacity-75 blur group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-gradient bg-[length:200%_auto]" />
                
                {/* Button */}
                <a
                  href="/contact"
                  className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-base md:text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 group/btn overflow-hidden"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  
                  <span className="relative z-10">Contact Us</span>
                  <FaArrowRight className="relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </a>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 pt-12 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Free to Start</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default page;

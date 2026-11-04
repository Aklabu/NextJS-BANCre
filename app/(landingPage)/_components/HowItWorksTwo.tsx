"use client";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import { FaAngleRight, FaBuilding, FaBuildingColumns, FaCheck } from "react-icons/fa6";

const howItWorksTwoData = [{
    id: 1,
    logo: FaBuilding,
    title: "For Sponsors",
    subtitle: `Manage properties, upload documents, generate offering memorandums, and connect 
    with the right lenders for your deals.`,
    property: [
        "Property portfolio management",
        "AI-powered document analysis",
        "Instant OM generation",
        "Lender quote comparison"
    ],
    buttonName: "Sponsor Sign Up",
    iconName: FaAngleRight
},
{
    id: 2,
    logo: FaBuildingColumns,
    title: "For Lenders",
    subtitle: `Access quality deals, query data with AI assistance, and submit competitive quotes 
    directly through our platform.`,
    property: [
        "Curated deal pipeline",
        "AI-powered deal analysis",
        "Direct quote submission",
        "Deal tracking & CRM"
    ],
    buttonName: "Lender Sign Up",
    iconName: FaAngleRight
}];

export default function HowItWorksTwo() {
    const router = useRouter();

    // Navigate to sign-up page
    const handleGoToSignUp = () => {
        router.push("/register");
    }

    return (
      <div className="relative flex flex-col xl:flex-row items-center justify-center gap-16 xl:gap-20 px-4 py-20">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-600/5 rounded-full blur-3xl" />
        </div>

        {howItWorksTwoData.map((item, index) => (
          // Card with enhanced design
          <div
            key={item.id}
            className="relative group bg-gradient-to-br from-[#F9FAFB] to-[#E5E7EB] max-w-[550px] w-full rounded-3xl p-10 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-white/80 overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-700 rounded-3xl" />

            {/* Decorative top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon with enhanced styling */}
              <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-primary to-blue-700 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500">
                <item.logo className="w-7 h-7 text-white" />
              </div>

              {/* Title */}
              <h1 className="text-[#111827] text-2xl md:text-3xl font-bold mt-6 group-hover:text-blue-900 transition-colors duration-300">
                {item.title}
              </h1>

              {/* Subtitle */}
              <p className="text-[#4B5563] mt-5 text-base md:text-lg leading-relaxed">
                {item.subtitle}
              </p>

              {/* Features list with enhanced styling */}
              <div className="flex flex-col gap-3.5 mt-6">
                {item.property.map((prope, idx) => (
                  <div 
                    key={prope} 
                    className="flex items-center gap-3 group/item"
                    style={{
                      animationDelay: `${idx * 100}ms`
                    }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-green-100 group-hover/item:bg-green-200 transition-colors duration-300">
                      <FaCheck className="text-primary w-3 h-3" />
                    </div>
                    <p className="text-[#374151] text-sm md:text-base font-medium group-hover/item:text-gray-900 transition-colors duration-300">
                      {prope}
                    </p>
                  </div>
                ))}
              </div>

              {/* Enhanced Button */}
              <div className="mt-8 relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
                <Button
                  onClick={handleGoToSignUp}
                  text={item.buttonName}
                  arrow={true}
                  className="button-primary w-full relative shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
              </div>
            </div>

            {/* Decorative corner elements */}
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        ))}
      </div>
    );
}
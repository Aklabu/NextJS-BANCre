import FeaturesCard from "./FeaturesCard";
import { FaRobot } from "react-icons/fa6";
import { SiGoogledocs } from "react-icons/si";
import { FaHandshake } from "react-icons/fa";
import { GoGraph } from "react-icons/go";
import { FaShieldAlt } from "react-icons/fa";
import Headline from "@/components/Headline";
import Description from "@/components/Description";
import Button from "@/components/Button";
import Image from "next/image";

type Feature = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
};

const Features = () => {
  const features: Feature[] = [
    {
      id: 6,
      title: "30 Years CRE Experience",
      description:
        "AI technologies combined with actual CRE experience accelerate going to market for the optimal financing. BANCre's network includes thousands of real lender relationships developed over years of closing deals.",
      icon: <FaHandshake className="text-[#9333EA]" size={40} />,
      iconBgColor: "#F3E8FF",
    },
    {
      id: 1,
      title: "Lender Tools fo Faster Quotes",
      description:
        "Lender view deals with Interactive Offering Memordums and can export rent rolls, operating statements, and property information directly into their own excel models to make quoting deals faster.",
      icon: <FaRobot className="text-[#2563EB]" size={40} />,
      iconBgColor: "#DBEAFE",
    },
    {
      id: 2,
      title: "Instant Offering Memorandums",
      description:
        "Upload rent rolls, leases or financials and let AI structure them to generate professional offering memorandums ready to distribute to Lenders. Go to market in minutes instead of weeks.",
      icon: <SiGoogledocs className="text-[#16A34A]" size={40} />,
      iconBgColor: "#DCFCE7",
    },
    {
      id: 4,
      title: "Save Time & Costs",
      description:
        "AI and BANCre partnerships will enable time and cost savings in origination and closing including, due diligence, KYC, third-party reports and legal.",
      icon: <GoGraph className="text-[#EA580C]" size={40} />,
      iconBgColor: "#FFEDD5",
    },
    {
      id: 3,
      title: "View Documents with BANCre AI Analyst",
      description:
        "View deals and do Q&A about property documents with our intelligent AI chatbot BANCre analyst 24/7.",
      icon: <FaHandshake className="text-[#9333EA]" size={40} />,
      iconBgColor: "#F3E8FF",
    },

    {
      id: 5,
      title: "Real-Time Loan Quote Comparison",
      description:
        "Receive and compare loan quotes from multiple qualified lenders in one centralized platform",
      icon: <FaShieldAlt className="text-[#DC2626]" size={40} />,
      iconBgColor: "#FEE2E2",
    },
  ];

  return (
    <div className="relative mt-20 py-1 mx-auto max-w-7xl px-4">
      <div className="my-20">
        {/* Section Header with Modern Design */}
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-full text-blue-700 text-sm font-semibold mb-2 shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span>OUR ADVANTAGES</span>
          </div>

          {/* Decorative line */}
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <div className="flex text-white text-4xl md:text-5xl lg:text-6xl font-semibold">
              <h1 className="font-light">Why</h1>
              <h1 className="font-extrabold px-2 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
                BANCre
              </h1>
              <h1 className="font-light">?</h1>
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          </div>

          {/* Description with better typography */}
          <Description 
            text="BANCre leverages technology to revolutionize the origination and closing process of commercial real estate loans." 
            className="text-white/80 text-lg md:text-xl max-w-3xl leading-relaxed"
          />

          {/* Stats Bar - Optional Enhancement */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 pt-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span>30+ Years Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Instant Processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards grid with enhanced spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mt-16 mb-32 justify-items-center">
        {features.map((feature, idx) => (
          <div key={idx} className="w-full flex justify-center">
            <FeaturesCard
              icon={feature.icon}
              iconBgColor={feature.iconBgColor}
              title={feature.title}
              description={feature.description}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;

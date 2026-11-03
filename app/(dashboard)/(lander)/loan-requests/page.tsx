"use client";

import { useState } from "react";
import LoanRequestsGrid from "./_components/LoanRequestsGrid";

const Page = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <LoanRequestsGrid />
    </div>
  );
};

export default Page;

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Save, Send, Building2, Calculator, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchLoanRequestDetail,
  submitLoanQuote,
  parseQuoteSubmissionError,
  formatValidationErrors,
  formatCurrency,
  toDateTimeLocalValue,
  toISODateTime,
  calculateInitialFunding,
  calculateFutureFunding,
  calculateSponsorEquity,
  type LoanRequestDetail,
  type QuoteSubmissionPayload,
} from "./api";

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const requestId = Array.isArray(params.requestId)
    ? params.requestId[0]
    : params.requestId;

  const numericRequestId = Number(requestId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<LoanRequestDetail | null>(null);
  const [activeSection, setActiveSection] = useState<string>("lender-info");
  const [form, setForm] = useState<Omit<QuoteSubmissionPayload, "term"> & { term: string }>({
    lender_name: "",
    guarantor: "",
    expires_at: toDateTimeLocalValue(),
    loan_amount: "",
    initial_funding: "",
    future_funding: "",
    sponsor_equity: "",
    max_as_is_ltv: "72.00",
    max_ltc: "80.00",
    max_as_stabilized_ltv: "70.00",
    min_as_is_dy: "8.50",
    min_stabilized_dy: "9.00",
    term: "24",
    interest_rate: "7.25",
    amortization: "30-year amortization",
    prepayment: "3-2-1 step-down",
    origination_fee: "1.00",
    capex_reserve: "50000.00",
    ff_and_e_reserve: "25000.00",
    interest_carry_reserve: "100000.00",
    extension_conditions: "Two 6-month extensions at 0.25% fee each.",
    collateral: "First lien deed of trust",
    recourse: "Non-recourse with standard carve-outs",
  });

  useEffect(() => {
    const hydrate = async () => {
      if (!Number.isFinite(numericRequestId) || numericRequestId <= 0) {
        toast.error("Invalid request id.");
        setLoading(false);
        return;
      }

      try {
        const payload = await fetchLoanRequestDetail(numericRequestId);
        setDetail(payload);

        if (payload) {
          const loanAmount = Number(payload.requested_amount) || 0;
          const initialFunding = Number(calculateInitialFunding(loanAmount));
          const futureFunding = Number(calculateFutureFunding(loanAmount, initialFunding));

          setForm((prev) => ({
            ...prev,
            loan_amount: loanAmount.toFixed(2),
            initial_funding: initialFunding.toFixed(2),
            future_funding: futureFunding.toFixed(2),
            sponsor_equity: calculateSponsorEquity(loanAmount),
            max_as_is_ltv: payload.ltv || "72.00",
            term: String(payload.loan_term || 24),
          }));
        }
      } catch (error) {
        console.error("Failed to load request detail for quote submission", error);
        toast.error("Unable to load request details.");
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [numericRequestId]);

  const updateField = (
    field: keyof (Omit<QuoteSubmissionPayload, "term"> & { term: string }),
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!Number.isFinite(numericRequestId) || numericRequestId <= 0) {
      toast.error("Invalid request id.");
      return;
    }

    setSubmitting(true);

    const payload: QuoteSubmissionPayload = {
      lender_name: form.lender_name.trim(),
      guarantor: form.guarantor.trim(),
      expires_at: toISODateTime(form.expires_at),
      loan_amount: form.loan_amount,
      initial_funding: form.initial_funding,
      future_funding: form.future_funding,
      sponsor_equity: form.sponsor_equity,
      max_as_is_ltv: form.max_as_is_ltv,
      max_ltc: form.max_ltc,
      max_as_stabilized_ltv: form.max_as_stabilized_ltv,
      min_as_is_dy: form.min_as_is_dy,
      min_stabilized_dy: form.min_stabilized_dy,
      term: Number(form.term),
      interest_rate: form.interest_rate,
      amortization: form.amortization.trim(),
      prepayment: form.prepayment.trim(),
      origination_fee: form.origination_fee,
      capex_reserve: form.capex_reserve,
      ff_and_e_reserve: form.ff_and_e_reserve,
      interest_carry_reserve: form.interest_carry_reserve,
      extension_conditions: form.extension_conditions.trim(),
      collateral: form.collateral.trim(),
      recourse: form.recourse.trim(),
    };

    try {
      const response = await submitLoanQuote(numericRequestId, payload);

      if (response.success) {
        toast.success(response.message || "Quote submitted successfully!");

        // Redirect to loan request details page
        setTimeout(() => {
          router.push(`/loan-requests/${numericRequestId}`);
        }, 1000);
      } else {
        toast.error(response.message || "Failed to submit quote.");
      }
    } catch (error: any) {
      console.error("Quote submission error:", error);

      const parsedError = parseQuoteSubmissionError(error);

      switch (parsedError.type) {
        case "validation":
          if (parsedError.fieldErrors) {
            const { messages, totalCount } = formatValidationErrors(
              parsedError.fieldErrors,
              3
            );

            toast.error(
              <div>
                <p className="font-semibold">Validation errors:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {messages.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                  {totalCount > 3 && (
                    <li>...and {totalCount - 3} more</li>
                  )}
                </ul>
              </div>,
              { duration: 5000 }
            );
          } else {
            toast.error(parsedError.message);
          }
          break;

        case "permission":
          toast.error(`Permission Denied: ${parsedError.message}`);
          break;

        case "business_rule":
          toast.error(parsedError.message);
          break;

        case "not_found":
          toast.error(parsedError.message);
          break;

        case "network":
          toast.error(parsedError.message);
          break;

        default:
          toast.error(parsedError.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quote form...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: "lender-info", label: "Lender Information", icon: Building2 },
    { id: "loan-structure", label: "Loan Structure", icon: Calculator },
    { id: "terms-conditions", label: "Terms & Conditions", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={
              Number.isFinite(numericRequestId)
                ? `/loan-requests/${numericRequestId}`
                : "/loan-requests"
            }
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Loan Request
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Loan Quote</h1>
              {detail && (
                <p className="text-gray-600 mt-2">
                  {detail.property_name} • {detail.property_type}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Draft</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Summary Card */}
      {detail && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-blue-100 text-sm mb-1">Requested Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(detail.requested_amount)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Loan Term</p>
                <p className="text-2xl font-bold">{detail.loan_term} months</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Target LTV</p>
                <p className="text-2xl font-bold">{detail.ltv}%</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Property Address</p>
                <p className="text-sm font-medium truncate">{detail.property_address}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Form Sections</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs">All fields marked with * are required for quote submission.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lender Information Section */}
              {activeSection === "lender-info" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Lender Information</h2>
                      <p className="text-sm text-gray-600">Basic lender and guarantor details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lender Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        value={form.lender_name}
                        onChange={(e) => updateField("lender_name", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter lender name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guarantor
                      </label>
                      <input
                        value={form.guarantor}
                        onChange={(e) => updateField("guarantor", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter guarantor name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quote Expiration Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={(e) => updateField("expires_at", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Loan Structure Section */}
              {activeSection === "loan-structure" && (
                <div className="space-y-6">
                  {/* Loan Amount & Funding */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Loan Amount & Funding</h3>
                        <p className="text-sm text-gray-600">Primary loan structure details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Loan Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.loan_amount}
                            onChange={(e) => updateField("loan_amount", e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sponsor Equity <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.sponsor_equity}
                            onChange={(e) => updateField("sponsor_equity", e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Initial Funding <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.initial_funding}
                            onChange={(e) => updateField("initial_funding", e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Future Funding <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.future_funding}
                            onChange={(e) => updateField("future_funding", e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LTV & Ratios */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">LTV & Debt Yield Ratios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max As-Is LTV <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.max_as_is_ltv}
                            onChange={(e) => updateField("max_as_is_ltv", e.target.value)}
                            className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max LTC <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.max_ltc}
                            onChange={(e) => updateField("max_ltc", e.target.value)}
                            className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max As-Stabilized LTV <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.max_as_stabilized_ltv}
                            onChange={(e) => updateField("max_as_stabilized_ltv", e.target.value)}
                            className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Min As-Is DY <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.min_as_is_dy}
                            onChange={(e) => updateField("min_as_is_dy", e.target.value)}
                            className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Min Stabilized DY <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.min_stabilized_dy}
                            onChange={(e) => updateField("min_stabilized_dy", e.target.value)}
                            className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interest & Term */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Interest Rate & Term</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interest Rate <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.interest_rate}
                            onChange={(e) => updateField("interest_rate", e.target.value)}
                            className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Term (months) <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min="1"
                          step="1"
                          value={form.term}
                          onChange={(e) => updateField("term", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amortization <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          value={form.amortization}
                          onChange={(e) => updateField("amortization", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 30-year amortization"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prepayment <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          value={form.prepayment}
                          onChange={(e) => updateField("prepayment", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 3-2-1 step-down"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fees & Reserves */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Fees & Reserves</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Origination Fee <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.origination_fee}
                            onChange={(e) => updateField("origination_fee", e.target.value)}
                            className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CapEx Reserve <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.capex_reserve}
                            onChange={(e) => updateField("capex_reserve", e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          FF&E Reserve <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.ff_and_e_reserve}
                            onChange={(e) => updateField("ff_and_e_reserve", e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interest Carry Reserve <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.interest_carry_reserve}
                            onChange={(e) => updateField("interest_carry_reserve", e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms & Conditions Section */}
              {activeSection === "terms-conditions" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Terms & Conditions</h2>
                      <p className="text-sm text-gray-600">Additional loan terms and legal details</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extension Conditions <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={form.extension_conditions}
                        onChange={(e) => updateField("extension_conditions", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe extension conditions..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Collateral <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={form.collateral}
                        onChange={(e) => updateField("collateral", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe collateral terms..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recourse <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={form.recourse}
                        onChange={(e) => updateField("recourse", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe recourse terms..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Fixed at Bottom */}
              <div className="bg-white border-t border-gray-200 sticky bottom-0 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {activeSection === "lender-info" && "Step 1 of 3"}
                    {activeSection === "loan-structure" && "Step 2 of 3"}
                    {activeSection === "terms-conditions" && "Step 3 of 3"}
                  </div>
                  <div className="flex gap-3">
                    {activeSection !== "lender-info" && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentIndex = sections.findIndex(s => s.id === activeSection);
                          if (currentIndex > 0) {
                            setActiveSection(sections[currentIndex - 1].id);
                          }
                        }}
                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    
                    {activeSection !== "terms-conditions" ? (
                      <button
                        type="button"
                        onClick={() => {
                          const currentIndex = sections.findIndex(s => s.id === activeSection);
                          if (currentIndex < sections.length - 1) {
                            setActiveSection(sections[currentIndex + 1].id);
                          }
                        }}
                        className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Next Section
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        {submitting ? "Submitting Quote..." : "Submit Quote"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

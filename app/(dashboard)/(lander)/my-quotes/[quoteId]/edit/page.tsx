"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Save, 
  X,
  DollarSign, 
  Percent, 
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  User,
  Shield,
  Banknote,
  Scale,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchQuoteById,
  updateQuote,
  formatCurrency,
  formatPercent,
  toDateTimeLocalValue,
  toServerIsoDate,
  type QuoteItem,
  type QuoteUpdatePayload,
} from "../../api";

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const quoteId = Array.isArray(params.quoteId)
    ? params.quoteId[0]
    : params.quoteId;

  const numericQuoteId = Number(quoteId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<QuoteItem | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "structure" | "terms" | "legal">("basic");
  
  // Form state
  const [form, setForm] = useState<Partial<QuoteUpdatePayload>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (!Number.isFinite(numericQuoteId) || numericQuoteId <= 0) {
      toast.error("Invalid quote ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const payload = await fetchQuoteById(numericQuoteId);
      setQuote(payload);
      
      // Initialize form with current values
      setForm({
        lender_name: payload.lender_name,
        guarantor: payload.guarantor,
        loan_amount: String(payload.loan_amount),
        initial_funding: String(payload.initial_funding),
        future_funding: String(payload.future_funding),
        sponsor_equity: String(payload.sponsor_equity),
        interest_rate: String(payload.interest_rate),
        term: String(payload.term),
        max_as_is_ltv: String(payload.max_as_is_ltv),
        max_ltc: String(payload.max_ltc),
        max_as_stabilized_ltv: String(payload.max_as_stabilized_ltv),
        min_as_is_dy: String(payload.min_as_is_dy),
        min_stabilized_dy: String(payload.min_stabilized_dy),
        amortization: payload.amortization,
        prepayment: payload.prepayment,
        origination_fee: String(payload.origination_fee),
        capex_reserve: String(payload.capex_reserve),
        ff_and_e_reserve: String(payload.ff_and_e_reserve),
        interest_carry_reserve: String(payload.interest_carry_reserve),
        extension_conditions: payload.extension_conditions,
        collateral: payload.collateral,
        recourse: payload.recourse,
        expires_at: toDateTimeLocalValue(payload.expires_at),
      });
    } catch (error: any) {
      console.error("Failed to load quote for edit", error);
      toast.error(error.message || "Unable to load quote details.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [numericQuoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const updateField = (field: keyof QuoteUpdatePayload, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!Number.isFinite(numericQuoteId) || numericQuoteId <= 0) {
      toast.error("Invalid quote ID.");
      return;
    }

    if (!hasChanges) {
      toast.info("No changes to save.");
      return;
    }

    setSaving(true);
    try {
      // Prepare payload - convert expires_at to ISO format
      const payload: QuoteUpdatePayload = { ...form };
      
      if (form.expires_at) {
        const isoDate = toServerIsoDate(form.expires_at);
        if (!isoDate) {
          toast.error("Please provide a valid expiration date.");
          setSaving(false);
          return;
        }
        payload.expires_at = isoDate;
      }

      await updateQuote(numericQuoteId, payload);

      toast.success("Quote updated successfully.");
      router.push("/my-quotes");
    } catch (error: any) {
      console.error("Failed to update quote:", error);
      toast.error(error.message || "Failed to update quote. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push("/my-quotes");
      }
    } else {
      router.push("/my-quotes");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Loading quote editor...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <p className="text-lg font-medium text-gray-900">Quote not found</p>
          <Link
            href="/my-quotes"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Quotes
          </Link>
        </div>
      </div>
    );
  }

  // Check if quote can be edited
  if (quote.status.toLowerCase() !== "submitted") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto" />
          <p className="text-lg font-medium text-gray-900">Quote Cannot Be Edited</p>
          <p className="text-sm text-gray-600">
            Only quotes with status "Submitted" can be edited.
          </p>
          <p className="text-sm text-gray-600">
            Current status: <span className="font-semibold">{quote.status}</span>
          </p>
          <Link
            href="/my-quotes"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Quotes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Link
                href="/my-quotes"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl font-bold text-gray-900">Edit Quote</h1>
                  <span className="text-xs text-gray-500">#{quote.id}</span>
                </div>
                <p className="text-xs text-gray-600">{quote.property_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-300 text-purple-700 text-xs font-semibold">
                {quote.status}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-t border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "basic"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab("structure")}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "structure"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Loan Structure
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "terms"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Terms & Fees
            </button>
            <button
              onClick={() => setActiveTab("legal")}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "legal"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Legal & Conditions
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Info Alert */}
          <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Edit Mode</p>
              <p className="text-blue-700">
                All fields are editable. Click "Save Changes" when you're done editing, or "Cancel" to discard changes.
              </p>
            </div>
          </div>

          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* Lender Information */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-900">Lender Information</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Lender Name</span>
                      <input
                        type="text"
                        value={form.lender_name || ""}
                        onChange={(e) => updateField("lender_name", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="Enter lender name"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Guarantor</span>
                      <input
                        type="text"
                        value={form.guarantor || ""}
                        onChange={(e) => updateField("guarantor", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="Enter guarantor"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Key Terms */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-semibold text-gray-900">Key Terms</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700">Interest Rate (%)</span>
                        <span className="text-red-500">*</span>
                      </div>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.interest_rate || ""}
                        onChange={(e) => updateField("interest_rate", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 5.75"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700">Term (months)</span>
                        <span className="text-red-500">*</span>
                      </div>
                      <input
                        required
                        type="number"
                        min="1"
                        value={form.term || ""}
                        onChange={(e) => updateField("term", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 36"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700">Expiration Date</span>
                        <span className="text-red-500">*</span>
                      </div>
                      <input
                        required
                        type="datetime-local"
                        value={form.expires_at || ""}
                        onChange={(e) => updateField("expires_at", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loan Structure Tab */}
          {activeTab === "structure" && (
            <div className="space-y-6">
              {/* Loan Amounts */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-semibold text-gray-900">Loan Amounts</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Total Loan Amount</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.loan_amount || ""}
                        onChange={(e) => updateField("loan_amount", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 5000000"
                      />
                      {form.loan_amount && (
                        <p className="mt-1.5 text-xs text-gray-500">
                          {formatCurrency(Number(form.loan_amount))}
                        </p>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Initial Funding</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.initial_funding || ""}
                        onChange={(e) => updateField("initial_funding", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 4000000"
                      />
                      {form.initial_funding && (
                        <p className="mt-1.5 text-xs text-gray-500">
                          {formatCurrency(Number(form.initial_funding))}
                        </p>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Future Funding</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.future_funding || ""}
                        onChange={(e) => updateField("future_funding", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 1000000"
                      />
                      {form.future_funding && (
                        <p className="mt-1.5 text-xs text-gray-500">
                          {formatCurrency(Number(form.future_funding))}
                        </p>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Sponsor Equity</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.sponsor_equity || ""}
                        onChange={(e) => updateField("sponsor_equity", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 1250000"
                      />
                      {form.sponsor_equity && (
                        <p className="mt-1.5 text-xs text-gray-500">
                          {formatCurrency(Number(form.sponsor_equity))}
                        </p>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-semibold text-gray-900">Risk Metrics & Ratios</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Max As-Is LTV (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.max_as_is_ltv || ""}
                        onChange={(e) => updateField("max_as_is_ltv", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 75"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Max LTC (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.max_ltc || ""}
                        onChange={(e) => updateField("max_ltc", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 80"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Max Stabilized LTV (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.max_as_stabilized_ltv || ""}
                        onChange={(e) => updateField("max_as_stabilized_ltv", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 70"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Min As-Is DY (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.min_as_is_dy || ""}
                        onChange={(e) => updateField("min_as_is_dy", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 8.5"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Min Stabilized DY (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.min_stabilized_dy || ""}
                        onChange={(e) => updateField("min_stabilized_dy", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 9.0"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terms & Fees Tab */}
          {activeTab === "terms" && (
            <div className="space-y-6">
              {/* Loan Terms */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-semibold text-gray-900">Loan Terms</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Amortization</span>
                      <input
                        type="text"
                        value={form.amortization || ""}
                        onChange={(e) => updateField("amortization", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 30 year amortization"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Prepayment</span>
                      <input
                        type="text"
                        value={form.prepayment || ""}
                        onChange={(e) => updateField("prepayment", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., Lockout 12 months, then 3-2-1"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Fees & Reserves */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-semibold text-gray-900">Fees & Reserves</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Origination Fee (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.origination_fee || ""}
                        onChange={(e) => updateField("origination_fee", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 1.5"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">CapEx Reserve</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.capex_reserve || ""}
                        onChange={(e) => updateField("capex_reserve", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 50000"
                      />
                      {form.capex_reserve && (
                        <p className="mt-1.5 text-xs text-gray-500">
                          {formatCurrency(Number(form.capex_reserve))}
                        </p>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">FF&E Reserve</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.ff_and_e_reserve || ""}
                        onChange={(e) => updateField("ff_and_e_reserve", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 25000"
                      />
                      {form.ff_and_e_reserve && (
                        <p className="mt-1.5 text-xs text-gray-500">
                          {formatCurrency(Number(form.ff_and_e_reserve))}
                        </p>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Interest Carry Reserve</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.interest_carry_reserve || ""}
                        onChange={(e) => updateField("interest_carry_reserve", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., 100000"
                      />
                      {form.interest_carry_reserve && (
                        <p className="mt-1.5 text-xs text-gray-500">
                          {formatCurrency(Number(form.interest_carry_reserve))}
                        </p>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal & Conditions Tab */}
          {activeTab === "legal" && (
            <div className="space-y-6">
              {/* Legal Terms */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-slate-600" />
                    <h3 className="text-base font-semibold text-gray-900">Legal Terms</h3>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-700 mb-2 block">Extension Conditions</span>
                      <textarea
                        rows={3}
                        value={form.extension_conditions || ""}
                        onChange={(e) => updateField("extension_conditions", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., Two 6-month extensions at 0.25% fee each"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block">
                        <span className="text-xs font-medium text-gray-700 mb-2 block">Collateral</span>
                        <input
                          type="text"
                          value={form.collateral || ""}
                          onChange={(e) => updateField("collateral", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                          placeholder="e.g., First lien deed of trust"
                        />
                      </label>
                    </div>
                    <div>
                      <label className="block">
                        <span className="text-xs font-medium text-gray-700 mb-2 block">Recourse</span>
                        <input
                          type="text"
                          value={form.recourse || ""}
                          onChange={(e) => updateField("recourse", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                          placeholder="e.g., Non-recourse with standard carve-outs"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Page;

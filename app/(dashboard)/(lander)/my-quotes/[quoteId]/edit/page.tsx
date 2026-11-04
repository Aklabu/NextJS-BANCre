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
  Building2,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchQuoteById,
  updateQuote,
  formatCurrency,
  toDateTimeLocalValue,
  toServerIsoDate,
  type QuoteItem,
} from "../../api";

type QuotePatchForm = {
  interest_rate: string;
  loan_amount: string;
  expires_at: string;
};

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
  const [form, setForm] = useState<QuotePatchForm>({
    interest_rate: "",
    loan_amount: "",
    expires_at: "",
  });

  // Track form changes
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
      const initialForm = {
        interest_rate: String(payload.interest_rate),
        loan_amount: String(payload.loan_amount),
        expires_at: toDateTimeLocalValue(payload.expires_at),
      };
      setForm(initialForm);
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

  const updateField = (field: keyof QuotePatchForm, value: string) => {
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

    const expiresAtIso = toServerIsoDate(form.expires_at);
    if (!expiresAtIso) {
      toast.error("Please provide a valid expiration date.");
      return;
    }

    setSaving(true);
    try {
      await updateQuote(numericQuoteId, {
        interest_rate: form.interest_rate,
        loan_amount: form.loan_amount,
        expires_at: expiresAtIso,
      });

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

  // Calculate changes
  const getChangeSummary = () => {
    if (!quote) return null;
    
    const changes = [];
    if (Number(form.interest_rate) !== quote.interest_rate) {
      const diff = Number(form.interest_rate) - quote.interest_rate;
      changes.push({
        field: "Interest Rate",
        old: `${quote.interest_rate}%`,
        new: `${form.interest_rate}%`,
        impact: diff > 0 ? "increase" : "decrease"
      });
    }
    if (Number(form.loan_amount) !== quote.loan_amount) {
      const diff = Number(form.loan_amount) - quote.loan_amount;
      changes.push({
        field: "Loan Amount",
        old: formatCurrency(quote.loan_amount),
        new: formatCurrency(Number(form.loan_amount)),
        impact: diff > 0 ? "increase" : "decrease"
      });
    }
    if (form.expires_at !== toDateTimeLocalValue(quote.expires_at)) {
      changes.push({
        field: "Expiration Date",
        old: new Date(quote.expires_at).toLocaleString(),
        new: new Date(form.expires_at).toLocaleString(),
        impact: "neutral"
      });
    }
    return changes;
  };

  const changes = getChangeSummary();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Loading quote editor...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
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

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    accepted: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/my-quotes"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Quotes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Quote</h1>
          <p className="text-gray-600 mt-1">
            Modify quote details for Quote #{quote.id}
          </p>
        </div>
        <span
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            statusColors[quote.status as keyof typeof statusColors] ||
            "bg-gray-100 text-gray-800 border-gray-200"
          }`}
        >
          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
        </span>
      </div>

      {/* Quote Overview Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {quote.property_name || "Property"}
            </h2>
            {quote.property_address && (
              <p className="text-sm text-gray-600 mt-1">{quote.property_address}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Loan Request</p>
            <p className="text-lg font-semibold text-gray-900">#{quote.loan_request}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Current Amount</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(quote.loan_amount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Current Interest</p>
                <p className="text-lg font-bold text-gray-900">
                  {quote.interest_rate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Expires</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(quote.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Editable Fields Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-700" />
              Editable Quote Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Update the fields below to modify your quote
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Interest Rate Field */}
            <div>
              <label className="block">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Interest Rate (%)
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.interest_rate}
                  onChange={(e) => updateField("interest_rate", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., 5.75"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Enter the annual interest rate as a percentage
                </p>
              </label>
            </div>

            {/* Loan Amount Field */}
            <div>
              <label className="block">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Loan Amount
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.loan_amount}
                  onChange={(e) => updateField("loan_amount", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., 500000"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {form.loan_amount && Number(form.loan_amount) > 0
                    ? `Formatted: ${formatCurrency(Number(form.loan_amount))}`
                    : "Enter the total loan amount in dollars"}
                </p>
              </label>
            </div>

            {/* Expiration Date Field */}
            <div>
              <label className="block">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Expiration Date & Time
                  </span>
                  <span className="text-red-500">*</span>
                </div>
                <input
                  required
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => updateField("expires_at", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Quote will expire after this date and time
                </p>
              </label>
            </div>

            {/* Info Notice */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Editable Fields Limited</p>
                <p className="text-blue-700">
                  Only interest rate, loan amount, and expiration date can be modified
                  according to the PATCH contract. Other quote details are read-only.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Summary */}
        {hasChanges && changes && changes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Change Summary
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review the changes before saving
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {change.field}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">{change.old}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-900">
                          {change.new}
                        </span>
                      </div>
                    </div>
                    {change.impact !== "neutral" && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          change.impact === "increase"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {change.impact === "increase" ? "↑" : "↓"}{" "}
                        {change.impact}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
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
      </form>
    </div>
  );
};

export default Page;

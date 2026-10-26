"use client";

import React from "react";
import type { LoanQuote } from "./loan-types";

interface LoanQuotesTableProps {
  quotes: LoanQuote[];
  loading?: boolean;
  mutatingQuoteId?: number | null;
  onAccept: (quote: LoanQuote) => void;
  onDecline: (quote: LoanQuote) => void;
  onView: (quote: LoanQuote) => void;
  bestRate?: string | number;
  highestLTV?: string | number;
}

const LoanQuotesTable: React.FC<LoanQuotesTableProps> = ({
  quotes,
  loading = false,
  mutatingQuoteId = null,
  onAccept,
  onDecline,
  onView,
  bestRate,
  highestLTV,
}) => {
  const formatCurrency = (value: string | number | undefined) => {
    const num = Number(value || 0);
    return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  const formatRate = (value: string | number | undefined) => {
    const num = Number(value || 0);
    return num.toFixed(2);
  };

  const formatLTV = (value: string | number | undefined) => {
    const num = Number(value || 0);
    return num.toFixed(0);
  };

  const formatTerm = (value: string | number | undefined) => {
    const num = Number(value || 0);
    return { months: num, years: (num / 12).toFixed(1) };
  };

  const formatFee = (value: string | number | undefined) => {
    const num = Number(value || 0);
    return num.toFixed(2);
  };

  const formatDSCR = (value: string | number | undefined) => {
    const num = Number(value || 0);
    return num > 0 ? num.toFixed(2) : "0.00";
  };

  const getExpiryInfo = (expiresAt?: string) => {
    if (!expiresAt) return { days: null, label: "N/A" };
    
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) return { days: null, label: "N/A" };
    
    const daysUntil = Math.ceil(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntil <= 0) {
      return { days: daysUntil, label: "Expired" };
    }
    
    return { days: daysUntil, label: `${daysUntil} day${daysUntil === 1 ? "" : "s"}` };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const isFinalized = (status?: string) => {
    const s = (status || "").toLowerCase();
    return s === "accepted" || s === "declined" || s === "decline";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-600">Loading quotes...</p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-600">
          No lender quotes received yet. When commercial lenders review your
          requests, their quotes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Lender
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Property
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Loan amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Max LTV
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Term
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Fee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                DSCR
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotes.map((quote) => {
              const loanAmount = formatCurrency(quote.loan_amount);
              const rate = formatRate(quote.interest_rate);
              const ltv = formatLTV(quote.max_as_is_ltv);
              const term = formatTerm(quote.term);
              const fee = formatFee(quote.origination_fee);
              const dscr = formatDSCR(quote.dscr);
              const expiry = getExpiryInfo(quote.expires_at);
              const finalized = isFinalized(quote.status);
              const isMutating = mutatingQuoteId === quote.id;

              return (
                <tr 
                  key={quote.id} 
                  onClick={() => onView(quote)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Lender */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {getInitials(quote.lender_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {quote.lender_name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Property */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">
                      {quote.property_name || "N/A"}
                    </p>
                    {quote.loan_request && (
                      <p className="text-xs text-gray-500">
                        #{quote.loan_request}
                      </p>
                    )}
                  </td>

                  {/* Loan Amount */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">
                      ${loanAmount}
                    </p>
                  </td>

                  {/* Rate */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {rate}%
                    </p>
                  </td>

                  {/* Max LTV */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{ltv}%</p>
                  </td>

                  {/* Term */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{term.months} mo</p>
                  </td>

                  {/* Fee */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{fee}%</p>
                  </td>

                  {/* DSCR */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">
                      {dscr === "0.00" ? "[0.00]" : dscr}
                    </p>
                  </td>

                  {/* Expires */}
                  <td className="px-4 py-3">
                    <p
                      className={`text-sm ${
                        expiry.days !== null && expiry.days <= 3 && expiry.days > 0
                          ? "text-red-600 font-medium"
                          : "text-gray-900"
                      }`}
                    >
                      {expiry.label}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {!finalized ? (
                        <>
                          <button
                            onClick={() => onAccept(quote)}
                            disabled={isMutating}
                            className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onDecline(quote)}
                            disabled={isMutating}
                            className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onView(quote)}
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination hint */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          Page 1 of {Math.ceil(quotes.length / 24)} · Click a row to open the
          full quote in a side drawer. Accept asks for confirmation and closes
          the request.
        </p>
      </div>
    </div>
  );
};

export default LoanQuotesTable;

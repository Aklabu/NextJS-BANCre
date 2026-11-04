"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  ChevronRight,
  ChevronDown,
  User,
  Building,
  CheckCircle2
} from "lucide-react";
import type { AcceptedQuote } from "../api";

type AcceptedQuotesListProps = {
  quotes: AcceptedQuote[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

const QuoteCard = ({ quote }: { quote: AcceptedQuote }) => {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex gap-4">
          {/* Property Image */}
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {quote.property_image_url ? (
              <Image
                src={quote.property_image_url}
                alt={quote.property_name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {quote.property_name}
              </h3>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                {quote.status}
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{quote.property_address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="w-4 h-4 flex-shrink-0" />
                <span>{quote.property_type}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Loan Amount</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(quote.loan_amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Interest Rate</p>
                <p className="text-sm font-semibold text-gray-900">
                  {quote.interest_rate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Term</p>
                <p className="text-sm font-semibold text-gray-900">
                  {quote.term} months
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">DSCR</p>
                <p className="text-sm font-semibold text-gray-900">
                  {quote.dscr.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {expanded ? (
            <>
              <span>Show less</span>
              <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>View full details</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sponsor Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Sponsor Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">
                    {quote.sponsor_first_name} {quote.sponsor_last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium text-gray-900">{quote.sponsor_company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{quote.sponsor_email}</span>
                </div>
              </div>
            </div>

            {/* Loan Structure */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Loan Structure
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Initial Funding:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(quote.initial_funding)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Future Funding:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(quote.future_funding)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sponsor Equity:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(quote.sponsor_equity)}
                  </span>
                </div>
              </div>
            </div>

            {/* LTV & Yield Metrics */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                LTV & Yield Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Max As-Is LTV:</span>
                  <span className="font-medium text-gray-900">{quote.max_as_is_ltv}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max LTC:</span>
                  <span className="font-medium text-gray-900">{quote.max_ltc}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min As-Is DY:</span>
                  <span className="font-medium text-gray-900">{quote.min_as_is_dy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Stabilized DY:</span>
                  <span className="font-medium text-gray-900">{quote.min_stabilized_dy}%</span>
                </div>
              </div>
            </div>

            {/* Terms & Dates */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Terms & Timeline
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(quote.submitted_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(quote.expires_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amortization:</span>
                  <span className="font-medium text-gray-900">{quote.amortization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Origination Fee:</span>
                  <span className="font-medium text-gray-900">{quote.origination_fee}%</span>
                </div>
              </div>
            </div>

            {/* Additional Terms */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Terms</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Prepayment:</span>
                  <p className="font-medium text-gray-900 mt-1">{quote.prepayment}</p>
                </div>
                <div>
                  <span className="text-gray-600">Collateral:</span>
                  <p className="font-medium text-gray-900 mt-1">{quote.collateral}</p>
                </div>
                <div>
                  <span className="text-gray-600">Recourse:</span>
                  <p className="font-medium text-gray-900 mt-1">{quote.recourse}</p>
                </div>
                <div>
                  <span className="text-gray-600">Guarantor:</span>
                  <p className="font-medium text-gray-900 mt-1">{quote.guarantor}</p>
                </div>
              </div>
            </div>

            {/* Reserves */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Reserves</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">CapEx Reserve:</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatCurrency(quote.capex_reserve)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">FF&E Reserve:</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatCurrency(quote.ff_and_e_reserve)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Interest Carry Reserve:</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatCurrency(quote.interest_carry_reserve)}
                  </p>
                </div>
              </div>
            </div>

            {/* Extension Conditions */}
            {quote.extension_conditions && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Extension Conditions</h4>
                <p className="text-sm text-gray-700">{quote.extension_conditions}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AcceptedQuotesList = ({
  quotes,
  loading,
  onLoadMore,
  hasMore,
  loadingMore,
}: AcceptedQuotesListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="grid grid-cols-4 gap-3">
                  <div className="h-12 bg-gray-200 rounded" />
                  <div className="h-12 bg-gray-200 rounded" />
                  <div className="h-12 bg-gray-200 rounded" />
                  <div className="h-12 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Accepted Quotes Yet
          </h3>
          <p className="text-sm text-gray-600">
            Your accepted quotes will appear here once sponsors accept your loan offers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <QuoteCard key={quote.id} quote={quote} />
      ))}

      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load More Quotes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AcceptedQuotesList;

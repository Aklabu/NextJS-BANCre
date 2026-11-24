"use client";

/**
 * SectionDataRenderer
 *
 * Renders the section_data envelope for table sections:
 *   financial_analysis, financing_summary, market_summary,
 *   sales_comparables, lease_comparables
 *
 * Always check section_data.status === "complete" before rendering data.
 * When status === "no_data", show a friendly empty-state message.
 */

import React from "react";
import type {
  SectionDataEnvelope,
  SectionDataPayload,
  FinancialAnalysisData,
  FinancialAnalysisGroup,
  FinancingSummaryData,
  FinancingSummaryGroup,
  MarketSummaryData,
  ComparablesData,
} from "@/types/memorandum-detail";

type Props = {
  sectionData: SectionDataEnvelope<SectionDataPayload>;
  sectionType: string;
};

const SectionDataRenderer: React.FC<Props> = ({ sectionData, sectionType }) => {
  if (!sectionData) return null;

  if (sectionData.status === "no_data") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
        No data available for this section.
      </div>
    );
  }

  let data = sectionData.data as any;

  // Debug logging to see actual data structure
  console.log("SectionDataRenderer - sectionType:", sectionType);
  console.log("SectionDataRenderer - raw data:", JSON.stringify(data, null, 2));

  // Check if data is in the expected format
  if (!data || typeof data !== 'object') {
    console.error("Invalid section_data format:", data);
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
        <p className="font-semibold mb-2">Invalid Data Format</p>
        <p>This section's data is not in the expected format. Please regenerate it.</p>
      </div>
    );
  }

  // The backend may include metadata fields (key, label, kind, date_range) alongside the actual data
  // Filter these out and extract only the data fields we need
  const metadataKeys = ['key', 'label', 'kind', 'date_range', 'type'];
  
  // Deep clean function to remove objects from values
  const cleanValue = (value: any): any => {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      // If it's an object with ONLY metadata keys and no actual data, skip it
      const keys = Object.keys(value);
      const metadataOnlyKeys = ['key', 'label', 'kind', 'date_range'];
      const hasOnlyMetadata = keys.length > 0 && 
        keys.every(k => metadataOnlyKeys.includes(k)) &&
        keys.includes('key') && keys.includes('label');
      
      if (hasOnlyMetadata) {
        return null; // Skip pure metadata objects
      }
      
      // Otherwise, recursively clean the object (keep it but clean its properties)
      const cleaned: any = {};
      for (const [k, v] of Object.entries(value)) {
        const cleanedValue = cleanValue(v);
        // Only include the property if it's not null (wasn't filtered out)
        if (cleanedValue !== null || v === null) {
          cleaned[k] = cleanedValue;
        }
      }
      return cleaned;
    }
    if (Array.isArray(value)) {
      // Filter out null values from arrays (things that were removed)
      return value.map(cleanValue).filter(v => v !== null);
    }
    return value;
  };
  
  // Check if the data has these metadata fields mixed with actual data
  const hasMetadata = metadataKeys.some(key => key in data && key !== 'type');
  
  if (hasMetadata) {
    // Extract only non-metadata fields and deep clean them
    const cleanData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'type') {
        cleanData[key] = value; // Preserve type
      } else if (!metadataKeys.includes(key)) {
        cleanData[key] = cleanValue(value);
      }
    }
    data = cleanData;
    console.log("SectionDataRenderer - cleaned data:", JSON.stringify(data, null, 2));
  } else {
    // Even without top-level metadata, deep clean the data
    data = cleanValue(data);
  }

  switch (sectionType) {
    case "financial_analysis":
      return <FinancialAnalysisTable data={data as FinancialAnalysisData} />;
    case "financing_summary":
      return <FinancingSummaryTable data={data as FinancingSummaryData} />;
    case "market_summary":
      return <MarketSummaryView data={data as MarketSummaryData} />;
    case "sales_comparables":
    case "lease_comparables":
      return <ComparablesTable data={data as ComparablesData} />;
    default:
      return null;
  }
};

// ============================================================
// Financial Analysis
// ============================================================

const categoryStyle: Record<string, string> = {
  income: "bg-white",
  expense: "bg-red-50",
  noi: "bg-blue-50 font-semibold",
};

function formatValue(val: number): string {
  if (!Number.isFinite(val)) return "—";
  const abs = Math.abs(val);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(abs);
  return val < 0 ? `(${formatted})` : formatted;
}

function formatKpi(value: number, format: string): string {
  if (!Number.isFinite(value)) return "—";
  if (format === "percent") return `${value.toFixed(1)}%`;
  if (format === "currency")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  return String(value);
}

const FinancialAnalysisTable: React.FC<{ data: FinancialAnalysisData }> = ({ data }) => {
  if (!data) return null;

  // Check if using new groups-based format
  if (data.groups && Array.isArray(data.groups)) {
    return <FinancialAnalysisGroups groups={data.groups} />;
  }

  // Fall back to old array-based format
  const { periods, rows, kpis } = data;

  // Validate data structure
  if (!Array.isArray(periods) || !Array.isArray(rows)) {
    console.error("Invalid financial analysis data structure:", data);
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
        Invalid data format. Please regenerate this section.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3">
                Line Item
              </th>
              {periods.map((p, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, ri) => {
              // Ensure row.values is an array
              const values = Array.isArray(row.values) ? row.values : [];
              return (
                <tr key={ri} className={categoryStyle[row.category] ?? "bg-white"}>
                  <td className="px-4 py-2.5 text-gray-800">{row.label}</td>
                  {values.map((v, vi) => (
                    <td
                      key={vi}
                      className={`px-4 py-2.5 text-right tabular-nums ${v < 0 ? "text-red-600" : "text-gray-800"}`}
                    >
                      {formatValue(v)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* KPIs */}
      {kpis && Array.isArray(kpis) && kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3"
            >
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className="text-lg font-bold text-blue-700">
                {formatKpi(kpi.value, kpi.format)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Financial Analysis - Groups Format (New Backend)
// ============================================================

const FinancialAnalysisGroups: React.FC<{ groups: FinancialAnalysisGroup[] }> = ({ groups }) => {
  // Sort groups by order
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedGroups.map((group, groupIdx) => {
        // Convert fields object to array of [key, field] entries
        const fieldEntries = Object.entries(group.fields).filter(([_, field]) => {
          // Only include fields that have a display value and it's not an object
          return field?.display && typeof field.display !== 'object';
        });

        if (fieldEntries.length === 0) return null;

        return (
          <div key={groupIdx}>
            {group.title && (
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{group.title}</h4>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full text-sm divide-y divide-gray-100">
                <tbody className="divide-y divide-gray-100">
                  {fieldEntries.map(([key, field], ri) => (
                    <tr key={key} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2.5 font-medium text-gray-600 w-1/3 whitespace-nowrap">
                        {field.label}
                      </td>
                      <td className="px-4 py-2.5 text-gray-800">
                        {typeof field.display === 'string' || typeof field.display === 'number' 
                          ? field.display 
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// Financing Summary
// ============================================================

const FinancingSummaryTable: React.FC<{ data: FinancingSummaryData }> = ({ data }) => {
  if (!data) return null;

  // Check if using new groups-based format
  if (data.groups && Array.isArray(data.groups)) {
    return <FinancingSummaryGroups groups={data.groups} />;
  }

  // Fall back to old array-based format
  const { loans, reserves, coverage, missing_fields } = data;

  return (
    <div className="space-y-6">
      {/* Loans */}
      {loans && loans.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Loan Details</h4>
          <div className="space-y-4">
            {loans.map((loan, i) => (
              <div
                key={i}
                className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm"
              >
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Lender", loan.lender],
                      ["Status", loan.status],
                      ["Loan Amount", loan.loan_amount != null ? formatValue(loan.loan_amount) : null],
                      ["Interest Rate", loan.interest_rate != null ? `${loan.interest_rate}% (${loan.rate_type})` : null],
                      ["Maturity Date", loan.maturity_date],
                      ["LTV", loan.ltv != null ? `${loan.ltv}%` : null],
                      ["LTC", loan.ltc != null ? `${loan.ltc}%` : (missing_fields?.includes("ltc") ? "Not available in source documents" : null)],
                      ["Annual Debt Service", loan.annual_debt_service != null ? formatValue(loan.annual_debt_service) : null],
                      ["Amortization", loan.amortization_years != null ? `${loan.amortization_years} years` : null],
                      ["Recourse", loan.recourse],
                      ["Prepayment", loan.prepayment_terms],
                    ]
                      .filter(([, v]) => v != null)
                      .map(([label, value], ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2.5 font-medium text-gray-600 w-1/3 whitespace-nowrap">{label}</td>
                          <td className="px-4 py-2.5 text-gray-800">{value}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debt Coverage */}
      {coverage && coverage.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Debt Service Coverage</h4>
          <div className="flex flex-wrap gap-3">
            {coverage.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 px-5 py-3"
              >
                <p className="text-xs text-gray-500">{c.period} DSCR</p>
                <p className="text-xl font-bold text-emerald-700">{c.dscr.toFixed(2)}x</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reserves */}
      {reserves && reserves.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Reserves</h4>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reserve</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Monthly</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reserves.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2.5 text-gray-800">{r.label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatValue(r.monthly)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatValue(r.annual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Financing Summary - Groups Format (New Backend)
// ============================================================

const FinancingSummaryGroups: React.FC<{ groups: FinancingSummaryGroup[] }> = ({ groups }) => {
  // Sort groups by order
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedGroups.map((group, groupIdx) => {
        // Convert fields object to array of [key, field] entries
        const fieldEntries = Object.entries(group.fields).filter(([_, field]) => {
          // Only include fields that have a display value and it's not an object
          return field?.display && typeof field.display !== 'object';
        });

        if (fieldEntries.length === 0) return null;

        return (
          <div key={groupIdx}>
            {group.title && (
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{group.title}</h4>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full text-sm divide-y divide-gray-100">
                <tbody className="divide-y divide-gray-100">
                  {fieldEntries.map(([key, field], ri) => (
                    <tr key={key} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2.5 font-medium text-gray-600 w-1/3 whitespace-nowrap">
                        {field.label}
                      </td>
                      <td className="px-4 py-2.5 text-gray-800">
                        {typeof field.display === 'string' || typeof field.display === 'number' 
                          ? field.display 
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// Market Summary
// ============================================================

const MarketSummaryView: React.FC<{ data: MarketSummaryData }> = ({ data }) => {
  if (!data) return null;
  const { sections, metrics, data_gaps } = data;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {metrics.filter(m => m && m.label).map((m, i) => {
            const isGap = data_gaps?.includes(String(m.label).toLowerCase().replace(/\s/g, "_"));
            return (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-gradient-to-br from-slate-50 to-gray-50 px-4 py-3"
              >
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                {isGap ? (
                  <p className="text-xs italic text-gray-400">Not available in source documents</p>
                ) : (
                  <p className="text-base font-bold text-gray-800">
                    {m.format === "percent" && typeof m.value === "number"
                      ? `${m.value}%`
                      : m.format === "currency" && typeof m.value === "number"
                      ? formatValue(m.value)
                      : String(m.value)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Text sections */}
      {sections &&
        sections.map((s, i) => (
          <div key={i}>
            {s.heading && (
              <h4 className="text-base font-semibold text-gray-800 mb-2">{s.heading}</h4>
            )}
            {s.paragraphs.map((p, pi) => (
              <p key={pi} className="text-sm text-gray-700 leading-relaxed mb-2">
                {p}
              </p>
            ))}
          </div>
        ))}

      {/* Data gaps notice */}
      {data_gaps && data_gaps.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <span className="font-semibold">Note: </span>
          The following metrics were not available in source documents:{" "}
          {data_gaps.join(", ")}.
        </div>
      )}
    </div>
  );
};

// ============================================================
// Sales / Lease Comparables
// ============================================================

const ComparablesTable: React.FC<{ data: ComparablesData }> = ({ data }) => {
  if (!data) return null;
  const { status, columns, rows, subject_context, reason } = data;

  if (status === "no_data") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
        {reason ?? "No comparable data available."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subject_context && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
          <span className="font-semibold">Subject Property: </span>
          {subject_context.address}
          {subject_context.units ? ` — ${subject_context.units} units` : ""}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-gray-800">
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SectionDataRenderer;

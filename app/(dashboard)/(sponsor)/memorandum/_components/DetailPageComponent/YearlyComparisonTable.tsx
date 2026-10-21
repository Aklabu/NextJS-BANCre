"use client";

import React, { useMemo } from "react";
import type { MemorandumTableData } from "@/types/memorandum-detail";

type YearlyComparisonTableProps = {
  tableData: MemorandumTableData;
  title?: string;
};

/**
 * YearlyComparisonTable transforms vertical yearly data into horizontal side-by-side format
 * 
 * Input format:
 * LINE ITEM | YEAR | MONTHLY AMOUNT | ANNUAL TOTAL
 * Item A    | 2022 | $100          | $1,200
 * Item A    | 2023 | $110          | $1,320
 * Item B    | 2022 | $200          | $2,400
 * 
 * Output format:
 * LINE ITEM              | 2022          | 2023          | ...
 * Item A - Monthly       | $100          | $110          | ...
 * Item A - Annual        | $1,200        | $1,320        | ...
 * Item B - Monthly       | $200          | ...           | ...
 */
const YearlyComparisonTable: React.FC<YearlyComparisonTableProps> = ({ 
  tableData,
  title 
}) => {
  const transformedData = useMemo(() => {
    if (!tableData?.columns || !tableData?.rows) {
      return { headers: [], rows: [] };
    }

    // Find column indices
    const lineItemIdx = tableData.columns.findIndex(col => 
      String(col).toLowerCase().includes('line item') || 
      String(col).toLowerCase().includes('property') ||
      String(col).toLowerCase() === 'item'
    );
    const yearIdx = tableData.columns.findIndex(col => 
      String(col).toLowerCase().includes('year') ||
      String(col).toLowerCase().includes('date')
    );
    const monthlyIdx = tableData.columns.findIndex(col => 
      String(col).toLowerCase().includes('monthly')
    );
    const annualIdx = tableData.columns.findIndex(col => 
      String(col).toLowerCase().includes('annual')
    );

    // Extract unique years and sort them
    const years = Array.from(new Set(
      tableData.rows
        .map(row => String(row[yearIdx] || ''))
        .filter(year => year.trim() !== '')
    )).sort();

    // Extract unique line items
    const lineItems = Array.from(new Set(
      tableData.rows
        .map(row => String(row[lineItemIdx] || ''))
        .filter(item => item.trim() !== '')
    ));

    // Build data map: lineItem -> year -> { monthly, annual }
    const dataMap = new Map<string, Map<string, { monthly: string; annual: string }>>();
    
    tableData.rows.forEach(row => {
      const item = String(row[lineItemIdx] || '').trim();
      const year = String(row[yearIdx] || '').trim();
      const monthly = String(row[monthlyIdx] || '');
      const annual = String(row[annualIdx] || '');

      if (!item || !year) return;

      if (!dataMap.has(item)) {
        dataMap.set(item, new Map());
      }
      dataMap.get(item)!.set(year, { monthly, annual });
    });

    // Build output rows
    const outputRows: string[][] = [];
    
    lineItems.forEach(item => {
      const yearData = dataMap.get(item);
      if (!yearData) return;

      // Monthly row
      if (monthlyIdx >= 0) {
        const monthlyRow = [
          `${item} - Monthly`,
          ...years.map(year => yearData.get(year)?.monthly || '-')
        ];
        outputRows.push(monthlyRow);
      }

      // Annual row
      if (annualIdx >= 0) {
        const annualRow = [
          `${item} - Annual`,
          ...years.map(year => yearData.get(year)?.annual || '-')
        ];
        outputRows.push(annualRow);
      }

      // If no monthly/annual distinction, just use first data column
      if (monthlyIdx < 0 && annualIdx < 0 && tableData.columns.length > 2) {
        const dataIdx = tableData.columns.findIndex((_, i) => i !== lineItemIdx && i !== yearIdx);
        const simpleRow = [
          item,
          ...years.map(year => {
            const row = tableData.rows.find(r => 
              String(r[lineItemIdx]) === item && String(r[yearIdx]) === year
            );
            return row ? String(row[dataIdx] || '-') : '-';
          })
        ];
        outputRows.push(simpleRow);
      }
    });

    return {
      headers: ['LINE ITEM', ...years],
      rows: outputRows
    };
  }, [tableData]);

  if (transformedData.rows.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic p-4">
        No yearly comparison data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {title && (
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      )}
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
            {transformedData.headers.map((header, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                  idx === 0 
                    ? 'text-gray-800 sticky left-0 bg-emerald-50 z-10' 
                    : 'text-emerald-800'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transformedData.rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-gray-200 transition-colors ${
                rowIdx % 2 === 0 
                  ? 'bg-white hover:bg-gray-50' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={`px-4 py-3 text-sm ${
                    cellIdx === 0
                      ? 'font-medium text-gray-900 sticky left-0 z-10 bg-inherit'
                      : 'text-gray-700 text-right'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default YearlyComparisonTable;

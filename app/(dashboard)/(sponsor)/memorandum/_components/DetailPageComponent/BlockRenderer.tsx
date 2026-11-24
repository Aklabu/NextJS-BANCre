"use client";

import React from "react";
import type {
  SectionBlock,
  HeadingBlock,
  ParagraphBlock,
  BulletListBlock,
  KeyValueTableBlock,
  TableBlock,
} from "@/types/memorandum-detail";

type BlockRendererProps = {
  blocks: SectionBlock[];
};

const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks }) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <BlockItem key={index} block={block} />
      ))}
    </div>
  );
};

const BlockItem: React.FC<{ block: SectionBlock }> = ({ block }) => {
  switch (block.type) {
    case "heading":
      return <HeadingBlockView block={block as HeadingBlock} />;
    case "paragraph":
      return <ParagraphBlockView block={block as ParagraphBlock} />;
    case "bullet_list":
      return <BulletListBlockView block={block as BulletListBlock} />;
    case "key_value_table":
      return <KeyValueTableBlockView block={block as KeyValueTableBlock} />;
    case "table":
      return <TableBlockView block={block as TableBlock} />;
    default:
      return null;
  }
};

// ---- Heading ----
const HeadingBlockView: React.FC<{ block: HeadingBlock }> = ({ block }) => {
  const { level, content } = block;

  const headingClasses: Record<number, string> = {
    1: "text-3xl font-bold text-gray-900 mb-4",
    2: "text-2xl font-bold text-gray-900 mb-3",
    3: "text-xl font-semibold text-gray-800 mb-2",
    4: "text-lg font-semibold text-gray-800 mb-2",
    5: "text-base font-semibold text-gray-700 mb-1",
    6: "text-sm font-semibold text-gray-700 mb-1",
  };

  const className = headingClasses[level] ?? headingClasses[2];
  const Tag = `h${Math.min(level, 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return <Tag className={className}>{content}</Tag>;
};

// ---- Paragraph ----
const ParagraphBlockView: React.FC<{ block: ParagraphBlock }> = ({ block }) => {
  const { content } = block;

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <p className="text-gray-700 leading-relaxed">{renderText(content)}</p>
  );
};

// ---- Bullet List (new block type name) ----
const BulletListBlockView: React.FC<{ block: BulletListBlock }> = ({ block }) => {
  const { items } = block;

  if (!items || items.length === 0) return null;

  return (
    <ul className="list-disc list-inside space-y-1.5 text-gray-700 ml-4">
      {items.map((item, index) => (
        <li key={index} className="leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  );
};

// ---- Key-Value Table ----
const KeyValueTableBlockView: React.FC<{ block: KeyValueTableBlock }> = ({ block }) => {
  const { rows } = block;

  if (!rows || rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-4 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap w-1/3">
                {row.label}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {formatKeyValueCellValue(row.value, row.value_type)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function formatKeyValueCellValue(value: string, valueType: string): string {
  if (!value) return "—";
  if (valueType === "percent") {
    const num = parseFloat(value);
    return Number.isFinite(num) ? `${num}%` : value;
  }
  if (valueType === "currency") {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(num)) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
    }
  }
  return value;
}

// ---- Generic Table (columns/rows from prose sections) ----
const TableBlockView: React.FC<{ block: TableBlock }> = ({ block }) => {
  const { columns, rows } = block;

  if (!columns || columns.length === 0 || !rows || rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {columns.map((col, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                >
                  {row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BlockRenderer;

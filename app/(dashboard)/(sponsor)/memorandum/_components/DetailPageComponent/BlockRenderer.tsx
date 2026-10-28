"use client";

import React from "react";
import type { SectionBlock, TableBlock, HeadingBlock, ParagraphBlock, ListBlock } from "@/types/memorandum-detail";

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

type BlockItemProps = {
  block: SectionBlock;
};

const BlockItem: React.FC<BlockItemProps> = ({ block }) => {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block as HeadingBlock} />;
    case "paragraph":
      return <ParagraphBlock block={block as ParagraphBlock} />;
    case "list":
      return <ListBlock block={block as ListBlock} />;
    case "table":
      return <TableBlock block={block as TableBlock} />;
    default:
      return null;
  }
};

// Heading Block Component
const HeadingBlock: React.FC<{ block: HeadingBlock }> = ({ block }) => {
  const { level, text } = block;
  
  const headingClasses: Record<number, string> = {
    1: "text-3xl font-bold text-gray-900 mb-4",
    2: "text-2xl font-bold text-gray-900 mb-3",
    3: "text-xl font-semibold text-gray-800 mb-2",
    4: "text-lg font-semibold text-gray-800 mb-2",
    5: "text-base font-semibold text-gray-700 mb-1",
    6: "text-sm font-semibold text-gray-700 mb-1",
  };

  const className = headingClasses[level] || headingClasses[2];

  const Tag = `h${Math.min(level, 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return <Tag className={className}>{text}</Tag>;
};

// Paragraph Block Component
const ParagraphBlock: React.FC<{ block: ParagraphBlock }> = ({ block }) => {
  const { text } = block;
  
  // Check if text contains bold markdown (**text**)
  const renderText = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <p className="text-gray-700 leading-relaxed">
      {renderText(text)}
    </p>
  );
};

// List Block Component
const ListBlock: React.FC<{ block: ListBlock }> = ({ block }) => {
  const { items } = block;

  if (!items || items.length === 0) {
    return null;
  }

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

// Table Block Component
const TableBlock: React.FC<{ block: TableBlock }> = ({ block }) => {
  const { headers, rows } = block;

  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
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

export default BlockRenderer;

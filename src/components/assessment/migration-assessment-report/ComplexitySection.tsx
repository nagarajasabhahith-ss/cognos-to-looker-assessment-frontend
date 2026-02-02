"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ComplexityRow {
    complexity: string;
    feature?: string;
    [key: string]: string | number | undefined;
}

interface ComplexitySectionProps {
    title: string;
    featureAreaLabel: string;
    items: ComplexityRow[];
    /** Column headers (uppercase labels) and their data keys. Last one gets rounded-br on last row. */
    columns: { header: string; key: string; alignRight?: boolean }[];
}

function formatComplexity(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function ComplexitySection({ title, featureAreaLabel, items, columns }: ComplexitySectionProps) {
    if (!items.length) return null;

    return (
        <div>
            <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                {title}
            </h2>
            <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                <div className="rounded-lg overflow-hidden">
                    <Table className="text-lg">
                        <TableHeader>
                            <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                {columns.map((col, i) => (
                                    <TableHead
                                        key={col.key}
                                        className={`text-white font-bold py-4 px-5 h-auto ${col.alignRight ? "text-right" : ""} ${i === columns.length - 1 ? "rounded-tr-lg" : ""}`}
                                    >
                                        {col.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, idx) => {
                                const isLast = idx === items.length - 1;
                                return (
                                    <TableRow
                                        key={item.complexity}
                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                    >
                                        <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{featureAreaLabel}</TableCell>
                                        <TableCell className="font-medium text-gray-900 py-4 px-5">
                                            {formatComplexity(item.complexity)}
                                        </TableCell>
                                        <TableCell className="text-gray-900 py-4 px-5">{item.feature ?? "—"}</TableCell>
                                        {columns.map((col, i) => (
                                            <TableCell
                                                key={col.key}
                                                className={`text-gray-900 py-4 px-5 ${col.alignRight ? "text-right" : ""} ${isLast && i === columns.length - 1 ? "rounded-br-lg" : ""}`}
                                            >
                                                {item[col.key] ?? "—"}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

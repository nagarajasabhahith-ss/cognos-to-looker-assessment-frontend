"use client";

import { Info } from "lucide-react";
import type { ComplexAnalysis } from "@/lib/api";
import { ComplexitySection, type ComplexityRow } from "./ComplexitySection";

interface ComplexityTabContentProps {
    complex_analysis: ComplexAnalysis | null | undefined;
}

const SECTION_CONFIG: Array<{
    key: keyof ComplexAnalysis;
    title: string;
    featureAreaLabel: string;
    columns: { header: string; key: string; alignRight?: boolean }[];
}> = [
    { key: "visualization", title: "Visualization", featureAreaLabel: "Visualization", columns: [
        { header: "VISUALIZATIONS", key: "visualization_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "dashboard", title: "Dashboard", featureAreaLabel: "Dashboard", columns: [
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
    ]},
    { key: "report", title: "Report", featureAreaLabel: "Report", columns: [
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "calculated_field", title: "Calculated Field", featureAreaLabel: "Calculated Field", columns: [
        { header: "CALCULATED FIELDS", key: "calculated_field_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "filter", title: "Filter", featureAreaLabel: "Filter", columns: [
        { header: "FILTERS", key: "filter_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "measure", title: "Measure", featureAreaLabel: "Measure", columns: [
        { header: "MEASURES", key: "measure_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "dimension", title: "Dimension", featureAreaLabel: "Dimension", columns: [
        { header: "DIMENSIONS", key: "dimension_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "parameter", title: "Parameter", featureAreaLabel: "Parameter", columns: [
        { header: "PARAMETERS", key: "parameter_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "sort", title: "Sort", featureAreaLabel: "Sort", columns: [
        { header: "SORTS", key: "sort_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "prompt", title: "Prompt", featureAreaLabel: "Prompt", columns: [
        { header: "PROMPTS", key: "prompt_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
    { key: "query", title: "Query", featureAreaLabel: "Query", columns: [
        { header: "QUERIES", key: "query_count", alignRight: true },
        { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count", alignRight: true },
        { header: "REPORTS AFFECTED", key: "reports_containing_count", alignRight: true },
    ]},
];

export function ComplexityTabContent({ complex_analysis }: ComplexityTabContentProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                    <span className="border-b-4 border-[var(--royal-gold)]">Complexity</span> Analysis
                </h2>
                <div className="bg-[var(--light-cream)] border-l-4 border-[var(--royal-gold)] rounded-lg shadow-sm text-[1.12em] mb-[35px] py-[24px] px-[28px] flex items-start gap-3">
                    <Info className="h-5 w-5 text-[var(--deep-green)] mt-0.5 flex-shrink-0" />
                    <p className="text-[#333333]">
                        Information about identified numbers of elements across various categories to show the overall plan of the data migration.
                    </p>
                </div>
            </div>

            {SECTION_CONFIG.map(({ key, title, featureAreaLabel, columns }) => {
                const items = complex_analysis?.[key];
                if (!Array.isArray(items) || items.length === 0) return null;
                return (
                    <ComplexitySection
                        key={key}
                        title={title}
                        featureAreaLabel={featureAreaLabel}
                        items={items as unknown as ComplexityRow[]}
                        columns={columns}
                    />
                );
            })}
        </div>
    );
}

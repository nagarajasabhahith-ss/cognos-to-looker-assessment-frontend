import type { ExtractedObject, ObjectRelationship } from "@/lib/api";
import type { UsageStatsRow } from "./types";
import { visualizationMapping } from "./constants";

export const getVisualizationComplexity = (type: string): string => {
    const normalized = type.toLowerCase().trim();
    if (visualizationMapping[normalized]) return visualizationMapping[normalized].complexity;
    for (const [key, value] of Object.entries(visualizationMapping)) {
        if (normalized.includes(key) || key.includes(normalized)) return value.complexity;
    }
    return "Unknown";
};

export const getComplexityBadgeVariant = (complexity: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (complexity.toLowerCase()) {
        case "low":
            return "default";
        case "medium":
            return "secondary";
        case "high":
            return "outline";
        case "critical":
            return "destructive";
        default:
            return "outline";
    }
};

export function calculateOverallComplexity(objects: ExtractedObject[], relationships: ObjectRelationship[]): string {
    const objectsMap = new Map<string, ExtractedObject>();
    objects.forEach(obj => objectsMap.set(obj.id, obj));

    const relationshipsBySource = new Map<string, ObjectRelationship[]>();
    relationships.forEach(rel => {
        if (!relationshipsBySource.has(rel.source_object_id)) {
            relationshipsBySource.set(rel.source_object_id, []);
        }
        relationshipsBySource.get(rel.source_object_id)!.push(rel);
    });

    const dashboards = objects.filter(obj => obj.object_type === "dashboard");
    let highComplexityCount = 0;
    let criticalComplexityCount = 0;

    dashboards.forEach(dashboard => {
        const outgoingRels = relationshipsBySource.get(dashboard.id) || [];
        const tabs = outgoingRels.filter(rel => {
            if (rel.relationship_type === "contains") {
                const targetObj = objectsMap.get(rel.target_object_id);
                return targetObj?.object_type === "tab";
            }
            return false;
        });
        const tabCount = tabs.length;
        const tabIds = tabs.map(rel => rel.target_object_id);

        let visualizationCount = outgoingRels.filter(rel => {
            if (rel.relationship_type === "contains") {
                const targetObj = objectsMap.get(rel.target_object_id);
                return targetObj?.object_type === "visualization";
            }
            return false;
        }).length;

        tabIds.forEach(tabId => {
            const tabRels = relationshipsBySource.get(tabId) || [];
            visualizationCount += tabRels.filter(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "visualization";
                }
                return false;
            }).length;
        });

        if (tabCount >= 10 || visualizationCount >= 10) {
            criticalComplexityCount++;
        } else if (tabCount >= 5 || visualizationCount >= 5) {
            highComplexityCount++;
        }
    });

    if (criticalComplexityCount > 0) return "Critical";
    if (highComplexityCount > dashboards.length * 0.3) return "High";
    if (highComplexityCount > 0) return "Medium";
    return "Low";
}

/** Get value from usage_stats row (keys may be UPPER_SNAKE_CASE or camelCase). */
export function usVal(row: UsageStatsRow, ...keys: string[]): string | number | undefined {
    for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null) return v as string | number;
        const upper = k.replace(/([A-Z])/g, "_$1").replace(/^_/, "").toUpperCase();
        const v2 = row[upper];
        if (v2 !== undefined && v2 !== null) return v2 as string | number;
    }
    return undefined;
}

/** Build page numbers with ellipsis for pagination (e.g. 1 ... 8 9 10 11 ... 20). */
export function buildPageNumbers(total: number, currentPage: number, show = 2): (number | "ellipsis")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | "ellipsis")[];
    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > show + 2) pages.push("ellipsis");
    for (let p = Math.max(2, currentPage - show); p <= Math.min(total - 1, currentPage + show); p++) {
        pages.push(p);
    }
    if (currentPage < total - show - 1) pages.push("ellipsis");
    if (total > 1) pages.push(total);
    return pages;
}

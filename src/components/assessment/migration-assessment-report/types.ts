import type {
    ExtractedObject,
    ObjectRelationship,
    ComplexAnalysis,
    Summary,
    ChallengeItem,
    AppendixItem,
} from "@/lib/api";

/** Row from usage_stats JSON; keys may be UPPER_SNAKE_CASE (e.g. TARGET_NAME, VIEWS_LAST_60_DAYS). */
export type UsageStatsRow = Record<string, unknown>;

export interface MigrationAssessmentReportProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
    complex_analysis?: ComplexAnalysis | null;
    summary?: Summary | null;
    challenges?: { visualization: ChallengeItem[] } | null;
    appendix?: { dashboards: AppendixItem[]; reports: AppendixItem[] } | null;
    /** Optional usage stats from usage_stats.json (usage_stats, content_creation, user_stats, performance, quick_wins, pilot_recommendations). */
    usage_stats?: Record<string, unknown> | null;
    assessmentName?: string;
    biTool?: string;
    createdAt?: string;
}

export type PageNumber = number | "ellipsis";

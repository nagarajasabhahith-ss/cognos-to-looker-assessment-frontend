import axios from "axios";

// Default to localhost:8000 if not specified
// We expect NEXT_PUBLIC_API_URL to be the root (e.g. http://localhost:8000)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = `${BASE_URL}/api`;

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Pydantic/Backend types
export interface User {
    id: string;
    email: string;
    name?: string;
    is_guest: boolean;
    created_at?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

// Assessment Types
export enum AssessmentStatus {
    CREATED = "created",
    UPLOADING = "uploading",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
}

export interface Assessment {
    id: string;
    name: string;
    bi_tool: string;
    status: AssessmentStatus;
    user_id: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
    files_count: number;
    objects_count: number;
    relationships_count: number;
}

export interface AssessmentListResponse {
    assessments: Assessment[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface AssessmentCreate {
    name: string;
    bi_tool: string;
}

// File Types
export interface UploadedFile {
    id: string;
    filename: string;
    file_path: string;
    file_type: string;
    file_size: number;
    parse_status: string;
    uploaded_at: string;
}

export interface FileUploadError {
    filename: string;
    error: string;
}

// Results Types
export interface ExtractedObject {
    id: string;
    assessment_id: string;
    file_id: string;
    object_type: string;
    name: string;
    path?: string;
    properties: Record<string, unknown>;
    created_at: string;
    // Complexity fields
    complexity_score_looker?: number | null;
    complexity_level_looker?: string | null;
    complexity_score_custom?: number | null;
    complexity_level_custom?: string | null;
    hierarchy_depth?: number | null;
    hierarchy_level?: number | null;
    hierarchy_path?: string | null;
}

export interface ExtractedObjectDetail extends ExtractedObject {
    raw_xml?: string;
}

export interface ObjectRelationship {
    id: string;
    assessment_id: string;
    source_object_id: string;
    target_object_id: string;
    relationship_type: string;
    details?: Record<string, unknown>;
    created_at: string;
}

export interface ParseError {
    id: string;
    file_id: string;
    filename: string;
    error_type: string;
    error_message: string;
    location?: string;
    context?: string;
    created_at: string;
}

export interface AssessmentStats {
    total_objects: number;
    total_relationships: number;
    total_files: number;
    total_errors: number;
    objects_by_type: Record<string, number>;
    relationships_by_type: Record<string, number>;
    parse_success_rate: number;
}

// Report types (all data from API, no local computation)
export interface VisualizationBreakdownItem {
    visualization: string;
    count: number;
    complexity: string;
    dashboards_containing_count: number;
    reports_containing_count: number;
    /** Count of distinct queries that contain/use this visualization type */
    queries_using_count?: number;
    /** Included in API; not displayed in table */
    feasibility?: string | null;
    description?: string | null;
    recommended?: string | null;
}

export interface VisualizationComplexityStats {
    low: number;
    medium: number;
    high: number;
    critical: number;
}

export interface VisualizationDetails {
    total_visualization: number;
    stats?: VisualizationComplexityStats;
    breakdown: VisualizationBreakdownItem[];
}

export interface DashboardBreakdownItem {
    dashboard_id: string;
    dashboard_name: string;
    /** Derived from visualizations_by_complexity: worst level present (Critical > High > Medium > Low) */
    complexity?: string;
    total_visualizations: number;
    /** Per-dashboard counts by complexity (low, medium, high, critical) */
    visualizations_by_complexity?: VisualizationComplexityStats;
    total_tabs: number;
    total_measures: number;
    total_dimensions: number;
    total_calculated_fields: number;
    total_data_modules: number;
    total_packages: number;
    total_data_sources: number;
}

export interface DashboardsBreakdown {
    total_dashboards: number;
    /** Count of dashboards by derived complexity (low, medium, high, critical). */
    stats?: VisualizationComplexityStats;
    dashboards: DashboardBreakdownItem[];
}

export interface ReportBreakdownItem {
    report_id: string;
    report_name: string;
    report_type: string;
    /** Derived from visualizations_by_complexity: worst level present (Critical > High > Medium > Low). Not affected by calculated fields. */
    complexity?: string;
    total_visualizations: number;
    /** Per-report counts by complexity (low, medium, high, critical) */
    visualizations_by_complexity?: VisualizationComplexityStats;
    /** Calculated fields in this report by complexity (informational only; does not affect report complexity) */
    calculated_fields_by_complexity?: VisualizationComplexityStats;
    total_pages: number;
    total_data_modules: number;
    total_packages: number;
    total_data_sources: number;
    total_tables: number;
    total_columns: number;
    total_filters: number;
    total_parameters: number;
    total_sorts: number;
    total_prompts: number;
    total_calculated_fields: number;
    total_measures: number;
    total_dimensions: number;
}

export interface ReportsBreakdown {
    total_reports: number;
    /** Count of reports by derived complexity (low, medium, high, critical). */
    stats?: VisualizationComplexityStats;
    reports: ReportBreakdownItem[];
}

export interface PackageBreakdownItem {
    package_id: string;
    package_name: string;
    /** Derived from data_modules count: > 2 → Medium, else Low */
    complexity?: string;
    total_data_modules: number;
    main_data_modules?: number;
    data_modules_by_type: Record<string, number>;
    total_tables: number;
    total_columns: number;
    /** Distinct dashboards that use this package (BFS from roots via containment, usage, has_column reverse). */
    dashboards_using_count?: number;
    /** Distinct reports that use this package. */
    reports_using_count?: number;
}

export interface PackagesBreakdown {
    total_packages: number;
    stats?: VisualizationComplexityStats;
    packages: PackageBreakdownItem[];
}

export interface DataSourceConnectionBreakdownItem {
    connection_id: string;
    connection_name: string;
    object_type: string;
    /** All data source connections: Medium */
    complexity?: string;
    dashboards_using_count: number;
    reports_using_count: number;
    identifier?: string;
    connection_type?: string;
    cognos_class?: string;
    connection_string_preview?: string;
}

export interface DataSourceConnectionsBreakdown {
    total_data_sources: number;
    total_data_source_connections: number;
    total_unique_connections: number;
    total_data_modules: number;
    total_packages: number;
    stats?: VisualizationComplexityStats;
    connections: DataSourceConnectionBreakdownItem[];
}

export interface CalculatedFieldBreakdownItem {
    calculated_field_id: string;
    name: string;
    /** Derived from calculation_type and expression: Low | Medium | Critical */
    complexity?: string;
    expression?: string;
    calculation_type?: string;
    cognosClass?: string;
    /** Count of dashboards containing this calculated field */
    dashboards_containing_count?: number;
    /** Count of reports containing this calculated field */
    reports_containing_count?: number;
    [key: string]: unknown;
}

export interface CalculatedFieldsBreakdown {
    total_calculated_fields: number;
    calculated_fields: CalculatedFieldBreakdownItem[];
}

export interface FilterBreakdownItem {
    filter_id: string;
    name: string;
    /** Derived from is_complex: true → Medium, else Low */
    complexity?: string;
    expression?: string;
    filter_type?: string;  // detail, summary
    filter_scope?: string;  // query_level, report_level, data_module, data_set
    filter_style?: string;  // expression, definition
    is_simple?: boolean;
    is_complex?: boolean;
    ref_data_item?: string;
    filter_definition_summary?: string;
    postAutoAggregation?: string;
    parent_id?: string;
    parent_name?: string;
    associated_container_type?: string;  // report, query, data_module
    /** Count of dashboards containing this filter */
    dashboards_containing_count?: number;
    /** Count of reports containing this filter */
    reports_containing_count?: number;
    referenced_columns?: string[];
    parameter_references?: string[];
    cognosClass?: string;
    [key: string]: unknown;
}

export interface FiltersBreakdown {
    total_filters: number;
    stats?: VisualizationComplexityStats;
    filters: FilterBreakdownItem[];
}

export interface ParameterBreakdownItem {
    parameter_id: string;
    name: string;
    /** All parameters: Medium */
    complexity?: string;
    parameter_type?: string;
    variable_type?: string;
    cognosClass?: string;
    dashboards_containing_count?: number;
    reports_containing_count?: number;
    [key: string]: unknown;
}

export interface ParametersBreakdown {
    total_parameters: number;
    stats?: VisualizationComplexityStats;
    parameters: ParameterBreakdownItem[];
    by_complexity?: Record<string, ParameterByComplexityItem>;
}

export interface SortBreakdownItem {
    sort_id: string;
    name: string;
    /** All sorts: Low */
    complexity?: string;
    direction?: string;
    sorted_column?: string;
    sort_items?: { column?: string; direction?: string }[];
    cognosClass?: string;
    dashboards_containing_count?: number;
    reports_containing_count?: number;
    [key: string]: unknown;
}

export interface SortsBreakdown {
    total_sorts: number;
    stats?: VisualizationComplexityStats;
    sorts: SortBreakdownItem[];
    by_complexity?: Record<string, SortByComplexityItem>;
}

export interface PromptBreakdownItem {
    prompt_id: string;
    name: string;
    /** All prompts: Medium */
    complexity?: string;
    prompt_type?: string;
    value?: string;
    cognosClass?: string;
    dashboards_containing_count?: number;
    reports_containing_count?: number;
    [key: string]: unknown;
}

export interface PromptsBreakdown {
    total_prompts: number;
    stats?: VisualizationComplexityStats;
    prompts: PromptBreakdownItem[];
    by_complexity?: Record<string, PromptByComplexityItem>;
}

export interface DataModuleBreakdownItem {
    data_module_id: string;
    name: string;
    /** All data modules: Medium */
    complexity?: string;
    dashboards_using_count: number;
    reports_using_count: number;
    is_main_module?: boolean;
    storeID?: string;
    cognosClass?: string;
    table_count?: number;
    column_count?: number;
    calculated_field_count?: number;
    filter_count?: number;
    creationTime?: string;
    modificationTime?: string;
    owner?: string;
    displaySequence?: number;
    hidden?: boolean;
    tenantID?: string;
    [key: string]: unknown;
}

export interface DataModulesBreakdown {
    total_data_modules: number;
    total_main_data_modules: number;
    total_unique_modules: number;
    stats?: VisualizationComplexityStats;
    data_modules: DataModuleBreakdownItem[];
    main_data_modules: DataModuleBreakdownItem[];
}

export interface QueryBreakdownItem {
    query_id: string;
    name: string;
    /** Derived from is_complex: true → Medium, else Low */
    complexity?: string;
    source_type?: string;
    is_simple?: boolean;
    is_complex?: boolean;
    report_id?: string;
    report_name?: string;
    cognos_class?: string;
    sql_content?: string;
    dashboards_containing_count?: number;
    reports_containing_count?: number;
    [key: string]: unknown;
}

export interface QueriesBreakdown {
    total_queries: number;
    stats?: VisualizationComplexityStats;
    queries: QueryBreakdownItem[];
    by_complexity?: Record<string, QueryByComplexityItem>;
}

export interface MeasureBreakdownItem {
    measure_id: string;
    name: string;
    /** Derived from expression (same rules as calculated fields: Low | Medium | Critical) */
    complexity?: string;
    aggregation?: string;
    is_simple?: boolean;
    is_complex?: boolean;
    parent_module_id?: string;
    parent_module_name?: string;
    cognos_class?: string;
    datatype?: string;
    usage?: string;
    expression?: string;
    /** 0 or 1: distinct dashboards containing this measure (from containment/relationship/file fallback) */
    dashboards_containing_count?: number;
    /** 0 or 1: distinct reports containing this measure */
    reports_containing_count?: number;
    [key: string]: unknown;
}

export interface MeasuresBreakdown {
    total_measures: number;
    measures: MeasureBreakdownItem[];
}

export interface DimensionBreakdownItem {
    dimension_id: string;
    name: string;
    /** Derived from expression (same rules as measures: Low | Medium | Critical) */
    complexity?: string;
    usage?: string;
    is_simple?: boolean;
    is_complex?: boolean;
    parent_module_id?: string;
    parent_module_name?: string;
    cognos_class?: string;
    datatype?: string;
    expression?: string;
    /** 0 or 1: distinct dashboards containing this dimension (from containment/relationship/file fallback) */
    dashboards_containing_count?: number;
    /** 0 or 1: distinct reports containing this dimension */
    reports_containing_count?: number;
    [key: string]: unknown;
}

export interface DimensionsBreakdown {
    total_dimensions: number;
    dimensions: DimensionBreakdownItem[];
}

/** Per-complexity: visualization count and dashboards/reports containing that complexity */
export interface VisualizationByComplexityItem {
    complexity: string;
    visualization_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

/** Per-complexity: distinct dashboards containing that complexity */
export interface DashboardByComplexityItem {
    complexity: string;
    dashboards_containing_count: number;
}

/** Per-complexity: distinct reports containing that complexity */
export interface ReportByComplexityItem {
    complexity: string;
    reports_containing_count: number;
}

/** Per-complexity: calculated field count and distinct dashboards/reports containing that complexity */
export interface CalculatedFieldByComplexityItem {
    complexity: string;
    calculated_field_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

/** Per-complexity: filter count and distinct dashboards/reports containing that complexity */
export interface FilterByComplexityItem {
    complexity: string;
    filter_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

/** Per-complexity: measure count and dashboards/reports containing */
export interface MeasureByComplexityItem {
    complexity: string;
    measure_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

/** Per-complexity: dimension count and dashboards/reports containing */
export interface DimensionByComplexityItem {
    complexity: string;
    dimension_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

/** Per-complexity: parameter count and dashboards/reports containing */
export interface ParameterByComplexityItem {
    complexity: string;
    parameter_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

/** Per-complexity: sort count and dashboards/reports containing */
export interface SortByComplexityItem {
    complexity: string;
    sort_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

/** Per-complexity: prompt count and dashboards/reports containing */
export interface PromptByComplexityItem {
    complexity: string;
    prompt_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

/** Per-complexity: query count and dashboards/reports containing */
export interface QueryByComplexityItem {
    complexity: string;
    query_count: number;
    dashboards_containing_count: number;
    reports_containing_count: number;
}

export interface ComplexAnalysis {
    visualization: VisualizationByComplexityItem[];
    dashboard?: DashboardByComplexityItem[];
    report?: ReportByComplexityItem[];
    calculated_field?: CalculatedFieldByComplexityItem[];
    filter?: FilterByComplexityItem[];
    measure?: MeasureByComplexityItem[];
    dimension?: DimensionByComplexityItem[];
    parameter?: ParameterByComplexityItem[];
    sort?: SortByComplexityItem[];
    prompt?: PromptByComplexityItem[];
    query?: QueryByComplexityItem[];
}

/** Key finding per feature area from report summary (representative complexity, count, usage in dashboards/reports). */
export interface KeyFinding {
    feature_area: string;
    complexity: string;
    count: number;
    dashboards_summary: string;
    reports_summary: string;
    dashboards_percent: number;
    reports_percent: number;
}

/** Per-complexity level: counts for Visualization, Dashboard, Report. */
export interface HighLevelComplexityOverviewItem {
    complexity: string;
    visualization_count: number;
    dashboard_count: number;
    report_count: number;
}

/** Total count for an asset type (Dashboard, Report, Visualization, etc.). */
export interface InventoryItem {
    asset_type: string;
    count: number;
}

/** Per-visualization challenge: visualization name, type, complexity, description, recommended, container name. */
export interface ChallengeItem {
    visualization: string;
    visualization_type: string;
    complexity: string;
    description?: string | null;
    recommended?: string | null;
    dashboard_or_report_name?: string | null;
}

export interface Summary {
    key_findings: KeyFinding[];
    high_level_complexity_overview?: HighLevelComplexityOverviewItem[];
    inventory?: InventoryItem[];
}

export interface AssessmentReport {
    assessment_id: string;
    sections: {
        visualization_details: VisualizationDetails;
        dashboards_breakdown: DashboardsBreakdown;
        reports_breakdown: ReportsBreakdown;
        packages_breakdown: PackagesBreakdown;
        data_source_connections_breakdown: DataSourceConnectionsBreakdown;
        calculated_fields_breakdown: CalculatedFieldsBreakdown;
        filters_breakdown: FiltersBreakdown;
        parameters_breakdown: ParametersBreakdown;
        sorts_breakdown: SortsBreakdown;
        prompts_breakdown: PromptsBreakdown;
        data_modules_breakdown: DataModulesBreakdown;
        queries_breakdown: QueriesBreakdown;
        measures_breakdown: MeasuresBreakdown;
        dimensions_breakdown: DimensionsBreakdown;
    };
    complex_analysis?: ComplexAnalysis;
    summary?: Summary;
    /** Keyed by category; `visualization` contains per-visualization challenge items. */
    challenges?: { visualization: ChallengeItem[] } | null;
    /** Appendix: dashboards and reports with name, package(s), data module(s), owner. */
    appendix?: { dashboards: AppendixItem[]; reports: AppendixItem[] } | null;
    /** Optional usage stats from usage_stats.json (usage_stats, content_creation, user_stats, performance, quick_wins, pilot_recommendations). */
    usage_stats?: Record<string, unknown> | null;
}

/** Appendix row: name, package(s), data module(s), owner (for dashboard or report). */
export interface AppendixItem {
    name: string;
    package: string[];
    data_module: string[];
    owner: string;
}


// Check backend availability
export const checkHealth = async () => {
    try {
        // We use fetch here to avoid the /api prefix of the axios instance
        // and check the root health endpoint
        const response = await fetch(`${BASE_URL}/health`);
        return response.status === 200;
    } catch {
        return false;
    }
};

// API Client Wrapper
export const assessmentApi = {
    // Stats
    getStats: (id: string) => api.get<AssessmentStats>(`/assessments/${id}/stats`),

    // Objects
    getObjects: (id: string, params?: { type?: string; search?: string; skip?: number; limit?: number }) =>
        api.get<ExtractedObject[]>(`/assessments/${id}/objects`, { params }),

    getObject: (assessmentId: string, objectId: string) =>
        api.get<ExtractedObjectDetail>(`/assessments/${assessmentId}/objects/${objectId}`),

    // Relationships
    getRelationships: (id: string, params?: { type?: string; limit?: number }) =>
        api.get<ObjectRelationship[]>(`/assessments/${id}/relationships`, { params }),

    // Errors
    getErrors: (id: string, params?: { type?: string; skip?: number; limit?: number }) =>
        api.get<ParseError[]>(`/assessments/${id}/errors`, { params }),

    // Report (visualization summary, etc. – all from API)
    getReport: (id: string) => api.get<AssessmentReport>(`/assessments/${id}/report`),
};

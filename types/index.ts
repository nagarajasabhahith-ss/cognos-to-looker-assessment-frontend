// API Types
export interface User {
    id: string;
    email: string;
    name?: string;
    is_guest: boolean;
}

export enum AssessmentStatus {
    CREATED = "created",
    PROCESSING = "processing",
    COMPLETED = "completed",
    PARTIAL = "partial",
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
}

export enum FileType {
    ZIP = "zip",
    XML = "xml",
    JSON = "json",
}

export enum ParseStatus {
    PENDING = "pending",
    PARSING = "parsing",
    COMPLETED = "completed",
    PARTIAL = "partial",
    FAILED = "failed",
}

export interface UploadedFile {
    id: string;
    assessment_id: string;
    filename: string;
    file_path: string;
    file_type: FileType;
    file_size: number;
    parse_status: ParseStatus;
    uploaded_at: string;
    parsed_at?: string;
}

export interface ExtractedObject {
    id: string;
    assessment_id: string;
    file_id: string;
    object_type: string;
    name: string;
    path?: string;
    properties: Record<string, any>;
    raw_xml?: string;
    created_at: string;
}

export interface ObjectRelationship {
    id: string;
    assessment_id: string;
    source_object_id: string;
    target_object_id: string;
    relationship_type: string;
    details?: Record<string, any>;
    created_at: string;
}

export interface ParseError {
    id: string;
    file_id: string;
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
    objects_by_type: Record<string, number>;
    parse_success_rate: number;
}

// API Response types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

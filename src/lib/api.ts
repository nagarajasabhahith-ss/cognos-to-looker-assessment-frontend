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
    properties: Record<string, any>;
    created_at: string;
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
    details?: Record<string, any>;
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
};

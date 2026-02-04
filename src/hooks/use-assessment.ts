import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api, Assessment, AssessmentStatus, UploadedFile, AssessmentStats, AssessmentReport, assessmentApi, ExtractedObject, ObjectRelationship } from "@/lib/api";

export function useAssessment(id: string) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [stats, setStats] = useState<AssessmentStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAssessment = useCallback(async () => {
        try {
            const [assessmentRes, filesRes] = await Promise.all([
                api.get<Assessment>(`/assessments/${id}`),
                api.get<UploadedFile[]>(`/assessments/${id}/files`)
            ]);
            setAssessment(assessmentRes.data);
            setFiles(filesRes.data);

            // Fetch stats if assessment is completed
            if (assessmentRes.data.status === AssessmentStatus.COMPLETED) {
                try {
                    const statsRes = await assessmentApi.getStats(id);
                    setStats(statsRes.data);
                } catch (error) {
                    console.error("Failed to fetch stats", error);
                }
            }
        } catch (error) {
            console.error("Failed to fetch assessment data", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/");
        }
    }, [isAuthLoading, user, router]);

    useEffect(() => {
        if (user && id) {
            fetchAssessment();
        }
    }, [user, id, fetchAssessment]);

    const refresh = useCallback(() => {
        setIsRefreshing(true);
        fetchAssessment();
    }, [fetchAssessment]);

    const runAnalysis = useCallback(async () => {
        if (!assessment) return false;
        try {
            await api.post(`/assessments/${assessment.id}/run`);
            setTimeout(() => fetchAssessment(), 2000);
            return true;
        } catch (error) {
            console.error("Failed to run analysis", error);
            return false;
        }
    }, [assessment, fetchAssessment]);

    return {
        assessment,
        files,
        stats,
        isLoading,
        isRefreshing,
        refresh,
        runAnalysis,
        hasResults: assessment?.status === AssessmentStatus.COMPLETED,
    };
}

export function useAssessmentObjects(id: string, enabled: boolean = true) {
    const [objects, setObjects] = useState<ExtractedObject[]>([]);
    const [relationships, setRelationships] = useState<ObjectRelationship[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchObjects = useCallback(async (): Promise<{ objects: ExtractedObject[]; relationships: ObjectRelationship[] } | null> => {
        if (!enabled) return null;

        setIsLoading(true);
        try {
            // Fetch all objects using pagination
            const allObjects: ExtractedObject[] = [];
            let skip = 0;
            const limit = 1000;
            let hasMore = true;

            while (hasMore) {
                const objectsRes = await assessmentApi.getObjects(id, { skip, limit });
                const fetchedObjects = objectsRes.data;
                allObjects.push(...fetchedObjects);

                if (fetchedObjects.length < limit) {
                    hasMore = false;
                } else {
                    skip += limit;
                }
            }

            setObjects(allObjects);

            let allRelationships: ObjectRelationship[] = [];
            try {
                const relationshipsRes = await assessmentApi.getRelationships(id, { limit: 5000 });
                allRelationships = relationshipsRes.data;
                setRelationships(allRelationships);
            } catch (error) {
                console.error("Failed to fetch relationships", error);
            }
            return { objects: allObjects, relationships: allRelationships };
        } catch (error) {
            console.error("Failed to fetch objects", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [id, enabled]);

    useEffect(() => {
        if (enabled) {
            fetchObjects();
        }
    }, [enabled, fetchObjects]);

    return {
        objects,
        relationships,
        isLoading,
        refetch: fetchObjects,
    };
}

export function useAssessmentReport(id: string, enabled: boolean = true) {
    const [report, setReport] = useState<AssessmentReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = useCallback(async (): Promise<AssessmentReport | null> => {
        if (!enabled) return null;

        setError(null);
        setIsLoading(true);
        try {
            const res = await assessmentApi.getReport(id);
            setReport(res.data);
            return res.data;
        } catch (err: unknown) {
            const axiosErr = err as { code?: string; message?: string; response?: { status?: number }; config?: { baseURL?: string } };
            console.error("Failed to fetch report", err);
            if (axiosErr?.code === "ERR_NETWORK" || axiosErr?.message === "Network Error") {
                const base = axiosErr?.config?.baseURL ?? "http://localhost:8000/api";
                setError(`Cannot reach the API at ${base}. Ensure the backend is running (e.g. \`make run\` or \`uvicorn app.main:app --reload\`).`);
            } else if (axiosErr?.response?.status === 401) {
                setError("You are not signed in. Please sign in and try again.");
            } else if (axiosErr?.response?.status === 404) {
                setError("Report or assessment not found.");
            } else {
                setError(axiosErr?.message ?? "Failed to load report.");
            }
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [id, enabled]);

    useEffect(() => {
        if (enabled) {
            fetchReport();
        }
    }, [enabled, fetchReport]);

    return {
        report,
        isLoading,
        error,
        refetch: fetchReport,
    };
}

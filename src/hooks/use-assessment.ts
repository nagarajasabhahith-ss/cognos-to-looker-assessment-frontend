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

    const fetchObjects = useCallback(async () => {
        if (!enabled) return;
        
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

            // Fetch relationships
            try {
                const relationshipsRes = await assessmentApi.getRelationships(id, { limit: 5000 });
                setRelationships(relationshipsRes.data);
            } catch (error) {
                console.error("Failed to fetch relationships", error);
            }
        } catch (error) {
            console.error("Failed to fetch objects", error);
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

    const fetchReport = useCallback(async () => {
        if (!enabled) return;

        setIsLoading(true);
        try {
            const res = await assessmentApi.getReport(id);
            setReport(res.data);
        } catch (error) {
            console.error("Failed to fetch report", error);
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
        refetch: fetchReport,
    };
}

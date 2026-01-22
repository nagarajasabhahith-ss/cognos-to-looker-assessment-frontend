"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    assessmentId: string;
    onUploadComplete: () => void;
}

interface UploadStatus {
    status: "idle" | "uploading" | "success" | "error";
    progress: number;
    message?: string;
}

export function FileUpload({ assessmentId, onUploadComplete }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: "idle", progress: 0 });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setUploadStatus({ status: "idle", progress: 0 });
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip'],
            'text/xml': ['.xml'],
            'application/json': ['.json']
        }
    });

    const handleUpload = async () => {
        if (!file) return;

        setUploadStatus({ status: "uploading", progress: 0 });

        const formData = new FormData();
        formData.append("files", file);

        try {
            await api.post(`/assessments/${assessmentId}/files`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
                    setUploadStatus(prev => ({ ...prev, progress: percentCompleted }));
                },
            });

            setUploadStatus({ status: "success", progress: 100, message: "File uploaded successfully" });
            setFile(null); // Clear file after success
            onUploadComplete();
        } catch (error) {
            console.error("Upload failed", error);
            setUploadStatus({ status: "error", progress: 0, message: "Failed to upload file. Please try again." });
        }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setUploadStatus({ status: "idle", progress: 0 });
    };

    return (
        <div className="w-full space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[200px]",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                    uploadStatus.status === "uploading" && "pointer-events-none opacity-50"
                )}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <File className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        {uploadStatus.status !== "uploading" && uploadStatus.status !== "success" && (
                            <Button variant="ghost" size="sm" onClick={removeFile} className="mt-2 text-destructive hover:text-destructive">
                                <X className="mr-2 h-4 w-4" /> Remove
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-medium">Click to upload or drag and drop</p>
                            <p className="text-sm text-muted-foreground">ZIP, XML, or JSON files (max 100MB)</p>
                        </div>
                    </div>
                )}
            </div>

            {uploadStatus.status === "uploading" && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadStatus.progress}%</span>
                    </div>
                    <Progress value={uploadStatus.progress} />
                </div>
            )}

            {uploadStatus.status === "error" && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadStatus.message}</span>
                </div>
            )}

            {uploadStatus.status === "success" && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{uploadStatus.message}</span>
                </div>
            )}

            {file && uploadStatus.status === "idle" && (
                <div className="flex justify-end">
                    <Button onClick={handleUpload}>Upload File</Button>
                </div>
            )}
        </div>
    )
}

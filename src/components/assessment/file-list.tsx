"use client";

import { File, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UploadedFile } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface FileListProps {
    files: UploadedFile[];
    assessmentId?: string;
    onUpdate?: () => void;
}

export function FileList({ files, assessmentId, onUpdate }: FileListProps) {
    if (!files || files.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files uploaded yet</p>
            </div>
        );
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "parsed":
            case "completed":
                return <Badge variant="default" className="bg-green-500">Parsed</Badge>;
            case "parsing":
            case "processing":
                return <Badge variant="default" className="bg-blue-500">Processing</Badge>;
            case "partial":
                return <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400">Partial</Badge>;
            case "failed":
            case "error":
                return <Badge variant="destructive">Failed</Badge>;
            case "pending":
            default:
                return <Badge variant="secondary">Pending</Badge>;
        }
    };

    return (
        <div className="rounded-md border">
            <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-3">
                    {files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                    <File className="h-5 w-5" />
                                </div>
                                <div className="grid gap-1 flex-1 min-w-0">
                                    <span className="text-sm font-medium leading-none truncate">
                                        {file.filename}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formatFileSize(file.file_size || 0)}</span>
                                        <span>•</span>
                                        <span>{file.file_type || "Unknown"}</span>
                                        <span>•</span>
                                        <span>
                                            {new Date(file.uploaded_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {getStatusBadge(file.parse_status)}
                                {/* Delete not implemented in MVP API for individual files yet */}
                                {/* <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button> */}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

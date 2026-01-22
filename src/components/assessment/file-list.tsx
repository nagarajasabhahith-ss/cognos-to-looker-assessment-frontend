"use client";

import { File, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Temporary mock type until we have full file support in API schema
interface UploadedFile {
    id: string; // name for now as ID isn't in main Assessment response list
    name: string;
    size?: string;
    type?: string;
}

interface FileListProps {
    files: string[]; // backend currently returns list of filenames in assessment.files (need to verify schema)
}

export function FileList({ files }: FileListProps) {
    if (!files || files.length === 0) {
        return null;
    }

    return (
        <div className="rounded-md border">
            <div className="p-4 font-medium">Uploaded Files</div>
            <Separator />
            <ScrollArea className="h-[200px]">
                <div className="p-4 space-y-4">
                    {files.map((fileName, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                    <File className="h-4 w-4" />
                                </div>
                                <div className="grid gap-1">
                                    <span className="text-sm font-medium leading-none">{fileName}</span>
                                    {/* <span className="text-xs text-muted-foreground">ZIP Archive</span> */}
                                </div>
                            </div>
                            {/* Delete not implemented in MVP API for individual files yet */}
                            {/* <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button> */}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

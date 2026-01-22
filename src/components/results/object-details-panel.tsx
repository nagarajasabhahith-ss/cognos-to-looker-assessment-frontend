"use client";

import { ExtractedObject } from "@/lib/api";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ObjectDetailsPanelProps {
    object: ExtractedObject | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ObjectDetailsPanel({ object, open, onOpenChange }: ObjectDetailsPanelProps) {
    if (!object) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-xl font-bold truncate pr-8">{object.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2">
                        <Badge variant="outline">{object.object_type}</Badge>
                        <span className="text-xs text-muted-foreground">ID: {object.id}</span>
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {object.properties?.expression && (
                        <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Expression</h4>
                            <ScrollArea className="max-h-[200px] bg-muted p-3 rounded-md border">
                                <code className="text-xs font-mono whitespace-pre-wrap break-all text-primary">
                                    {object.properties.expression}
                                </code>
                            </ScrollArea>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {object.properties?.data_type && (
                            <div>
                                <h4 className="text-sm font-medium mb-1 text-muted-foreground">Data Type</h4>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {object.properties.data_type}
                                </Badge>
                            </div>
                        )}
                        {object.properties?.aggregate && (
                            <div>
                                <h4 className="text-sm font-medium mb-1 text-muted-foreground">Aggregation</h4>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {object.properties.aggregate}
                                </Badge>
                            </div>
                        )}
                        {object.properties?.calculation_type && (
                            <div>
                                <h4 className="text-sm font-medium mb-1 text-muted-foreground">Calculation Type</h4>
                                <Badge variant="outline" className="text-xs">
                                    {object.properties.calculation_type}
                                </Badge>
                            </div>
                        )}
                        {object.properties?.data_usage && (
                            <div>
                                <h4 className="text-sm font-medium mb-1 text-muted-foreground">Usage</h4>
                                <Badge className={object.properties.data_usage === 'measure' ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
                                    {object.properties.data_usage}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Properties</h4>
                        <ScrollArea className="h-[300px] rounded-md border p-4">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(object.properties, null, 2)}
                            </pre>
                        </ScrollArea>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Location</h4>
                        <div className="bg-muted/50 p-2 rounded-md text-xs break-all font-mono text-muted-foreground">
                            {object.path || "N/A"}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

"use client";

import { useState } from "react";
import { ExtractedObject, ObjectRelationship } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table as TableIcon,
    Calculator,
    Filter,
    Columns,
    ListFilter,
    Search,
    ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataModelViewProps {
    objects: ExtractedObject[];
    relationships?: ObjectRelationship[];
    onObjectClick: (object: ExtractedObject) => void;
}

const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'table' || type === 'query') return <TableIcon className="h-4 w-4" />;
    if (type === 'calculated_field') return <Calculator className="h-4 w-4" />;
    if (type === 'filter') return <Filter className="h-4 w-4" />;
    if (type === 'column') return <Columns className="h-4 w-4" />;
    return <ListFilter className="h-4 w-4" />;
};

interface ObjectListProps {
    items: ExtractedObject[];
    emptyMsg: string;
    searchTerm: string;
    onObjectClick: (object: ExtractedObject) => void;
}

const ObjectList = ({ items, emptyMsg, searchTerm, onObjectClick }: ObjectListProps) => {
    const filtered = items.filter(o =>
        !searchTerm ||
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.object_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground text-center">{emptyMsg}</div>;
    }

    return (
        <div className="space-y-1 p-2">
            {filtered.map(obj => (
                <Button
                    key={obj.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => onObjectClick(obj)}
                >
                    <TypeIcon type={obj.object_type} />
                    <div className="ml-2 flex-1 overflow-hidden">
                        <div className="truncate font-medium">{obj.name}</div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
                                {obj.object_type}
                            </Badge>
                            {obj.path && <span className="opacity-70 truncate">{obj.path}</span>}
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
                </Button>
            ))}
        </div>
    );
};

export function DataModelView({ objects, onObjectClick }: DataModelViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("tables");

    // Filter objects by type
    const tables = objects.filter(o => o.object_type === 'table' || o.object_type === 'query');
    const calculatedFields = objects.filter(o => o.object_type === 'calculated_field');
    const filters = objects.filter(o => o.object_type === 'filter');
    const parameters = objects.filter(o => o.object_type === 'parameter');

    return (
        <div className="bg-background rounded-lg border flex h-[600px] overflow-hidden">
            <div className="w-64 border-r flex flex-col bg-muted/10">
                <div className="p-4 border-b space-y-4">
                    <h3 className="font-semibold px-2">Data Model</h3>
                    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                        <TabsList className="w-full grid grid-cols-4 h-9">
                            <TabsTrigger value="tables" title="Tables">
                                <TableIcon className="h-4 w-4" />
                            </TabsTrigger>
                            <TabsTrigger value="calcs" title="Calculations">
                                <Calculator className="h-4 w-4" />
                            </TabsTrigger>
                            <TabsTrigger value="filters" title="Filters">
                                <Filter className="h-4 w-4" />
                            </TabsTrigger>
                            <TabsTrigger value="params" title="Parameters">
                                <ListFilter className="h-4 w-4" />
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 pl-8 text-xs"
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {activeCategory === "tables" && (
                        <ObjectList
                            items={tables}
                            emptyMsg="No tables found"
                            searchTerm={searchTerm}
                            onObjectClick={onObjectClick}
                        />
                    )}
                    {activeCategory === "calcs" && (
                        <ObjectList
                            items={calculatedFields}
                            emptyMsg="No calculated fields found"
                            searchTerm={searchTerm}
                            onObjectClick={onObjectClick}
                        />
                    )}
                    {activeCategory === "filters" && (
                        <ObjectList
                            items={filters}
                            emptyMsg="No filters found"
                            searchTerm={searchTerm}
                            onObjectClick={onObjectClick}
                        />
                    )}
                    {activeCategory === "params" && (
                        <ObjectList
                            items={parameters}
                            emptyMsg="No parameters found"
                            searchTerm={searchTerm}
                            onObjectClick={onObjectClick}
                        />
                    )}
                </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/5">
                <TableIcon className="h-12 w-12 mb-4 opacity-20" />
                <p>Select an object from the list to view details</p>
            </div>
        </div>
    );
}

"use client";

import { useCallback, useMemo } from "react";
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    ConnectionMode,
    Panel,
    MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExtractedObject, ObjectRelationship } from "@/lib/api";
import { Card } from "@/components/ui/card";
import dagre from "dagre";

interface DependencyGraphProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
    onNodeClick: (object: ExtractedObject) => void;
}

const nodeWidth = 180;
const nodeHeight = 40;

// Color mapping for object types
const typeColors: Record<string, string> = {
    report: "#3b82f6",
    dashboard: "#8b5cf6",
    data_module: "#10b981",
    visualization: "#f59e0b",
    query: "#ec4899",
    folder: "#6b7280",
    filter: "#06b6d4",
    default: "#6b7280",
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Layout direction can be TB (top-bottom) or LR (left-right)
    dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export function DependencyGraph({ objects, relationships, onNodeClick }: DependencyGraphProps) {
    const initialNodes: Node[] = useMemo(() => {
        return objects.map((obj) => ({
            id: obj.id,
            data: {
                label: obj.name,
                object: obj,
            },
            position: { x: 0, y: 0 },
            style: {
                background: typeColors[obj.object_type] || typeColors.default,
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 500,
                width: nodeWidth,
                textAlign: "center" as const,
            },
        }));
    }, [objects]);

    const initialEdges: Edge[] = useMemo(() => {
        return relationships.map((rel) => ({
            id: rel.id,
            source: rel.source_object_id,
            target: rel.target_object_id,
            type: "smoothstep",
            animated: false,
            style: { stroke: "#94a3b8", strokeWidth: 1.5 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#94a3b8",
            },
            label: rel.relationship_type,
            labelStyle: { fontSize: 10, fill: "#64748b" },
            labelBgStyle: { fill: "white", fillOpacity: 0.8 },
        }));
    }, [relationships]);

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
        return getLayoutedElements(initialNodes, initialEdges, "TB");
    }, [initialNodes, initialEdges]);

    const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
    const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            const obj = node.data.object as ExtractedObject;
            if (obj) {
                onNodeClick(obj);
            }
        },
        [onNodeClick]
    );

    if (objects.length === 0) {
        return (
            <Card className="flex items-center justify-center h-[500px] text-muted-foreground">
                No objects to display in graph.
            </Card>
        );
    }

    return (
        <div className="h-[600px] rounded-lg border bg-background">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
            >
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        const obj = node.data?.object as ExtractedObject;
                        return typeColors[obj?.object_type] || typeColors.default;
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
                <Background gap={16} size={1} />
                <Panel position="top-left" className="bg-background/80 p-2 rounded-md text-xs space-y-1">
                    <div className="font-medium mb-2">Object Types</div>
                    {Object.entries(typeColors).filter(([key]) => key !== "default").map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: color }}
                            />
                            <span className="capitalize">{type.replace("_", " ")}</span>
                        </div>
                    ))}
                </Panel>
            </ReactFlow>
        </div>
    );
}

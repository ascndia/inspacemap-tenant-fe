// stores/graph-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  GraphData,
  GraphNode,
  GraphConnection,
  Vector3,
  Area,
  BoundaryPoint,
} from "@/types/graph";

interface GraphStore {
  // Data State
  graph: GraphData | null;
  isLoading: boolean;
  error: string | null;
  lastSynced: Date | null;

  // UI State
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  selectedAreaId: string | null;
  tool:
    | "select"
    | "move"
    | "add-node"
    | "connect"
    | "pan"
    | "zoom"
    | "draw-area";
  zoom: number;
  panOffset: { x: number; y: number };
  showPanoramaViewer: boolean;
  panoramaNodeId: string | null;
  panoramaYaw: number;
  panoramaPitch: number;
  isConnecting: boolean;
  connectingFromId: string | null;
  isDrawingArea: boolean;
  drawingAreaVertices: BoundaryPoint[];

  // Actions
  setGraph: (graph: GraphData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSynced: (date: Date | null) => void;

  // Data Operations (Server-synced)
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  addNode: (position: Vector3, attributes?: Partial<GraphNode>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (fromNodeId: string, toNodeId: string) => void;
  deleteConnection: (connectionId: string) => void;
  updateFloorplan: (updates: Partial<GraphData["floorplan"]>) => void;

  // Area Operations
  addArea: (area: Omit<Area, "id" | "createdAt" | "updatedAt">) => void;
  updateArea: (areaId: string, updates: Partial<Area>) => void;
  deleteArea: (areaId: string) => void;
  setAreaStartNode: (areaId: string, nodeId: string) => void;

  // UI Operations
  setSelectedNode: (nodeId: string | null) => void;
  setSelectedArea: (areaId: string | null) => void;
  setTool: (tool: GraphStore["tool"]) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  togglePanoramaViewer: () => void;
  setPanoramaNode: (nodeId: string | null) => void;
  setPanoramaRotation: (yaw: number, pitch: number) => void;
  setConnectingStart: (nodeId: string) => void;
  setConnectingEnd: () => void;
  setDrawingAreaStart: () => void;
  setDrawingAreaEnd: () => void;
  addDrawingVertex: (point: BoundaryPoint) => void;
  clearDrawingVertices: () => void;

  // Computed values
  selectedNode: GraphNode | null;
  selectedConnection: GraphConnection | null;
  selectedArea: Area | null;
  panoramaNode: GraphNode | null;
}

export const useGraphStore = create<GraphStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      graph: null,
      isLoading: false,
      error: null,
      lastSynced: null,

      selectedNodeId: null,
      selectedConnectionId: null,
      selectedAreaId: null,
      tool: "select",
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      showPanoramaViewer: false,
      panoramaNodeId: null,
      panoramaYaw: 0,
      panoramaPitch: 0,
      isConnecting: false,
      connectingFromId: null,
      isDrawingArea: false,
      drawingAreaVertices: [],

      // Basic Setters
      setGraph: (graph) => set({ graph }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setLastSynced: (lastSynced) => set({ lastSynced }),

      // Data Operations (Optimistic updates for server sync)
      updateNode: (nodeId, updates) => {
        const { graph } = get();
        if (!graph) return;

        const updatedNodes = graph.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, ...updates, updatedAt: new Date() }
            : node
        );

        const updatedGraph = {
          ...graph,
          nodes: updatedNodes,
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      addNode: (position, attributes) => {
        const { graph } = get();
        if (!graph) return;

        const newNode: GraphNode = {
          id: crypto.randomUUID(),
          position,
          rotation: 0,
          pitch: 0,
          heading: 0,
          fov: 75,
          connections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          ...attributes,
        };

        const updatedGraph = {
          ...graph,
          nodes: [...graph.nodes, newNode],
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      deleteNode: (nodeId) => {
        const { graph } = get();
        if (!graph) return;

        const updatedNodes = graph.nodes.filter((node) => node.id !== nodeId);
        const updatedConnections = graph.connections.filter(
          (conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
        );

        const updatedGraph = {
          ...graph,
          nodes: updatedNodes,
          connections: updatedConnections,
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      addConnection: (fromNodeId, toNodeId) => {
        const { graph } = get();
        if (!graph) return;

        const fromNode = graph.nodes.find((n) => n.id === fromNodeId);
        const toNode = graph.nodes.find((n) => n.id === toNodeId);
        if (!fromNode || !toNode) return;

        const distance = Math.sqrt(
          Math.pow(toNode.position.x - fromNode.position.x, 2) +
            Math.pow(toNode.position.y - fromNode.position.y, 2)
        );

        const newConnection: GraphConnection = {
          id: crypto.randomUUID(),
          fromNodeId,
          toNodeId,
          distance,
          bidirectional: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedNodes = graph.nodes.map((node) => {
          if (node.id === fromNodeId) {
            return { ...node, connections: [...node.connections, toNodeId] };
          }
          if (node.id === toNodeId) {
            return { ...node, connections: [...node.connections, fromNodeId] };
          }
          return node;
        });

        const updatedGraph = {
          ...graph,
          nodes: updatedNodes,
          connections: [...graph.connections, newConnection],
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      deleteConnection: (connectionId) => {
        const { graph } = get();
        if (!graph) return;

        const connection = graph.connections.find((c) => c.id === connectionId);
        if (!connection) return;

        const updatedNodes = graph.nodes.map((node) => {
          if (
            node.id === connection.fromNodeId ||
            node.id === connection.toNodeId
          ) {
            return {
              ...node,
              connections: node.connections.filter(
                (id) =>
                  id !== connection.fromNodeId && id !== connection.toNodeId
              ),
            };
          }
          return node;
        });

        const updatedGraph = {
          ...graph,
          nodes: updatedNodes,
          connections: graph.connections.filter((c) => c.id !== connectionId),
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      updateFloorplan: (updates) => {
        const { graph } = get();
        if (!graph || !graph.floorplan) return;

        const updatedFloorplan = {
          ...graph.floorplan,
          ...updates,
          updatedAt: new Date(),
        };

        const updatedGraph = {
          ...graph,
          floorplan: updatedFloorplan,
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      // Area Operations
      addArea: (areaData) => {
        const { graph } = get();
        if (!graph) return;

        const newArea: Area = {
          ...areaData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedGraph = {
          ...graph,
          areas: [...graph.areas, newArea],
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      updateArea: (areaId, updates) => {
        const { graph } = get();
        if (!graph) return;

        const updatedAreas = graph.areas.map((area) =>
          area.id === areaId
            ? { ...area, ...updates, updatedAt: new Date() }
            : area
        );

        const updatedGraph = {
          ...graph,
          areas: updatedAreas,
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      deleteArea: (areaId) => {
        const { graph } = get();
        if (!graph) return;

        const updatedAreas = graph.areas.filter((area) => area.id !== areaId);

        const updatedGraph = {
          ...graph,
          areas: updatedAreas,
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      setAreaStartNode: (areaId, nodeId) => {
        const { graph } = get();
        if (!graph) return;

        const updatedAreas = graph.areas.map((area) =>
          area.id === areaId
            ? { ...area, start_node_id: nodeId, updatedAt: new Date() }
            : area
        );

        const updatedGraph = {
          ...graph,
          areas: updatedAreas,
          updatedAt: new Date(),
        };

        set({ graph: updatedGraph });
      },

      // UI Operations
      setSelectedNode: (nodeId) =>
        set({
          selectedNodeId: nodeId,
          selectedConnectionId: null,
          selectedAreaId: null,
        }),

      setSelectedArea: (areaId) =>
        set({
          selectedAreaId: areaId,
          selectedNodeId: null,
          selectedConnectionId: null,
        }),

      setTool: (tool) => set({ tool }),
      setZoom: (zoom) => set({ zoom }),
      setPanOffset: (panOffset) => set({ panOffset }),
      togglePanoramaViewer: () =>
        set((state) => ({
          showPanoramaViewer: !state.showPanoramaViewer,
        })),
      setPanoramaNode: (nodeId) => set({ panoramaNodeId: nodeId }),
      setPanoramaRotation: (yaw, pitch) =>
        set({ panoramaYaw: yaw, panoramaPitch: pitch }),
      setConnectingStart: (nodeId) =>
        set({
          isConnecting: true,
          connectingFromId: nodeId,
        }),
      setConnectingEnd: () =>
        set({
          isConnecting: false,
          connectingFromId: null,
        }),
      setDrawingAreaStart: () =>
        set({
          isDrawingArea: true,
          drawingAreaVertices: [],
        }),
      setDrawingAreaEnd: () =>
        set({
          isDrawingArea: false,
        }),
      addDrawingVertex: (point) =>
        set((state) => ({
          drawingAreaVertices: [...state.drawingAreaVertices, point],
        })),
      clearDrawingVertices: () =>
        set({
          drawingAreaVertices: [],
        }),

      // Computed values
      get selectedNode() {
        const { graph, selectedNodeId } = get();
        return graph?.nodes.find((n) => n.id === selectedNodeId) || null;
      },

      get selectedConnection() {
        const { graph, selectedConnectionId } = get();
        return (
          graph?.connections.find((c) => c.id === selectedConnectionId) || null
        );
      },

      get selectedArea() {
        const { graph, selectedAreaId } = get();
        return graph?.areas.find((a) => a.id === selectedAreaId) || null;
      },

      get panoramaNode() {
        const { graph, panoramaNodeId } = get();
        return graph?.nodes.find((n) => n.id === panoramaNodeId) || null;
      },
    }),
    { name: "graph-store" }
  )
);

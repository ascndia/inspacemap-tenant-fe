import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  GraphNode,
  GraphConnection,
  GraphData,
  GraphSettings,
  GraphUIState,
  Floorplan,
  PanoramaImage,
  Vector3,
  ValidationResult,
  GraphAction,
} from "@/types/graph";

// Default settings
const defaultSettings: GraphSettings = {
  gridSize: 20,
  snapToGrid: false,
  showGrid: true,
  showLabels: true,
  showConnections: true,
  connectionStyle: "straight",
  nodeSize: 20,
  autoSave: true,
  collaboration: false,
  floorplanOpacity: 0.5,
};

// Default UI state
const defaultUIState: GraphUIState = {
  selectedNodeId: null,
  selectedConnectionId: null,
  selectedAreaId: null,
  hoveredNodeId: null,
  hoveredConnectionId: null,
  hoveredAreaId: null,
  isConnecting: false,
  connectingFromId: null,
  isDrawingArea: false,
  drawingAreaVertices: [],
  tool: "select",
  zoom: 1,
  panOffset: { x: 0, y: 0, z: 0 },
  showProperties: true,
  showGrid: true,
  snapToGrid: true,
  showPanoramaViewer: false,
  panoramaNodeId: null,
};

// Helper functions
const createNodeId = () =>
  `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const createConnectionId = () =>
  `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const snapToGrid = (position: Vector3, gridSize: number): Vector3 => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
    z: position.z, // Don't snap Z axis
  };
};

const calculateDistance = (from: Vector3, to: Vector3): number => {
  return Math.sqrt(
    Math.pow(to.x - from.x, 2) +
      Math.pow(to.y - from.y, 2) +
      Math.pow(to.z - from.z, 2)
  );
};

interface GraphStore {
  // Data state
  currentGraph: GraphData | null;
  nodes: GraphNode[];
  connections: GraphConnection[];
  floorplan: Floorplan | null;
  panoramas: PanoramaImage[];
  settings: GraphSettings;

  // UI state
  ui: GraphUIState;

  // History for undo/redo
  history: GraphAction[];
  historyIndex: number;

  // Actions
  initializeGraph: (venueId: string, floorId: string, name?: string) => void;
  loadGraph: (graph: GraphData) => void;
  saveGraph: () => GraphData | null;

  // Node operations
  addNode: (position: Vector3, attributes?: Partial<GraphNode>) => GraphNode;
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;

  // Connection operations
  addConnection: (
    fromNodeId: string,
    toNodeId: string
  ) => GraphConnection | null;
  deleteConnection: (connectionId: string) => void;
  selectConnection: (connectionId: string | null) => void;
  hoverConnection: (connectionId: string | null) => void;

  // Floorplan operations
  setFloorplan: (floorplan: Floorplan) => void;
  removeFloorplan: () => void;

  // Panorama operations
  addPanorama: (panorama: PanoramaImage) => void;
  removePanorama: (panoramaId: string) => void;
  assignPanoramaToNode: (panoramaId: string, nodeId: string) => void;

  // Settings
  updateSettings: (settings: Partial<GraphSettings>) => void;

  // UI operations
  setTool: (tool: GraphUIState["tool"]) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Vector3) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleProperties: () => void;
  togglePanoramaViewer: () => void;
  setPanoramaNode: (nodeId: string | null) => void;

  // Connection mode
  startConnecting: (fromNodeId: string) => void;
  cancelConnecting: () => void;

  // Validation
  validateGraph: () => ValidationResult;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Utility
  getNodeById: (id: string) => GraphNode | undefined;
  getConnectionById: (id: string) => GraphConnection | undefined;
  getConnectedNodes: (nodeId: string) => GraphNode[];
  exportGraph: () => GraphData | null;
  reset: () => void;
}

export const useGraphStore = create<GraphStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentGraph: null,
        nodes: [],
        connections: [],
        floorplan: null,
        panoramas: [],
        settings: defaultSettings,
        ui: defaultUIState,
        history: [],
        historyIndex: -1,

        // Initialize new graph
        initializeGraph: (
          venueId: string,
          floorId: string,
          name = "New Graph"
        ) => {
          const graph: GraphData = {
            id: `graph_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            venueId,
            floorId,
            name,
            nodes: [],
            connections: [],
            panoramas: [],
            settings: { ...defaultSettings },
            version: 1,
            isPublished: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set({
            currentGraph: graph,
            nodes: [],
            connections: [],
            floorplan: null,
            panoramas: [],
            settings: { ...defaultSettings },
            ui: { ...defaultUIState },
            history: [],
            historyIndex: -1,
          });
        },

        // Load existing graph
        loadGraph: (graph: GraphData) => {
          set({
            currentGraph: graph,
            nodes: graph.nodes,
            connections: graph.connections,
            floorplan: graph.floorplan || null,
            panoramas: graph.panoramas,
            settings: graph.settings,
            ui: { ...defaultUIState },
            history: [],
            historyIndex: -1,
          });
        },

        // Save current graph
        saveGraph: () => {
          const state = get();
          if (!state.currentGraph) return null;

          const updatedGraph: GraphData = {
            ...state.currentGraph,
            nodes: state.nodes,
            connections: state.connections,
            floorplan: state.floorplan || undefined,
            panoramas: state.panoramas,
            settings: state.settings,
            version: state.currentGraph.version + 1,
            updatedAt: new Date(),
          };

          set({ currentGraph: updatedGraph });
          return updatedGraph;
        },

        // Node operations
        addNode: (position: Vector3, attributes = {}) => {
          const state = get();
          const snappedPosition = state.settings.snapToGrid
            ? snapToGrid(position, state.settings.gridSize)
            : position;

          const node: GraphNode = {
            id: createNodeId(),
            position: snappedPosition,
            rotation: 0,
            pitch: 0,
            heading: 0,
            fov: 75,
            connections: [],
            ...attributes,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const action: GraphAction = {
            type: "ADD_NODE",
            payload: { position: snappedPosition, attributes },
          };

          set((state) => ({
            nodes: [...state.nodes, node],
            history: [
              ...state.history.slice(0, state.historyIndex + 1),
              action,
            ],
            historyIndex: state.historyIndex + 1,
          }));

          return node;
        },

        updateNode: (nodeId: string, updates: Partial<GraphNode>) => {
          const action: GraphAction = {
            type: "UPDATE_NODE",
            payload: { nodeId, updates },
          };

          set((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, ...updates, updatedAt: new Date() }
                : node
            ),
            history: [
              ...state.history.slice(0, state.historyIndex + 1),
              action,
            ],
            historyIndex: state.historyIndex + 1,
          }));
        },

        deleteNode: (nodeId: string) => {
          const state = get();
          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node) return;

          // Remove connections to this node
          const connectionsToRemove = state.connections.filter(
            (conn) => conn.fromNodeId === nodeId || conn.toNodeId === nodeId
          );

          const action: GraphAction = {
            type: "DELETE_NODE",
            payload: { nodeId },
          };

          set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== nodeId),
            connections: state.connections.filter(
              (conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
            ),
            ui: {
              ...state.ui,
              selectedNodeId:
                state.ui.selectedNodeId === nodeId
                  ? null
                  : state.ui.selectedNodeId,
              hoveredNodeId:
                state.ui.hoveredNodeId === nodeId
                  ? null
                  : state.ui.hoveredNodeId,
            },
            history: [
              ...state.history.slice(0, state.historyIndex + 1),
              action,
            ],
            historyIndex: state.historyIndex + 1,
          }));
        },

        selectNode: (nodeId: string | null) => {
          set((state) => ({
            ui: { ...state.ui, selectedNodeId: nodeId },
          }));
        },

        hoverNode: (nodeId: string | null) => {
          set((state) => ({
            ui: { ...state.ui, hoveredNodeId: nodeId },
          }));
        },

        // Connection operations
        addConnection: (fromNodeId: string, toNodeId: string) => {
          const state = get();
          const fromNode = state.nodes.find((n) => n.id === fromNodeId);
          const toNode = state.nodes.find((n) => n.id === toNodeId);

          if (!fromNode || !toNode || fromNodeId === toNodeId) return null;

          // Check if connection already exists
          const existingConnection = state.connections.find(
            (conn) =>
              (conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId) ||
              (conn.fromNodeId === toNodeId &&
                conn.toNodeId === fromNodeId &&
                conn.bidirectional)
          );

          if (existingConnection) return null;

          const distance = calculateDistance(
            fromNode.position,
            toNode.position
          );
          const connection: GraphConnection = {
            id: createConnectionId(),
            fromNodeId,
            toNodeId,
            distance,
            bidirectional: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const action: GraphAction = {
            type: "ADD_CONNECTION",
            payload: { fromNodeId, toNodeId },
          };

          set((state) => ({
            connections: [...state.connections, connection],
            nodes: state.nodes.map((node) => {
              if (node.id === fromNodeId) {
                return {
                  ...node,
                  connections: [...node.connections, toNodeId],
                  updatedAt: new Date(),
                };
              }
              if (node.id === toNodeId) {
                return {
                  ...node,
                  connections: [...node.connections, fromNodeId],
                  updatedAt: new Date(),
                };
              }
              return node;
            }),
            history: [
              ...state.history.slice(0, state.historyIndex + 1),
              action,
            ],
            historyIndex: state.historyIndex + 1,
          }));

          return connection;
        },

        deleteConnection: (connectionId: string) => {
          const state = get();
          const connection = state.connections.find(
            (c) => c.id === connectionId
          );
          if (!connection) return;

          const action: GraphAction = {
            type: "DELETE_CONNECTION",
            payload: { connectionId },
          };

          set((state) => ({
            connections: state.connections.filter((c) => c.id !== connectionId),
            nodes: state.nodes.map((node) => {
              if (node.connections.includes(connection.fromNodeId)) {
                return {
                  ...node,
                  connections: node.connections.filter(
                    (id) => id !== connection.fromNodeId
                  ),
                  updatedAt: new Date(),
                };
              }
              if (node.connections.includes(connection.toNodeId)) {
                return {
                  ...node,
                  connections: node.connections.filter(
                    (id) => id !== connection.toNodeId
                  ),
                  updatedAt: new Date(),
                };
              }
              return node;
            }),
            ui: {
              ...state.ui,
              selectedConnectionId:
                state.ui.selectedConnectionId === connectionId
                  ? null
                  : state.ui.selectedConnectionId,
              hoveredConnectionId:
                state.ui.hoveredConnectionId === connectionId
                  ? null
                  : state.ui.hoveredConnectionId,
            },
            history: [
              ...state.history.slice(0, state.historyIndex + 1),
              action,
            ],
            historyIndex: state.historyIndex + 1,
          }));
        },

        selectConnection: (connectionId: string | null) => {
          set((state) => ({
            ui: { ...state.ui, selectedConnectionId: connectionId },
          }));
        },

        hoverConnection: (connectionId: string | null) => {
          set((state) => ({
            ui: { ...state.ui, hoveredConnectionId: connectionId },
          }));
        },

        // Floorplan operations
        setFloorplan: (floorplan: Floorplan) => {
          set({ floorplan });
        },

        removeFloorplan: () => {
          set({ floorplan: null });
        },

        // Panorama operations
        addPanorama: (panorama: PanoramaImage) => {
          set((state) => ({
            panoramas: [...state.panoramas, panorama],
          }));
        },

        removePanorama: (panoramaId: string) => {
          set((state) => ({
            panoramas: state.panoramas.filter((p) => p.id !== panoramaId),
          }));
        },

        assignPanoramaToNode: (panoramaId: string, nodeId: string) => {
          const state = get();
          const panorama = state.panoramas.find((p) => p.id === panoramaId);
          if (!panorama) return;

          get().updateNode(nodeId, { panorama_url: panorama.fileUrl });
        },

        // Settings
        updateSettings: (settings: Partial<GraphSettings>) => {
          set((state) => ({
            settings: { ...state.settings, ...settings },
          }));
        },

        // UI operations
        setTool: (tool: GraphUIState["tool"]) => {
          set((state) => ({
            ui: { ...state.ui, tool },
          }));
        },

        setZoom: (zoom: number) => {
          set((state) => ({
            ui: { ...state.ui, zoom: Math.max(0.1, Math.min(5, zoom)) },
          }));
        },

        setPanOffset: (offset: Vector3) => {
          set((state) => ({
            ui: { ...state.ui, panOffset: offset },
          }));
        },

        toggleGrid: () => {
          set((state) => ({
            ui: { ...state.ui, showGrid: !state.ui.showGrid },
          }));
        },

        toggleSnapToGrid: () => {
          set((state) => ({
            ui: { ...state.ui, snapToGrid: !state.ui.snapToGrid },
          }));
        },

        toggleProperties: () => {
          set((state) => ({
            ui: { ...state.ui, showProperties: !state.ui.showProperties },
          }));
        },

        togglePanoramaViewer: () => {
          set((state) => ({
            ui: {
              ...state.ui,
              showPanoramaViewer: !state.ui.showPanoramaViewer,
            },
          }));
        },

        setPanoramaNode: (nodeId: string | null) => {
          set((state) => ({
            ui: { ...state.ui, panoramaNodeId: nodeId },
          }));
        },

        // Connection mode
        startConnecting: (fromNodeId: string) => {
          set((state) => ({
            ui: {
              ...state.ui,
              isConnecting: true,
              connectingFromId: fromNodeId,
              tool: "connect",
            },
          }));
        },

        cancelConnecting: () => {
          set((state) => ({
            ui: {
              ...state.ui,
              isConnecting: false,
              connectingFromId: null,
              tool: "select",
            },
          }));
        },

        // Validation
        validateGraph: () => {
          const state = get();
          const errors: string[] = [];
          const warnings: string[] = [];

          // Check for isolated nodes
          const isolatedNodes = state.nodes.filter(
            (node) => node.connections.length === 0
          );
          if (isolatedNodes.length > 0) {
            warnings.push(
              `${isolatedNodes.length} nodes are not connected to the graph`
            );
          }

          // Check for nodes without panoramas
          const nodesWithoutPanoramas = state.nodes.filter(
            (node) => !node.panorama_url
          );
          if (nodesWithoutPanoramas.length > 0) {
            warnings.push(
              `${nodesWithoutPanoramas.length} nodes don't have associated panoramas`
            );
          }

          // Check for duplicate connections (shouldn't happen with current logic)
          const connectionKeys = new Set();
          state.connections.forEach((conn) => {
            const key = [conn.fromNodeId, conn.toNodeId].sort().join("-");
            if (connectionKeys.has(key)) {
              errors.push("Duplicate connections found");
            }
            connectionKeys.add(key);
          });

          return {
            isValid: errors.length === 0,
            errors,
            warnings,
          };
        },

        // History operations
        undo: () => {
          const state = get();
          if (state.historyIndex > 0) {
            const previousIndex = state.historyIndex - 1;
            const action = state.history[previousIndex];

            // Apply reverse action
            // This is a simplified implementation - in a real app you'd have proper undo logic
            set({ historyIndex: previousIndex });
          }
        },

        redo: () => {
          const state = get();
          if (state.historyIndex < state.history.length - 1) {
            const nextIndex = state.historyIndex + 1;
            const action = state.history[nextIndex];

            // Apply action
            // This is a simplified implementation - in a real app you'd have proper redo logic
            set({ historyIndex: nextIndex });
          }
        },

        canUndo: () => get().historyIndex > 0,
        canRedo: () => get().historyIndex < get().history.length - 1,

        // Utility functions
        getNodeById: (id: string) => get().nodes.find((node) => node.id === id),
        getConnectionById: (id: string) =>
          get().connections.find((conn) => conn.id === id),

        getConnectedNodes: (nodeId: string) => {
          const state = get();
          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node) return [];

          return state.nodes.filter((n) => node.connections.includes(n.id));
        },

        exportGraph: () => {
          const state = get();
          return state.currentGraph
            ? {
                ...state.currentGraph,
                nodes: state.nodes,
                connections: state.connections,
                floorplan: state.floorplan || undefined,
                panoramas: state.panoramas,
                settings: state.settings,
                updatedAt: new Date(),
              }
            : null;
        },

        reset: () => {
          set({
            currentGraph: null,
            nodes: [],
            connections: [],
            floorplan: null,
            panoramas: [],
            settings: { ...defaultSettings },
            ui: { ...defaultUIState },
            history: [],
            historyIndex: -1,
          });
        },
      }),
      {
        name: "graph-store",
        partialize: (state) => ({
          settings: state.settings,
          ui: {
            showProperties: state.ui.showProperties,
            showGrid: state.ui.showGrid,
            snapToGrid: state.ui.snapToGrid,
            showPanoramaViewer: state.ui.showPanoramaViewer,
            panoramaNodeId: state.ui.panoramaNodeId,
          },
        }),
      }
    ),
    { name: "graph-store" }
  )
);

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { GraphService } from "@/lib/services/graph-service";
import {
  GraphNode,
  GraphConnection,
  GraphData,
  GraphSettings,
  Vector3,
  ValidationResult,
  GraphUIState,
  GraphStats,
} from "@/types/graph";

// Action Types
type GraphAction =
  | {
      type: "ADD_NODE";
      payload: { position: Vector3; attributes?: Partial<GraphNode> };
    }
  | {
      type: "UPDATE_NODE";
      payload: { nodeId: string; updates: Partial<GraphNode> };
    }
  | { type: "DELETE_NODE"; payload: { nodeId: string } }
  | {
      type: "ADD_CONNECTION";
      payload: { fromNodeId: string; toNodeId: string };
    }
  | { type: "DELETE_CONNECTION"; payload: { connectionId: string } }
  | { type: "UPDATE_FLOORPLAN_BOUNDS"; payload: { bounds: any } }
  | { type: "SET_SELECTED_NODE"; payload: { nodeId: string | null } }
  | {
      type: "SET_SELECTED_CONNECTION";
      payload: { connectionId: string | null };
    }
  | { type: "UPDATE_SETTINGS"; payload: { settings: Partial<GraphSettings> } }
  | {
      type: "SET_TOOL";
      payload: { tool: "select" | "add-node" | "connect" | "pan" | "zoom" };
    }
  | { type: "SET_CONNECTING_START"; payload: { nodeId: string } }
  | { type: "SET_CONNECTING_END" }
  | { type: "LOAD_GRAPH"; payload: { graph: GraphData } }
  | { type: "RESET_GRAPH" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_PANORAMA_NODE"; payload: { nodeId: string | null } }
  | { type: "TOGGLE_PANORAMA_VIEWER" }
  | { type: "SET_LOADING"; payload: { loading: boolean } }
  | { type: "SET_ERROR"; payload: { error: string | null } };

// State Interface
interface GraphState {
  graph: GraphData | null;
  ui: GraphUIState;
  history: GraphData[];
  historyIndex: number;
  isLoading: boolean;
  error: string | null;
}

// Initial State
const initialState: GraphState = {
  graph: null,
  ui: {
    selectedNodeId: null,
    selectedConnectionId: null,
    hoveredNodeId: null,
    hoveredConnectionId: null,
    isConnecting: false,
    connectingFromId: null,
    tool: "select",
    zoom: 1,
    panOffset: { x: 0, y: 0, z: 0 },
    showProperties: true,
    showGrid: true,
    snapToGrid: true,
    showPanoramaViewer: true,
    panoramaNodeId: null,
  },
  history: [],
  historyIndex: -1,
  isLoading: false,
  error: null,
};

// Reducer
function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case "ADD_NODE": {
      if (!state.graph) return state;

      const newNode: GraphNode = {
        id: crypto.randomUUID(),
        position: action.payload.position,
        rotation: 0,
        pitch: 0,
        heading: 0,
        fov: 75,
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...action.payload.attributes,
      };

      const newGraph = {
        ...state.graph,
        nodes: [...state.graph.nodes, newNode],
        updatedAt: new Date(),
      };

      return {
        ...state,
        graph: newGraph,
        history: [...state.history.slice(0, state.historyIndex + 1), newGraph],
        historyIndex: state.historyIndex + 1,
      };
    }

    case "UPDATE_NODE": {
      if (!state.graph) return state;

      const updatedNodes = state.graph.nodes.map((node) =>
        node.id === action.payload.nodeId
          ? { ...node, ...action.payload.updates, updatedAt: new Date() }
          : node
      );

      const newGraph = {
        ...state.graph,
        nodes: updatedNodes,
        updatedAt: new Date(),
      };

      return {
        ...state,
        graph: newGraph,
        history: [...state.history.slice(0, state.historyIndex + 1), newGraph],
        historyIndex: state.historyIndex + 1,
      };
    }

    case "DELETE_NODE": {
      if (!state.graph) return state;

      const nodeToDelete = state.graph.nodes.find(
        (n) => n.id === action.payload.nodeId
      );
      if (!nodeToDelete) return state;

      // Remove connections to this node
      const updatedConnections = state.graph.connections.filter(
        (conn) =>
          conn.fromNodeId !== action.payload.nodeId &&
          conn.toNodeId !== action.payload.nodeId
      );

      // Remove node from other nodes' connections
      const updatedNodes = state.graph.nodes
        .filter((node) => node.id !== action.payload.nodeId)
        .map((node) => ({
          ...node,
          connections: node.connections.filter(
            (id) => id !== action.payload.nodeId
          ),
        }));

      const newGraph = {
        ...state.graph,
        nodes: updatedNodes,
        connections: updatedConnections,
        updatedAt: new Date(),
      };

      return {
        ...state,
        graph: newGraph,
        ui: {
          ...state.ui,
          selectedNodeId:
            state.ui.selectedNodeId === action.payload.nodeId
              ? null
              : state.ui.selectedNodeId,
        },
        history: [...state.history.slice(0, state.historyIndex + 1), newGraph],
        historyIndex: state.historyIndex + 1,
      };
    }

    case "ADD_CONNECTION": {
      if (!state.graph) return state;

      const fromNode = state.graph.nodes.find(
        (n) => n.id === action.payload.fromNodeId
      );
      const toNode = state.graph.nodes.find(
        (n) => n.id === action.payload.toNodeId
      );

      if (!fromNode || !toNode) return state;

      // Check if connection already exists
      const existingConnection = state.graph.connections.find(
        (conn) =>
          (conn.fromNodeId === action.payload.fromNodeId &&
            conn.toNodeId === action.payload.toNodeId) ||
          (conn.fromNodeId === action.payload.toNodeId &&
            conn.toNodeId === action.payload.fromNodeId &&
            conn.bidirectional)
      );

      if (existingConnection) return state;

      const distance = Math.sqrt(
        Math.pow(toNode.position.x - fromNode.position.x, 2) +
          Math.pow(toNode.position.y - fromNode.position.y, 2)
      );

      const newConnection: GraphConnection = {
        id: crypto.randomUUID(),
        fromNodeId: action.payload.fromNodeId,
        toNodeId: action.payload.toNodeId,
        distance,
        bidirectional: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update node connections
      const updatedNodes = state.graph.nodes.map((node) => {
        if (node.id === action.payload.fromNodeId) {
          return {
            ...node,
            connections: [...node.connections, action.payload.toNodeId],
          };
        }
        if (node.id === action.payload.toNodeId) {
          return {
            ...node,
            connections: [...node.connections, action.payload.fromNodeId],
          };
        }
        return node;
      });

      const newGraph = {
        ...state.graph,
        nodes: updatedNodes,
        connections: [...state.graph.connections, newConnection],
        updatedAt: new Date(),
      };

      return {
        ...state,
        graph: newGraph,
        history: [...state.history.slice(0, state.historyIndex + 1), newGraph],
        historyIndex: state.historyIndex + 1,
      };
    }

    case "DELETE_CONNECTION": {
      if (!state.graph) return state;

      const connectionToDelete = state.graph.connections.find(
        (c) => c.id === action.payload.connectionId
      );
      if (!connectionToDelete) return state;

      // Remove connection from nodes
      const updatedNodes = state.graph.nodes.map((node) => {
        if (
          node.id === connectionToDelete.fromNodeId ||
          node.id === connectionToDelete.toNodeId
        ) {
          return {
            ...node,
            connections: node.connections.filter(
              (id) =>
                id !== connectionToDelete.fromNodeId &&
                id !== connectionToDelete.toNodeId
            ),
          };
        }
        return node;
      });

      const newGraph = {
        ...state.graph,
        nodes: updatedNodes,
        connections: state.graph.connections.filter(
          (c) => c.id !== action.payload.connectionId
        ),
        updatedAt: new Date(),
      };

      return {
        ...state,
        graph: newGraph,
        ui: {
          ...state.ui,
          selectedConnectionId:
            state.ui.selectedConnectionId === action.payload.connectionId
              ? null
              : state.ui.selectedConnectionId,
        },
        history: [...state.history.slice(0, state.historyIndex + 1), newGraph],
        historyIndex: state.historyIndex + 1,
      };
    }

    case "UPDATE_FLOORPLAN_BOUNDS": {
      if (!state.graph?.floorplan) return state;

      const newGraph = {
        ...state.graph,
        floorplan: {
          ...state.graph.floorplan,
          bounds: action.payload.bounds,
        },
        updatedAt: new Date(),
      };

      return {
        ...state,
        graph: newGraph,
        // Don't add to history for bounds updates
      };
    }

    case "SET_SELECTED_NODE": {
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedNodeId: action.payload.nodeId,
          selectedConnectionId: null, // Clear connection selection
        },
      };
    }

    case "SET_TOOL": {
      return {
        ...state,
        ui: {
          ...state.ui,
          tool: action.payload.tool,
        },
      };
    }

    case "SET_CONNECTING_START": {
      return {
        ...state,
        ui: {
          ...state.ui,
          isConnecting: true,
          connectingFromId: action.payload.nodeId,
        },
      };
    }

    case "SET_CONNECTING_END": {
      return {
        ...state,
        ui: {
          ...state.ui,
          isConnecting: false,
          connectingFromId: null,
        },
      };
    }

    case "UPDATE_SETTINGS": {
      if (!state.graph) return state;

      const newGraph = {
        ...state.graph,
        settings: { ...state.graph.settings, ...action.payload.settings },
        updatedAt: new Date(),
      };

      // TODO: Remove this log after debugging
      console.log("Updated settings:", newGraph.settings);

      return {
        ...state,
        graph: newGraph,
        ui: {
          ...state.ui,
          showGrid: action.payload.settings.showGrid ?? state.ui.showGrid,
          snapToGrid: action.payload.settings.snapToGrid ?? state.ui.snapToGrid,
        },
        history: [...state.history.slice(0, state.historyIndex + 1), newGraph],
        historyIndex: state.historyIndex + 1,
      };
    }

    case "LOAD_GRAPH": {
      return {
        ...state,
        graph: action.payload.graph,
        history: [action.payload.graph],
        historyIndex: 0,
        ui: { ...initialState.ui }, // Reset UI state
      };
    }

    case "RESET_GRAPH": {
      return {
        ...initialState,
        graph: state.graph
          ? {
              ...state.graph,
              nodes: [],
              connections: [],
              updatedAt: new Date(),
            }
          : null,
      };
    }

    case "UNDO": {
      if (state.historyIndex > 0) {
        return {
          ...state,
          graph: state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
        };
      }
      return state;
    }

    case "REDO": {
      if (state.historyIndex < state.history.length - 1) {
        return {
          ...state,
          graph: state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
        };
      }
      return state;
    }

    case "SET_PANORAMA_NODE": {
      return {
        ...state,
        ui: {
          ...state.ui,
          panoramaNodeId: action.payload.nodeId,
        },
      };
    }

    case "TOGGLE_PANORAMA_VIEWER": {
      return {
        ...state,
        ui: {
          ...state.ui,
          showPanoramaViewer: !state.ui.showPanoramaViewer,
        },
      };
    }

    case "SET_LOADING": {
      return {
        ...state,
        isLoading: action.payload.loading,
      };
    }

    case "SET_ERROR": {
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
      };
    }

    default:
      return state;
  }
}

// Context
interface GraphContextType {
  state: GraphState;
  dispatch: React.Dispatch<GraphAction>;

  // Helper functions
  addNode: (position: Vector3, attributes?: Partial<GraphNode>) => void;
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (fromNodeId: string, toNodeId: string) => void;
  deleteConnection: (connectionId: string) => void;
  loadFloorplan: (floorplan: any) => void;
  updateFloorplanBounds: (bounds: any) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setSelectedConnection: (connectionId: string | null) => void;
  updateSettings: (settings: Partial<GraphSettings>) => void;
  setTool: (tool: "select" | "add-node" | "connect" | "pan" | "zoom") => void;
  setConnectingStart: (nodeId: string) => void;
  setConnectingEnd: () => void;
  loadGraph: (graph: GraphData) => void;
  resetGraph: () => void;
  undo: () => void;
  redo: () => void;
  setPanoramaNode: (nodeId: string | null) => void;
  togglePanoramaViewer: () => void;
  saveGraph: () => Promise<void>;

  // Advanced features
  autoLayout: () => void;
  findPath: (startNodeId: string, endNodeId: string) => GraphNode[] | null;
  getGraphStats: () => GraphStats | null;

  // Computed values
  selectedNode: GraphNode | null;
  selectedConnection: GraphConnection | null;
  panoramaNode: GraphNode | null;
  canUndo: boolean;
  canRedo: boolean;
  validateGraph: () => ValidationResult;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

// Provider Component
interface GraphProviderProps {
  children: ReactNode;
  initialGraph?: GraphData;
  venueId?: string;
  revisionId?: string;
  floorId?: string;
  autoSave?: boolean;
}

export function GraphProvider({
  children,
  initialGraph,
  venueId,
  revisionId,
  floorId,
  autoSave = true,
}: GraphProviderProps) {
  const graphServiceRef = useRef<GraphService | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize graph service when venue/revision/floor IDs are provided
  useEffect(() => {
    if (venueId && revisionId && floorId) {
      graphServiceRef.current = new GraphService(venueId, revisionId, floorId);
    }
  }, [venueId, revisionId, floorId]);

  const [state, dispatch] = useReducer(graphReducer, {
    ...initialState,
    graph: initialGraph || null,
    history: initialGraph ? [initialGraph] : [],
    historyIndex: initialGraph ? 0 : -1,
  });

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !state.graph || !graphServiceRef.current) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (5 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await graphServiceRef.current!.saveGraph(state.graph);
        console.log("Graph auto-saved successfully");
      } catch (error) {
        console.error("Failed to auto-save graph:", error);
      }
    }, 5000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.graph, autoSave]);

  // Load graph data when venue/revision/floor changes
  useEffect(() => {
    if (!venueId || !revisionId || !floorId || !graphServiceRef.current) return;

    const loadGraphData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: { loading: true } });
        const graphData = await graphServiceRef.current!.loadGraph();

        dispatch({ type: "LOAD_GRAPH", payload: { graph: graphData } });
      } catch (error) {
        console.error("Failed to load graph data:", error);
        dispatch({
          type: "SET_ERROR",
          payload: { error: "Failed to load graph data" },
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
      }
    };

    loadGraphData();
  }, [venueId, revisionId, floorId]);

  // Helper functions
  const addNode = useCallback(
    async (position: Vector3, attributes?: Partial<GraphNode>) => {
      try {
        let newNode: GraphNode;

        if (graphServiceRef.current) {
          // Use backend API
          newNode = await graphServiceRef.current.createNode(
            position,
            attributes
          );
        } else {
          // Fallback to local creation
          newNode = {
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
        }

        dispatch({
          type: "ADD_NODE",
          payload: { position, attributes: newNode },
        });
      } catch (error) {
        console.error("Failed to add node:", error);
        dispatch({
          type: "SET_ERROR",
          payload: { error: "Failed to add node" },
        });
      }
    },
    []
  );

  const updateNode = useCallback(
    async (nodeId: string, updates: Partial<GraphNode>) => {
      try {
        if (graphServiceRef.current) {
          // Use backend API
          await graphServiceRef.current.updateNode(nodeId, updates);
        }

        dispatch({ type: "UPDATE_NODE", payload: { nodeId, updates } });
      } catch (error) {
        console.error("Failed to update node:", error);
        dispatch({
          type: "SET_ERROR",
          payload: { error: "Failed to update node" },
        });
      }
    },
    []
  );

  const deleteNode = useCallback(async (nodeId: string) => {
    try {
      if (graphServiceRef.current) {
        // Use backend API
        await graphServiceRef.current.deleteNode(nodeId);
      }

      dispatch({ type: "DELETE_NODE", payload: { nodeId } });
    } catch (error) {
      console.error("Failed to delete node:", error);
      dispatch({
        type: "SET_ERROR",
        payload: { error: "Failed to delete node" },
      });
    }
  }, []);

  const addConnection = useCallback(
    async (fromNodeId: string, toNodeId: string) => {
      try {
        let newConnection: GraphConnection;

        if (graphServiceRef.current) {
          // Use backend API
          newConnection = await graphServiceRef.current.createConnection(
            fromNodeId,
            toNodeId
          );
        } else {
          // Fallback to local creation
          const fromNode = state.graph?.nodes.find((n) => n.id === fromNodeId);
          const toNode = state.graph?.nodes.find((n) => n.id === toNodeId);

          if (!fromNode || !toNode) return;

          const distance = Math.sqrt(
            Math.pow(toNode.position.x - fromNode.position.x, 2) +
              Math.pow(toNode.position.y - fromNode.position.y, 2)
          );

          newConnection = {
            id: crypto.randomUUID(),
            fromNodeId,
            toNodeId,
            distance,
            bidirectional: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        dispatch({ type: "ADD_CONNECTION", payload: { fromNodeId, toNodeId } });
      } catch (error) {
        console.error("Failed to add connection:", error);
        dispatch({
          type: "SET_ERROR",
          payload: { error: "Failed to add connection" },
        });
      }
    },
    [state.graph?.nodes]
  );

  const deleteConnection = useCallback(
    async (connectionId: string) => {
      try {
        if (graphServiceRef.current && state.graph) {
          // Find the connection to get node IDs
          const connection = state.graph.connections.find(
            (c) => c.id === connectionId
          );
          if (connection) {
            // Use backend API with node IDs
            await GraphRevisionService.deleteConnection(
              connection.fromNodeId,
              connection.toNodeId
            );
          }
        }

        dispatch({ type: "DELETE_CONNECTION", payload: { connectionId } });
      } catch (error) {
        console.error("Failed to delete connection:", error);
        dispatch({
          type: "SET_ERROR",
          payload: { error: "Failed to delete connection" },
        });
      }
    },
    [state.graph?.connections]
  );

  const loadFloorplan = useCallback((floorplan: any) => {
    dispatch({ type: "LOAD_FLOORPLAN", payload: { floorplan } });
  }, []);

  const updateFloorplanBounds = useCallback((bounds: any) => {
    dispatch({ type: "UPDATE_FLOORPLAN_BOUNDS", payload: { bounds } });
  }, []);

  const setSelectedNode = useCallback((nodeId: string | null) => {
    dispatch({ type: "SET_SELECTED_NODE", payload: { nodeId } });
  }, []);

  const setSelectedConnection = useCallback((connectionId: string | null) => {
    dispatch({ type: "SET_SELECTED_CONNECTION", payload: { connectionId } });
  }, []);

  const updateSettings = useCallback((settings: Partial<GraphSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { settings } });
  }, []);

  const setTool = useCallback(
    (tool: "select" | "add-node" | "connect" | "pan" | "zoom") => {
      dispatch({ type: "SET_TOOL", payload: { tool } });
    },
    []
  );

  const setConnectingStart = useCallback((nodeId: string) => {
    dispatch({ type: "SET_CONNECTING_START", payload: { nodeId } });
  }, []);

  const setConnectingEnd = useCallback(() => {
    dispatch({ type: "SET_CONNECTING_END" });
  }, []);

  const loadGraph = useCallback((graph: GraphData) => {
    dispatch({ type: "LOAD_GRAPH", payload: { graph } });
  }, []);

  const resetGraph = useCallback(() => {
    dispatch({ type: "RESET_GRAPH" });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const setPanoramaNode = useCallback((nodeId: string | null) => {
    dispatch({ type: "SET_PANORAMA_NODE", payload: { nodeId } });
  }, []);

  const togglePanoramaViewer = useCallback(() => {
    dispatch({ type: "TOGGLE_PANORAMA_VIEWER" });
  }, []);

  const saveGraph = useCallback(async () => {
    if (!state.graph || !graphServiceRef.current) return;

    try {
      dispatch({ type: "SET_LOADING", payload: { loading: true } });
      await graphServiceRef.current.saveGraph(state.graph);
      dispatch({ type: "SET_ERROR", payload: { error: null } });
    } catch (error) {
      console.error("Failed to save graph:", error);
      dispatch({
        type: "SET_ERROR",
        payload: { error: "Failed to save graph" },
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  }, [state.graph]);

  const validateGraph = useCallback((): ValidationResult => {
    if (!state.graph) {
      return { isValid: false, errors: ["No graph loaded"], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for isolated nodes
    const isolatedNodes = state.graph.nodes.filter(
      (node) => node.connections.length === 0
    );
    if (isolatedNodes.length > 0) {
      warnings.push(
        `${isolatedNodes.length} nodes are not connected to the graph`
      );
    }

    // Check for nodes without panoramas
    const nodesWithoutPanoramas = state.graph.nodes.filter(
      (node) => !node.panoramaUrl
    );
    if (nodesWithoutPanoramas.length > 0) {
      warnings.push(
        `${nodesWithoutPanoramas.length} nodes do not have associated panoramas`
      );
    }

    // Check for unreachable areas (simplified check)
    const connectedNodes = new Set<string>();
    const queue = state.graph.nodes.filter(
      (node) => node.connections.length > 0
    );

    if (queue.length > 0) {
      connectedNodes.add(queue[0].id);
      let index = 0;

      while (index < queue.length) {
        const currentNode = queue[index];
        currentNode.connections.forEach((connectedId) => {
          if (!connectedNodes.has(connectedId)) {
            connectedNodes.add(connectedId);
            const connectedNode = state.graph!.nodes.find(
              (n) => n.id === connectedId
            );
            if (connectedNode) queue.push(connectedNode);
          }
        });
        index++;
      }

      const unreachableNodes = state.graph.nodes.filter(
        (node) => !connectedNodes.has(node.id)
      );
      if (unreachableNodes.length > 0) {
        errors.push(
          `${unreachableNodes.length} nodes are unreachable from the main graph`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [state.graph]);

  // Computed values
  const selectedNode =
    state.graph?.nodes.find((n) => n.id === state.ui.selectedNodeId) || null;
  const selectedConnection =
    state.graph?.connections.find(
      (c) => c.id === state.ui.selectedConnectionId
    ) || null;
  const panoramaNode =
    state.graph?.nodes.find((n) => n.id === state.ui.panoramaNodeId) || null;
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // Advanced features
  const autoLayout = useCallback(() => {
    if (!state.graph) return;

    const {
      GraphAlgorithms,
    } = require("@/lib/engine/algorithms/graph-algorithms");
    const newPositions = GraphAlgorithms.autoLayout(
      state.graph.nodes,
      state.graph.connections
    );

    const updatedNodes = state.graph.nodes.map((node) => ({
      ...node,
      position: newPositions.get(node.id) || node.position,
      updatedAt: new Date(),
    }));

    const newGraph = {
      ...state.graph,
      nodes: updatedNodes,
      updatedAt: new Date(),
    };

    dispatch({ type: "LOAD_GRAPH", payload: { graph: newGraph } });
  }, [state.graph]);

  const findPath = useCallback(
    (startNodeId: string, endNodeId: string) => {
      if (!state.graph) return null;

      const {
        GraphAlgorithms,
      } = require("@/lib/engine/algorithms/graph-algorithms");
      return GraphAlgorithms.findPath(
        startNodeId,
        endNodeId,
        state.graph.nodes,
        state.graph.connections
      );
    },
    [state.graph]
  );

  const getGraphStats = useCallback(() => {
    if (!state.graph) return null;

    const {
      GraphAlgorithms,
    } = require("@/lib/engine/algorithms/graph-algorithms");
    return GraphAlgorithms.getGraphStats(
      state.graph.nodes,
      state.graph.connections
    );
  }, [state.graph]);

  const contextValue: GraphContextType = {
    state,
    dispatch,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    loadFloorplan,
    updateFloorplanBounds,
    setSelectedNode,
    setSelectedConnection,
    updateSettings,
    setTool,
    setConnectingStart,
    setConnectingEnd,
    loadGraph,
    resetGraph,
    undo,
    redo,
    setPanoramaNode,
    togglePanoramaViewer,
    autoLayout,
    findPath,
    getGraphStats,
    selectedNode,
    selectedConnection,
    panoramaNode,
    canUndo,
    canRedo,
    validateGraph,
    saveGraph,
  };

  return (
    <GraphContext.Provider value={contextValue}>
      {children}
    </GraphContext.Provider>
  );
}

// Hook to use the context
export function useGraph(): GraphContextType {
  const context = useContext(GraphContext);
  if (context === undefined) {
    throw new Error("useGraph must be used within a GraphProvider");
  }
  return context;
}

// Export types for convenience
export type { GraphAction, GraphState };

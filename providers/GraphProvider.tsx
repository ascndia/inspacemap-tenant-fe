// providers/GraphProvider.tsx
"use client";

import React, { ReactNode } from "react";
import {
  useGraphData,
  useUpdateNode,
  useAddNode,
  useDeleteNode,
  useAddConnection,
  useDeleteConnection,
  useUpdateFloorplan,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  useSetAreaStartNode,
} from "@/hooks/useGraphData";
import { useGraphStore } from "../stores/graph-store";
import { GraphNode, Vector3, GraphData } from "@/types/graph";

// Context to provide IDs to child components
interface GraphContextValue {
  venueId?: string;
  revisionId?: string;
  floorId?: string;
}

const GraphContext = React.createContext<GraphContextValue | null>(null);

interface GraphProviderProps {
  children: ReactNode;
  venueId?: string;
  revisionId?: string;
  floorId?: string;
  autoSave?: boolean;
}

export function GraphProvider({
  children,
  venueId,
  revisionId,
  floorId,
  autoSave = true,
}: GraphProviderProps) {
  // Store the IDs for use in mutations
  const [currentVenueId, setCurrentVenueId] = React.useState(venueId);
  const [currentRevisionId, setCurrentRevisionId] = React.useState(revisionId);
  const [currentFloorId, setCurrentFloorId] = React.useState(floorId);

  // Update stored IDs when props change
  React.useEffect(() => {
    setCurrentVenueId(venueId);
    setCurrentRevisionId(revisionId);
    setCurrentFloorId(floorId);
  }, [venueId, revisionId, floorId]);

  // Load graph data using React Query
  const {
    data: graph,
    isLoading,
    error,
  } = useGraphData(
    currentVenueId || "",
    currentRevisionId || "",
    currentFloorId || ""
  );

  // Update Zustand store with graph data and states
  React.useEffect(() => {
    useGraphStore.setState({
      graph: (graph as GraphData) || null,
      isLoading,
      error: error?.message || null,
      lastSynced: (graph as GraphData)?.updatedAt || null,
    });
  }, [graph, isLoading, error]);

  const contextValue: GraphContextValue = {
    venueId: currentVenueId,
    revisionId: currentRevisionId,
    floorId: currentFloorId,
  };

  return (
    <GraphContext.Provider value={contextValue}>
      {children}
    </GraphContext.Provider>
  );
}

// Hook to use graph context
export function useGraphContext() {
  const context = React.useContext(GraphContext);
  if (!context) {
    throw new Error("useGraphContext must be used within a GraphProvider");
  }
  return context;
}

// Hook to use graph operations with React Query integration
export function useGraph() {
  const store = useGraphStore();
  const context = React.useContext(GraphContext);

  if (!context) {
    throw new Error("useGraph must be used within a GraphProvider");
  }

  const { venueId, revisionId, floorId } = context;

  // React Query mutations
  const updateNodeMutation = useUpdateNode();
  const addNodeMutation = useAddNode();
  const deleteNodeMutation = useDeleteNode();
  const addConnectionMutation = useAddConnection();
  const deleteConnectionMutation = useDeleteConnection();
  const updateFloorplanMutation = useUpdateFloorplan();
  const createAreaMutation = useCreateArea();
  const updateAreaMutation = useUpdateArea();
  const deleteAreaMutation = useDeleteArea();
  const setAreaStartNodeMutation = useSetAreaStartNode();

  return {
    // State from Zustand store
    ...store,

    // Enhanced operations with React Query
    updateNode: async (nodeId: string, updates: Partial<GraphNode>) => {
      try {
        await updateNodeMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          nodeId,
          updates,
        });
      } catch (error) {
        throw error;
      }
    },

    addNode: async (position: Vector3, attributes?: Partial<GraphNode>) => {
      try {
        await addNodeMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          position,
          attributes,
        });
      } catch (error) {
        throw error;
      }
    },

    deleteNode: async (nodeId: string) => {
      try {
        await deleteNodeMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          nodeId,
        });
      } catch (error) {
        throw error;
      }
    },

    addConnection: async (fromNodeId: string, toNodeId: string) => {
      try {
        await addConnectionMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          fromNodeId,
          toNodeId,
        });
      } catch (error) {
        throw error;
      }
    },

    deleteConnection: async (connectionId: string) => {
      try {
        await deleteConnectionMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          connectionId,
        });
      } catch (error) {
        throw error;
      }
    },

    updateFloorplan: async (floorplanData: {
      map_image_id?: string;
      pixels_per_meter?: number;
      map_width?: number;
      map_height?: number;
    }) => {
      try {
        await updateFloorplanMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          floorplanData,
        });
      } catch (error) {
        throw error;
      }
    },

    createArea: async (areaData: {
      name: string;
      description?: string;
      category: string;
      boundary: { x: number; y: number }[];
      cover_image_id?: string;
      gallery?: any[];
    }) => {
      try {
        await createAreaMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          areaData,
        });
      } catch (error) {
        throw error;
      }
    },

    updateArea: async (areaId: string, updates: any) => {
      try {
        await updateAreaMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          areaId,
          updates,
        });
      } catch (error) {
        throw error;
      }
    },

    deleteArea: async (areaId: string) => {
      try {
        await deleteAreaMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          areaId,
        });
      } catch (error) {
        throw error;
      }
    },

    setAreaStartNode: async (areaId: string, nodeId: string | null) => {
      try {
        await setAreaStartNodeMutation.mutateAsync({
          venueId: venueId || "",
          revisionId: revisionId || "",
          floorId: floorId || "",
          areaId,
          nodeId,
        });
      } catch (error) {
        throw error;
      }
    },
  };
}

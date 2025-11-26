// hooks/useGraphData.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraphService } from "@/lib/services/graph-service";
import {
  GraphData,
  GraphNode,
  Vector3,
  Area,
  BoundaryPoint,
} from "@/types/graph";
import { useGraphStore } from "../stores/graph-store";
import React from "react";

// Query Keys
export const graphKeys = {
  all: ["graph"] as const,
  venue: (venueId: string) => [...graphKeys.all, "venue", venueId] as const,
  revision: (venueId: string, revisionId: string) =>
    [...graphKeys.venue(venueId), "revision", revisionId] as const,
  floor: (venueId: string, revisionId: string, floorId: string) =>
    [...graphKeys.revision(venueId, revisionId), "floor", floorId] as const,
};

// Load Graph Data Hook
export function useGraphData(
  venueId: string,
  revisionId: string,
  floorId: string
) {
  const setGraph = useGraphStore((state) => state.setGraph);
  const setLoading = useGraphStore((state) => state.setLoading);
  const setError = useGraphStore((state) => state.setError);

  const query = useQuery({
    queryKey: graphKeys.floor(venueId, revisionId, floorId),
    queryFn: async (): Promise<GraphData> => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      return await graphService.loadGraph();
    },
    enabled: !!(venueId && revisionId && floorId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update Zustand store when data changes
  React.useEffect(() => {
    if (query.data) {
      setGraph(query.data);
    }
    setLoading(query.isLoading);
    if (query.error) {
      setError((query.error as Error).message || "Failed to load graph data");
    }
  }, [
    query.data,
    query.isLoading,
    query.error,
    setGraph,
    setLoading,
    setError,
  ]);

  return query;
}

// Update Node Mutation
export function useUpdateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      nodeId,
      updates,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      nodeId: string;
      updates: Partial<GraphNode>;
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      await graphService.updateNode(nodeId, updates);
      return { nodeId, updates };
    },
    onSuccess: (data, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          return {
            ...oldData,
            nodes: oldData.nodes.map((node) =>
              node.id === variables.nodeId
                ? { ...node, ...variables.updates }
                : node
            ),
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Add Node Mutation
export function useAddNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      position,
      attributes,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      position: Vector3;
      attributes?: Partial<GraphNode>;
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      const newNode = await graphService.createNode(position, attributes);
      return newNode;
    },
    onSuccess: (newNode, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          return {
            ...oldData,
            nodes: [...oldData.nodes, newNode],
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Delete Node Mutation
export function useDeleteNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      nodeId,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      nodeId: string;
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      await graphService.deleteNode(nodeId);
      return nodeId;
    },
    onSuccess: (deletedNodeId, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          return {
            ...oldData,
            nodes: oldData.nodes.filter((node) => node.id !== deletedNodeId),
            connections: oldData.connections.filter(
              (conn) =>
                conn.fromNodeId !== deletedNodeId &&
                conn.toNodeId !== deletedNodeId
            ),
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Add Connection Mutation
export function useAddConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      fromNodeId,
      toNodeId,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      fromNodeId: string;
      toNodeId: string;
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      const newConnection = await graphService.createConnection(
        fromNodeId,
        toNodeId
      );
      return newConnection;
    },
    onSuccess: (newConnection, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          return {
            ...oldData,
            connections: [...oldData.connections, newConnection],
            // Update nodes with new connection references
            nodes: oldData.nodes.map((node) => {
              if (
                node.id === newConnection.fromNodeId ||
                node.id === newConnection.toNodeId
              ) {
                return {
                  ...node,
                  connections: [...node.connections, newConnection.id],
                };
              }
              return node;
            }),
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Delete Connection Mutation
export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      connectionId,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      connectionId: string;
    }) => {
      // Get the current graph data to find the connection
      const graphData = queryClient.getQueryData(
        graphKeys.floor(venueId, revisionId, floorId)
      ) as GraphData | undefined;

      if (!graphData) {
        throw new Error("Graph data not found");
      }

      const connection = graphData.connections.find(
        (c) => c.id === connectionId
      );
      if (!connection) {
        throw new Error("Connection not found");
      }

      // Use GraphRevisionService to delete the connection
      await GraphRevisionService.deleteConnection(
        connection.fromNodeId,
        connection.toNodeId
      );

      return connectionId;
    },
    onSuccess: (deletedConnectionId, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          const deletedConnection = oldData.connections.find(
            (c) => c.id === deletedConnectionId
          );
          return {
            ...oldData,
            connections: oldData.connections.filter(
              (c) => c.id !== deletedConnectionId
            ),
            // Remove connection references from nodes
            nodes: oldData.nodes.map((node) => {
              if (
                deletedConnection &&
                (node.id === deletedConnection.fromNodeId ||
                  node.id === deletedConnection.toNodeId)
              ) {
                return {
                  ...node,
                  connections: node.connections.filter(
                    (connId) => connId !== deletedConnectionId
                  ),
                };
              }
              return node;
            }),
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Update Floorplan Mutation
export function useUpdateFloorplan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      floorplanData,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      floorplanData: {
        map_image_id?: string;
        pixels_per_meter?: number;
        map_width?: number;
        map_height?: number;
      };
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      await graphService.updateFloorplan(floorplanData);
      return floorplanData;
    },
    onSuccess: (floorplanData, variables) => {
      // Invalidate the query to refetch the updated graph data
      queryClient.invalidateQueries({
        queryKey: graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
      });
    },
  });
}

// Load All Areas for Revision Hook
export function useAllAreas(venueId: string, revisionId: string) {
  const query = useQuery({
    queryKey: [...graphKeys.revision(venueId, revisionId), "all-areas"],
    queryFn: async (): Promise<Area[]> => {
      const response = await GraphRevisionService.getGraphData(revisionId);
      const allAreas: Area[] = [];

      response.floors?.forEach((floor: any) => {
        floor.areas?.forEach((area: any) => {
          allAreas.push({
            id: area.id,
            floorId: floor.id,
            name: area.name,
            description: area.description,
            category: area.category,
            latitude: area.latitude,
            longitude: area.longitude,
            boundary: area.boundary,
            start_node_id: area.start_node_id,
            cover_image_id: area.cover_image_url,
            gallery: area.gallery?.map((item: any) => ({
              media_asset_id: item.media_id,
              sort_order: item.sort_order,
              caption: item.caption,
              is_visible: true,
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
      });

      return allAreas;
    },
    enabled: !!(venueId && revisionId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return query;
}

// Create Area Mutation
export function useCreateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      areaData,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      areaData: {
        name: string;
        description?: string;
        category: string;
        boundary: BoundaryPoint[];
        cover_image_id?: string;
        gallery?: any[];
      };
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      const newArea = await graphService.createArea(areaData);
      return newArea;
    },
    onSuccess: (newArea, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          return {
            ...oldData,
            areas: [...oldData.areas, newArea],
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Update Area Mutation
export function useUpdateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      areaId,
      updates,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      areaId: string;
      updates: Partial<Area>;
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      await graphService.updateArea(areaId, updates);
      return { areaId, updates };
    },
    onSuccess: (data, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          return {
            ...oldData,
            areas: oldData.areas.map((area) =>
              area.id === variables.areaId
                ? { ...area, ...variables.updates }
                : area
            ),
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Delete Area Mutation
export function useDeleteArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      areaId,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      areaId: string;
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      await graphService.deleteArea(areaId);
      return areaId;
    },
    onSuccess: (deletedAreaId, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          return {
            ...oldData,
            areas: oldData.areas.filter((area) => area.id !== deletedAreaId),
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Set Area Start Node Mutation
export function useSetAreaStartNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      venueId,
      revisionId,
      floorId,
      areaId,
      nodeId,
    }: {
      venueId: string;
      revisionId: string;
      floorId: string;
      areaId: string;
      nodeId: string | null;
    }) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      await graphService.setAreaStartNode(areaId, nodeId);
      return { areaId, nodeId };
    },
    onSuccess: (data, variables) => {
      // Update the cache directly instead of invalidating
      queryClient.setQueryData(
        graphKeys.floor(
          variables.venueId,
          variables.revisionId,
          variables.floorId
        ),
        (oldData: GraphData | undefined) => {
          if (!oldData) return oldData;
          const currentGraph = useGraphStore.getState().graph;
          return {
            ...oldData,
            areas: oldData.areas.map((area) =>
              area.id === variables.areaId
                ? { ...area, start_node_id: variables.nodeId }
                : area
            ),
            settings: currentGraph?.settings || oldData.settings,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

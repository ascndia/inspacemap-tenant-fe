// hooks/useGraphData.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraphService } from "@/lib/services/graph-service";
import { GraphData, GraphNode, Vector3 } from "@/types/graph";
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
          return {
            ...oldData,
            nodes: oldData.nodes.map((node) =>
              node.id === variables.nodeId
                ? { ...node, ...variables.updates }
                : node
            ),
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
          return {
            ...oldData,
            nodes: [...oldData.nodes, newNode],
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
          return {
            ...oldData,
            nodes: oldData.nodes.filter((node) => node.id !== deletedNodeId),
            connections: oldData.connections.filter(
              (conn) =>
                conn.fromNodeId !== deletedNodeId &&
                conn.toNodeId !== deletedNodeId
            ),
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
      // Note: This needs to be implemented in GraphService
      // For now, we'll use the GraphRevisionService directly
      const graphService = new GraphService(venueId, revisionId, floorId);
      // await graphService.deleteConnection(connectionId);
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
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
  });
}

// Auto-save Hook
export function useAutoSave(
  venueId: string,
  revisionId: string,
  floorId: string
) {
  const graph = useGraphStore((state) => state.graph);
  const queryClient = useQueryClient();

  const { mutate: saveGraph } = useMutation({
    mutationFn: async (graphData: GraphData) => {
      const graphService = new GraphService(venueId, revisionId, floorId);
      await graphService.saveGraph(graphData);
    },
    onSuccess: () => {
      // Update last synced timestamp
      useGraphStore.setState({ lastSynced: new Date() });
    },
  });

  // Auto-save effect
  React.useEffect(() => {
    if (!graph || !venueId || !revisionId || !floorId) return;

    const timeout = setTimeout(() => {
      saveGraph(graph);
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [graph, venueId, revisionId, floorId, saveGraph]);
}

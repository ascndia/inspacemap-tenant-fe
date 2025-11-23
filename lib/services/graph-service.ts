"use client";

import { GraphRevisionService } from "./graph-revision-service";
import type {
  GraphData,
  GraphNode,
  GraphConnection,
  Vector3,
  Floorplan,
} from "@/types/graph";

export class GraphService {
  private venueId: string;
  private revisionId: string;
  private floorId: string;

  constructor(venueId: string, revisionId: string, floorId: string) {
    this.venueId = venueId;
    this.revisionId = revisionId;
    this.floorId = floorId;
  }

  /**
   * Load graph data from the backend
   */
  async loadGraph(): Promise<GraphData> {
    try {
      const response = await GraphRevisionService.getGraphData(this.venueId);

      // Find the specific floor data
      const floorData = response.floors?.find(
        (floor: any) => floor.id === this.floorId
      );

      if (!floorData) {
        // Floor not found, return empty graph
        return this.createEmptyGraph();
      }

      // Create floorplan object from floor data
      let floorplan: Floorplan | undefined;
      if (floorData.map_image_url) {
        floorplan = {
          id: `floorplan-${this.floorId}`,
          venueId: this.venueId,
          floorId: this.floorId,
          name: floorData.name || `Floor ${floorData.level_index}`,
          fileUrl: floorData.map_image_url
            ?.replace("localhost:9000", "localhost:9002")
            ?.replace("minio_dev:9000", "localhost:9002"), // Apply port fix for development
          scale: 1, // Use consistent scale for all floorplans
          bounds: {
            width: floorData.map_width || 1000,
            height: floorData.map_height || 1000,
            minX: -(floorData.map_width || 1000) / 2,
            minY: -(floorData.map_height || 1000) / 2,
            maxX: (floorData.map_width || 1000) / 2,
            maxY: (floorData.map_height || 1000) / 2,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Transform API response to GraphData format
      const nodes: GraphNode[] =
        floorData.nodes?.map((node: any) => ({
          id: node.id,
          position: { x: node.x, y: node.y, z: 0 },
          rotation: node.rotation_offset || 0,
          pitch: 0,
          heading: 0,
          fov: 75,
          connections:
            node.neighbors?.map((neighbor: any) => neighbor.target_node_id) ||
            [],
          panorama_url: node.panorama_url?.replace("localhost:9000", "localhost:9002")?.replace("minio_dev:9000", "localhost:9002"), // Apply port fix for development
          label: node.area_name || `Node ${node.id.slice(-4)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) || [];

      const connections: GraphConnection[] = [];
      floorData.nodes?.forEach((node: any) => {
        node.neighbors?.forEach((neighbor: any) => {
          // Avoid duplicate connections
          const existingConnection = connections.find(
            (conn) =>
              (conn.fromNodeId === node.id &&
                conn.toNodeId === neighbor.target_node_id) ||
              (conn.fromNodeId === neighbor.target_node_id &&
                conn.toNodeId === node.id)
          );

          if (!existingConnection) {
            connections.push({
              id: `conn-${node.id}-${neighbor.target_node_id}`,
              fromNodeId: node.id,
              toNodeId: neighbor.target_node_id,
              distance: neighbor.distance,
              bidirectional: neighbor.is_active,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      });

      return {
        id: `graph-${this.venueId}-${this.floorId}`,
        venueId: this.venueId,
        floorId: this.floorId,
        name: floorData.level_name || `Floor ${this.floorId}`,
        nodes,
        connections,
        floorplan, // Include floorplan data
        panoramas: [],
        settings: {
          gridSize: 20,
          snapToGrid: true,
          showGrid: true,
          showLabels: true,
          showConnections: true,
          connectionStyle: "straight",
          nodeSize: 1,
          autoSave: true,
          collaboration: false,
          floorplanOpacity: 0.5,
        },
        version: 1,
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Failed to load graph:", error);
      // Return a default empty graph
      return this.createEmptyGraph();
    }
  }

  /**
   * Save graph data to the backend
   */
  async saveGraph(graphData: GraphData): Promise<GraphData> {
    // According to the API guide, there's no bulk save operation
    // Graph data is saved through individual node/connection operations
    // This method is kept for compatibility but doesn't perform any API calls
    console.log(
      "Graph data is saved through individual operations, not bulk save"
    );
    return graphData;
  }

  /**
   * Create a new node
   */
  async createNode(
    position: Vector3,
    attributes?: Partial<GraphNode>
  ): Promise<GraphNode> {
    try {
      // Format data according to API guide
      const apiNodeData: any = {
        floor_id: this.floorId,
        x: position.x,
        y: position.y,
        label: attributes?.label || `Node ${position.x},${position.y}`,
      };

      // Only include panorama_asset_id if it exists
      if (attributes?.panorama_asset_id) {
        apiNodeData.panorama_asset_id = attributes.panorama_asset_id;
      }

      console.log("Creating node with data:", apiNodeData); // Debug log

      const createdNode = await GraphRevisionService.createNode(
        this.revisionId,
        this.floorId,
        apiNodeData
      );

      // Return the created node in our internal format
      return {
        id: createdNode.id,
        position,
        rotation: attributes?.rotation || 0,
        pitch: attributes?.pitch || 0,
        heading: attributes?.heading || 0,
        fov: attributes?.fov || 75,
        connections: [],
        panorama_asset_id: attributes?.panorama_asset_id,
        label: attributes?.label || `Node ${createdNode.id.slice(0, 4)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Failed to create node:", error);
      // Fallback: create node locally
      const fallbackId = crypto.randomUUID();
      return {
        id: fallbackId,
        position,
        rotation: 0,
        pitch: 0,
        heading: 0,
        fov: 75,
        connections: [],
        label: `Node ${fallbackId.slice(0, 4)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...attributes,
      };
    }
  }

  /**
   * Update an existing node
   */
  async updateNode(nodeId: string, updates: Partial<GraphNode>): Promise<void> {
    try {
      // Transform updates to API format
      const apiUpdates: any = {};

      // Remove updatedAt from API request - API doesn't expect it
      const { updatedAt, ...nodeUpdates } = updates;

      // Map position to x, y
      if (nodeUpdates.position) {
        apiUpdates.x = nodeUpdates.position.x;
        apiUpdates.y = nodeUpdates.position.y;
      }

      // Map rotation to rotation_offset
      if (nodeUpdates.rotation !== undefined) {
        apiUpdates.rotation_offset = nodeUpdates.rotation;
      }

      // Keep other fields that match API (only if they have valid values)
      if (nodeUpdates.panorama_asset_id !== undefined && nodeUpdates.panorama_asset_id !== "" && nodeUpdates.panorama_asset_id !== "null" && nodeUpdates.panorama_asset_id !== null) {
        apiUpdates.panorama_asset_id = nodeUpdates.panorama_asset_id;
      }

      if (nodeUpdates.label !== undefined && nodeUpdates.label !== "" && nodeUpdates.label !== "null" && nodeUpdates.label !== null) {
        apiUpdates.label = nodeUpdates.label;
      }

      // Don't make API call if no valid fields to update
      if (Object.keys(apiUpdates).length === 0) {
        console.log("No valid API fields to update for node:", nodeId);
        return;
      }

      console.log("Updating node:", nodeId, "with data:", apiUpdates); // Debug log
      console.log("Original updates:", updates); // Debug log
      console.log("Node updates after filtering:", nodeUpdates); // Debug log

      await GraphRevisionService.updateNode(
        this.revisionId,
        this.floorId,
        nodeId,
        apiUpdates
      );
    } catch (error) {
      console.error("Failed to update node:", error);
      throw error;
    }
  }

  /**
   * Delete a node
   */
  async deleteNode(nodeId: string): Promise<void> {
    try {
      await GraphRevisionService.deleteNode(
        this.revisionId,
        this.floorId,
        nodeId
      );
    } catch (error) {
      console.error("Failed to delete node:", error);
      throw error;
    }
  }

  /**
   * Create a new connection
   */
  async createConnection(
    fromNodeId: string,
    toNodeId: string
  ): Promise<GraphConnection> {
    try {
      // Format data according to API guide
      const connectionData = {
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
      };

      const createdConnection = await GraphRevisionService.createConnection(
        this.revisionId,
        this.floorId,
        connectionData
      );

      // Return the created connection in our internal format
      return {
        id: createdConnection.id,
        fromNodeId,
        toNodeId,
        distance: 0, // Will be calculated by the graph context
        bidirectional: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Failed to create connection:", error);
      // Fallback: create connection locally
      return {
        id: crypto.randomUUID(),
        fromNodeId,
        toNodeId,
        distance: 0, // Will be calculated by the graph context
        bidirectional: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Update floorplan for a floor
   */
  async updateFloorplan(floorplanData: {
    map_image_id?: string;
    pixels_per_meter?: number;
    map_width?: number;
    map_height?: number;
  }): Promise<any> {
    try {
      const response = await GraphRevisionService.updateFloor(
        this.floorId,
        floorplanData
      );
      return response;
    } catch (error) {
      console.error("Failed to update floorplan:", error);
      throw error;
    }
  }

  /**
   * Create an empty graph structure
   */
  private createEmptyGraph(): GraphData {
    return {
      id: `graph-${this.venueId}-${this.floorId}`,
      venueId: this.venueId,
      floorId: this.floorId,
      name: `Graph for ${this.floorId}`,
      nodes: [],
      connections: [],
      panoramas: [],
      settings: {
        gridSize: 20,
        snapToGrid: true,
        showGrid: true,
        showLabels: true,
        showConnections: true,
        connectionStyle: "straight",
        nodeSize: 1,
        autoSave: true,
        collaboration: false,
        floorplanOpacity: 0.5,
      },
      version: 1,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

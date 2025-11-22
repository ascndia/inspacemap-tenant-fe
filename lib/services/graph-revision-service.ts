"use client";

import {
  createDraftRevision,
  listRevisions,
  getRevisionDetail,
  deleteRevision,
  getGraphData,
  createGraphNode,
  updateGraphNode,
  updateNodePosition,
  calibrateNode,
  deleteGraphNode,
  createGraphConnection,
  deleteGraphConnection,
  createFloor,
} from "@/lib/api";
import type {
  GraphRevision,
  GraphRevisionDetail,
  CreateDraftRevisionResponse,
  ListRevisionsResponse,
  GetRevisionDetailResponse,
  DeleteRevisionResponse,
  GraphData,
  GraphNode,
  GraphConnection,
  Vector3,
} from "@/types/graph";

export class GraphRevisionService {
  /**
   * Create a new draft revision for a venue
   */
  static async createDraftRevision(
    venueId: string,
    note?: string
  ): Promise<string> {
    try {
      const response: CreateDraftRevisionResponse = await createDraftRevision(
        venueId,
        note
      );
      return response.data.id;
    } catch (error) {
      console.error("Failed to create draft revision:", error);
      throw new Error("Failed to create draft revision");
    }
  }

  /**
   * Get all revisions for a venue
   */
  static async getRevisions(venueId: string): Promise<GraphRevision[]> {
    try {
      const response: ListRevisionsResponse = await listRevisions(venueId);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch revisions:", error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Get detailed information about a specific revision
   */
  static async getRevisionDetail(
    revisionId: string
  ): Promise<GraphRevisionDetail> {
    try {
      const response: GetRevisionDetailResponse = await getRevisionDetail(
        revisionId
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch revision detail:", error);
      throw new Error("Failed to fetch revision detail");
    }
  }

  /**
   * Delete a draft revision
   */
  static async deleteRevision(revisionId: string): Promise<string> {
    try {
      const response: DeleteRevisionResponse = await deleteRevision(revisionId);
      return response.data;
    } catch (error) {
      console.error("Failed to delete revision:", error);
      throw new Error("Failed to delete revision");
    }
  }

  /**
   * Save graph data for a revision (placeholder - backend implementation needed)
   */
  static async saveRevisionGraph(
    revisionId: string,
    graphData: any
  ): Promise<void> {
    // TODO: Implement when backend API is available
    console.log("Saving revision graph:", revisionId, graphData);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * Publish a draft revision (placeholder - backend implementation needed)
   */
  static async publishRevision(revisionId: string): Promise<void> {
    // TODO: Implement when backend API is available
    console.log("Publishing revision:", revisionId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * Get graph data for a venue (all floors and their nodes/connections)
   */
  static async getGraphData(venueId: string): Promise<any> {
    try {
      const response = await getGraphData(venueId);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
      // Return empty graph as fallback
      return {
        venue_id: venueId,
        venue_name: "Unknown Venue",
        last_updated: new Date().toISOString(),
        start_node_id: "00000000-0000-0000-0000-000000000000",
        floors: [],
      };
    }
  }

  /**
   * Create a new node in the graph
   */
  static async createNode(
    revisionId: string,
    floorId: string,
    nodeData: any
  ): Promise<any> {
    try {
      const response = await createGraphNode(revisionId, floorId, nodeData);
      return response.data;
    } catch (error) {
      console.error("Failed to create node:", error);
      throw new Error("Failed to create node");
    }
  }

  /**
   * Update an existing node in the graph
   */
  static async updateNode(
    revisionId: string,
    floorId: string,
    nodeId: string,
    nodeData: any
  ): Promise<any> {
    try {
      // Check what type of update this is
      if (
        nodeData.position &&
        Object.keys(nodeData).length === 2 &&
        nodeData.updatedAt
      ) {
        // Position update
        const response = await updateNodePosition(
          nodeId,
          nodeData.position.x,
          nodeData.position.y
        );
        return response.data;
      } else if (
        nodeData.rotation !== undefined &&
        Object.keys(nodeData).length === 2 &&
        nodeData.updatedAt
      ) {
        // Calibration update
        const response = await calibrateNode(nodeId, nodeData.rotation);
        return response.data;
      } else {
        // General update - use the generic endpoint
        const response = await updateGraphNode(
          revisionId,
          floorId,
          nodeId,
          nodeData
        );
        return response.data;
      }
    } catch (error) {
      console.error("Failed to update node:", error);
      throw new Error("Failed to update node");
    }
  }

  /**
   * Delete a node from the graph
   */
  static async deleteNode(
    revisionId: string,
    floorId: string,
    nodeId: string
  ): Promise<any> {
    try {
      const response = await deleteGraphNode(revisionId, floorId, nodeId);
      return response.data;
    } catch (error) {
      console.error("Failed to delete node:", error);
      throw new Error("Failed to delete node");
    }
  }

  /**
   * Create a new connection in the graph
   */
  static async createConnection(
    revisionId: string,
    floorId: string,
    connectionData: any
  ): Promise<any> {
    try {
      const response = await createGraphConnection(
        revisionId,
        floorId,
        connectionData
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create connection:", error);
      throw new Error("Failed to create connection");
    }
  }

  /**
   * Delete a connection from the graph
   */
  static async deleteConnection(
    fromNodeId: string,
    toNodeId: string
  ): Promise<any> {
    try {
      const response = await deleteGraphConnection(fromNodeId, toNodeId);
      return response.data;
    } catch (error) {
      console.error("Failed to delete connection:", error);
      throw new Error("Failed to delete connection");
    }
  }

  /**
   * Create a new floor in a venue revision
   */
  static async createFloor(
    venueId: string,
    floorData: {
      name: string;
      level_index: number;
      map_image_id?: string;
      pixels_per_meter?: number;
      map_width?: number;
      map_height?: number;
    }
  ): Promise<any> {
    try {
      const response = await createFloor(venueId, floorData);
      return response.data;
    } catch (error) {
      console.error("Failed to create floor:", error);
      throw new Error("Failed to create floor");
    }
  }
}

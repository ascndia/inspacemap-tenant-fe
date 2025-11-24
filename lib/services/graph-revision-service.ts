"use client";

import {
  createDraftRevision,
  listRevisions,
  getRevisionDetail,
  deleteRevision,
  updateRevision,
  publishRevision,
  getGraphData,
  createGraphNode,
  updateGraphNode,
  updateNodePosition,
  calibrateNode,
  deleteGraphNode,
  createGraphConnection,
  deleteGraphConnection,
  createFloor,
  updateFloor,
  deleteFloor,
  getFloors,
  getFloor,
} from "@/lib/api";
import type {
  GraphRevision,
  GraphRevisionDetail,
  CreateDraftRevisionResponse,
  ListRevisionsResponse,
  GetRevisionDetailResponse,
  DeleteRevisionResponse,
  UpdateRevisionResponse,
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
    } catch (error: any) {
      // Handle 400 errors as validation messages (e.g., "draft already exists")
      if (error.response?.status === 400) {
        console.warn("Draft creation validation error:", error.response.data);
        throw new Error(
          error.response.data?.error || "Cannot create draft revision"
        );
      }
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
    } catch (error: any) {
      // Handle 400 errors as validation messages (e.g., "only draft revisions can be deleted")
      if (error.response?.status === 400) {
        console.warn(
          "Revision deletion validation error:",
          error.response.data
        );
        throw new Error(error.response.data?.error || "Cannot delete revision");
      }
      console.error("Failed to delete revision:", error);
      throw new Error("Failed to delete revision");
    }
  }

  /**
   * Update revision metadata (notes)
   */
  static async updateRevision(
    revisionId: string,
    updateData: { note: string }
  ): Promise<string> {
    try {
      const response = await updateRevision(revisionId, updateData);
      if (!response.success) {
        throw new Error(response.error || "Failed to update revision");
      }
      return response.data;
    } catch (error: any) {
      // Handle 400 errors as validation messages
      if (error.response?.status === 400) {
        console.warn("Revision update validation error:", error.response.data);
        throw new Error(
          error.response.data?.error || "Invalid revision update"
        );
      }
      console.error("Failed to update revision:", error);
      throw new Error("Failed to update revision");
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
  static async publishRevision(
    revisionId: string,
    note?: string
  ): Promise<string> {
    try {
      const response = await publishRevision(revisionId, note);
      if (!response.success) {
        throw new Error(response.error || "Failed to publish revision");
      }
      return response.data;
    } catch (error: any) {
      // Handle 400 errors as validation messages (e.g., "no draft revision found to publish")
      if (error.response?.status === 400) {
        console.warn("Revision publish validation error:", error.response.data);
        throw new Error(
          error.response.data?.error || "Cannot publish revision"
        );
      }
      console.error("Failed to publish revision:", error);
      throw new Error("Failed to publish revision");
    }
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
  ): Promise<void> {
    try {
      console.log("GraphRevisionService.updateNode called with:", {
        revisionId,
        floorId,
        nodeId,
        nodeData,
        keys: Object.keys(nodeData),
        keysLength: Object.keys(nodeData).length,
      }); // Debug log

      // Check what type of update this is
      const keys = Object.keys(nodeData);

      if (keys.length === 2 && keys.includes("x") && keys.includes("y")) {
        // Position update
        console.log("Using position update path"); // Debug log
        await updateNodePosition(nodeId, nodeData.x, nodeData.y);
      } else if (keys.length === 1 && keys.includes("rotation_offset")) {
        // Calibration update
        console.log("Using calibration update path"); // Debug log
        await calibrateNode(nodeId, nodeData.rotation_offset);
      } else {
        // General update - use the generic endpoint
        console.log("Using general update path with nodeData:", nodeData); // Debug log
        const response = await updateGraphNode(
          revisionId,
          floorId,
          nodeId,
          nodeData
        );
        if (!response.success) {
          throw new Error(response.error || "Failed to update node");
        }
      }
    } catch (error: any) {
      // Handle 400 errors as validation messages, not system errors
      if (error.response?.status === 400) {
        console.warn("Node update validation error:", error.response.data);
        throw new Error(error.response.data?.error || "Invalid node update");
      }

      // Log detailed error information for debugging
      console.error("Failed to update node:", {
        nodeId,
        nodeData,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        stack: error.stack,
      });

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

  /**
   * Update an existing floor
   */
  static async updateFloor(
    floorId: string,
    floorData: {
      name?: string;
      level_index?: number;
      map_image_id?: string;
      pixels_per_meter?: number;
      map_width?: number;
      map_height?: number;
      is_active?: boolean;
    }
  ): Promise<any> {
    try {
      const response = await updateFloor(floorId, floorData);
      return response.data;
    } catch (error) {
      console.error("Failed to update floor:", error);
      throw new Error("Failed to update floor");
    }
  }

  /**
   * Delete a floor from the venue revision
   */
  static async deleteFloor(floorId: string): Promise<any> {
    try {
      const response = await deleteFloor(floorId);
      return response.data;
    } catch (error) {
      console.error("Failed to delete floor:", error);
      throw new Error("Failed to delete floor");
    }
  }

  /**
   * Get all floors for a venue (without detailed node data)
   */
  static async getFloors(venueId: string): Promise<any> {
    try {
      const response = await getFloors(venueId);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch floors:", error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific floor
   */
  static async getFloor(floorId: string): Promise<any> {
    try {
      const response = await getFloor(floorId);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch floor:", error);
      throw new Error("Failed to fetch floor");
    }
  }
}

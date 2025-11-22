"use client";

import { GraphRevisionService } from "./graph-revision-service";
import type {
  GraphData,
  GraphNode,
  GraphConnection,
  Vector3,
} from "@/types/graph";

export class GraphService {
  private revisionId: string;
  private floorId: string;

  constructor(revisionId: string, floorId: string) {
    this.revisionId = revisionId;
    this.floorId = floorId;
  }

  /**
   * Load graph data from the backend
   */
  async loadGraph(): Promise<GraphData> {
    try {
      const graphData = await GraphRevisionService.getGraphData(
        this.revisionId,
        this.floorId
      );
      return graphData;
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
    try {
      const savedData = await GraphRevisionService.saveGraphData(
        this.revisionId,
        this.floorId,
        graphData
      );
      return savedData;
    } catch (error) {
      console.error("Failed to save graph:", error);
      throw error;
    }
  }

  /**
   * Create a new node
   */
  async createNode(
    position: Vector3,
    attributes?: Partial<GraphNode>
  ): Promise<GraphNode> {
    try {
      const nodeData = {
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

      const createdNode = await GraphRevisionService.createNode(
        this.revisionId,
        this.floorId,
        nodeData
      );
      return createdNode;
    } catch (error) {
      console.error("Failed to create node:", error);
      // Fallback: create node locally
      return {
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
  }

  /**
   * Update an existing node
   */
  async updateNode(
    nodeId: string,
    updates: Partial<GraphNode>
  ): Promise<GraphNode> {
    try {
      const updatedNode = await GraphRevisionService.updateNode(
        this.revisionId,
        this.floorId,
        nodeId,
        { ...updates, updatedAt: new Date() }
      );
      return updatedNode;
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
      const connectionData = {
        fromNodeId,
        toNodeId,
        bidirectional: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdConnection = await GraphRevisionService.createConnection(
        this.revisionId,
        this.floorId,
        connectionData
      );
      return createdConnection;
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
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    try {
      await GraphRevisionService.deleteConnection(
        this.revisionId,
        this.floorId,
        connectionId
      );
    } catch (error) {
      console.error("Failed to delete connection:", error);
      throw error;
    }
  }

  /**
   * Create an empty graph structure
   */
  private createEmptyGraph(): GraphData {
    return {
      id: `graph-${this.revisionId}-${this.floorId}`,
      venueId: this.revisionId.split("-")[1] || "venue-1",
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

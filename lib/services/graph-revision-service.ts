"use client";

import {
  createDraftRevision,
  listRevisions,
  getRevisionDetail,
  deleteRevision,
} from "@/lib/api";
import type {
  GraphRevision,
  GraphRevisionDetail,
  CreateDraftRevisionResponse,
  ListRevisionsResponse,
  GetRevisionDetailResponse,
  DeleteRevisionResponse,
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
}

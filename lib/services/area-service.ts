import api from "@/lib/api";

export interface AreaData {
  id: string;
  name: string;
  description?: string;
  category: string;
  latitude?: number;
  longitude?: number;
  boundary: BoundaryPoint[];
  cover_image_id?: string;
  gallery?: AreaGalleryItem[];
  start_node_id?: string;
  floor_id: string;
  created_at: string;
  updated_at: string;
}

export interface AreaEditorDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  boundary: BoundaryPoint[];
  start_node_id?: string;
  floor_id: string;
  floor_name: string;
  revision_id: string;
  cover_image_id?: string;
  cover_url: string;
  gallery: AreaGalleryDetail[];
  created_at: string;
  updated_at: string;
}

export interface AreaGalleryDetail {
  media_id: string;
  url: string;
  thumbnail_url: string;
  caption: string;
  sort_order: number;
}

export interface BoundaryPoint {
  x: number;
  y: number;
}

export interface AreaGalleryItem {
  media_asset_id: string;
  caption?: string;
  sort_order: number;
  is_visible: boolean;
  is_featured?: boolean;
}

export interface CreateAreaRequest {
  name: string;
  description?: string;
  category: string;
  latitude?: number;
  longitude?: number;
  boundary: BoundaryPoint[];
  cover_image_id?: string;
  gallery?: AreaGalleryItem[];
}

export interface UpdateAreaRequest {
  name?: string;
  description?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  boundary?: BoundaryPoint[];
  cover_image_id?: string;
  floor_id?: string;
}

export interface AreaSummary {
  id: string;
  name: string;
  description?: string;
  category: string;
  floor_id: string;
  floor_name: string;
  revision_id: string;
  cover_url?: string;
  gallery_count: number;
  created_at: string;
  updated_at: string;
}

class AreaService {
  /**
   * Get all areas for a venue
   */
  async getVenueAreas(
    venueId: string,
    params?: {
      revision_id?: string;
      floor_id?: string;
      status?: "published" | "draft" | "all";
      limit?: number;
      offset?: number;
      name?: string;
      category?: string;
    }
  ): Promise<{ success: boolean; data?: AreaSummary[]; error?: string }> {
    try {
      const response = await api.get(`/venues/${venueId}/areas`, { params });
      console.log("Areas API response:", response.data);
      console.log("Response status:", response.status);

      // Handle direct response structure: { areas: [...], total: number, limit: number, offset: number }
      if (
        response.data &&
        typeof response.data === "object" &&
        "areas" in response.data
      ) {
        const areas = response.data.areas;
        console.log("Areas value:", areas, "Type:", typeof areas);

        if (Array.isArray(areas)) {
          console.log("Returning areas array with", areas.length, "items");
          return {
            success: true,
            data: areas,
          };
        } else if (areas === null || areas === undefined) {
          console.log("Areas is null/undefined, returning empty array");
          return {
            success: true,
            data: [],
          };
        }
      }

      // Handle wrapped response structure: { success: true, data: { areas: [...] } }
      if (
        response.data?.success &&
        response.data?.data &&
        "areas" in response.data.data
      ) {
        const areas = response.data.data.areas;
        if (Array.isArray(areas)) {
          console.log(
            "Returning wrapped areas array with",
            areas.length,
            "items"
          );
          return {
            success: true,
            data: areas,
          };
        }
      }

      console.error(
        "Invalid response structure. Expected 'areas' field in response.data. Got:",
        response.data
      );
      return {
        success: false,
        error: `Invalid response structure. Response: ${JSON.stringify(
          response.data
        )}`,
      };
    } catch (error: any) {
      console.error("Failed to fetch venue areas:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to fetch venue areas",
      };
    }
  }

  /**
   * Get a specific area by ID with complete details including gallery
   */
  async getArea(
    areaId: string
  ): Promise<{ success: boolean; data?: AreaEditorDetail; error?: string }> {
    try {
      const response = await api.get(`/editor/areas/${areaId}`);
      if (response.data?.success && response.data?.data) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to fetch area",
      };
    }
  }

  /**
   * Create a new area
   */
  async createArea(
    floorId: string,
    areaData: CreateAreaRequest
  ): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
      const response = await api.post(
        `/editor/floors/${floorId}/areas`,
        areaData
      );
      if (response.data?.success) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create area",
      };
    }
  }

  /**
   * Update an existing area
   */
  async updateArea(
    areaId: string,
    updates: UpdateAreaRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.put(`/editor/areas/${areaId}`, updates);
      if (response.data?.success) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update area",
      };
    }
  }

  /**
   * Delete an area
   */
  async deleteArea(
    areaId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.delete(`/editor/areas/${areaId}`);
      if (response.data?.success) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to delete area",
      };
    }
  }

  /**
   * Set the start node for an area
   */
  async setAreaStartNode(
    areaId: string,
    nodeId: string | null
  ): Promise<{
    success: boolean;
    data?: { warning?: string };
    error?: string;
  }> {
    try {
      const response = await api.put(`/editor/areas/${areaId}/start-node`, {
        node_id: nodeId,
      });
      if (response.data?.success) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to set area start node",
      };
    }
  }

  /**
   * Add gallery items to an area
   */
  async addGalleryItems(
    areaId: string,
    items: AreaGalleryItem[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post(`/editor/areas/${areaId}/gallery`, {
        items,
      });
      if (response.data?.success) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to add gallery items",
      };
    }
  }

  /**
   * Reorder gallery items
   */
  async reorderGallery(
    areaId: string,
    mediaAssetIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.put(
        `/editor/areas/${areaId}/gallery/reorder`,
        {
          media_asset_ids: mediaAssetIds,
        }
      );
      if (response.data?.success) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to reorder gallery",
      };
    }
  }

  /**
   * Update a gallery item
   */
  async updateGalleryItem(
    areaId: string,
    mediaId: string,
    updates: Partial<AreaGalleryItem>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.patch(
        `/editor/areas/${areaId}/gallery/${mediaId}`,
        updates
      );
      if (response.data?.success) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update gallery item",
      };
    }
  }

  /**
   * Remove a gallery item
   */
  async removeGalleryItem(
    areaId: string,
    mediaId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.delete(
        `/editor/areas/${areaId}/gallery/${mediaId}`
      );
      if (response.data?.success) {
        return response.data;
      } else {
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to remove gallery item",
      };
    }
  }
}

export const areaService = new AreaService();

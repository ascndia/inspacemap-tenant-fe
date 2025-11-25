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
  floor_name: string;
  revision_name: string;
  revision_status: "draft" | "published";
  boundary_points: number;
  cover_image_id?: string;
  gallery_count: number;
  created_at: string;
  updated_at: string;
}

class AreaService {
  /**
   * Get all areas for a venue
   */
  async getVenueAreas(
    venueId: string
  ): Promise<{ success: boolean; data?: AreaSummary[]; error?: string }> {
    try {
      const response = await api.get(`/editor/venues/${venueId}/areas`);
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
        error: error.message || "Failed to fetch venue areas",
      };
    }
  }

  /**
   * Get a specific area by ID
   */
  async getArea(
    areaId: string
  ): Promise<{ success: boolean; data?: AreaData; error?: string }> {
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

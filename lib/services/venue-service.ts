import api from "@/lib/api";
import type {
  Venue,
  VenueListResponse,
  CreateVenueRequest,
  CreateVenueResponse,
  VenueDetailResponse,
  UpdateVenueRequest,
  AddGalleryItemsRequest,
  UpdateGalleryItemRequest,
  ReorderGalleryRequest,
  GalleryResponse,
} from "../../types/venue";

export interface VenueListParams {
  limit?: number;
  offset?: number;
  name?: string;
  city?: string;
  visibility?: "public" | "private";
}

export const venueService = {
  /**
   * Get venues list with pagination and filters
   */
  getVenues: async (params?: VenueListParams): Promise<VenueListResponse> => {
    try {
      console.log("Fetching venues from backend...");
      const response = await api.get("/venues", { params });
      console.log("Backend venues response:", response.data);

      // Handle backend response structure: { success: true, data: { limit, offset, total, venues: [...] } }
      if (response.data?.success && response.data?.data?.venues) {
        console.log(
          "Processing venues array with",
          response.data.data.venues.length,
          "items"
        );
        return response.data;
      } else {
        console.warn("Backend response structure unexpected:", response.data);
        // Return a safe fallback response
        return {
          success: false,
          error: "Invalid backend response structure",
          data: {
            limit: 0,
            offset: 0,
            total: 0,
            venues: [],
          },
        };
      }
    } catch (error: any) {
      console.warn("Backend venues fetch failed:", error);
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      // Return a safe fallback response instead of throwing
      return {
        success: false,
        error: error.message || "Failed to fetch venues",
        data: {
          limit: 0,
          offset: 0,
          total: 0,
          venues: [],
        },
      };
    }
  },

  /**
   * Create new venue
   */
  createVenue: async (
    venueData: CreateVenueRequest
  ): Promise<CreateVenueResponse> => {
    try {
      console.log("Creating venue with data:", venueData);
      const response = await api.post("/venues", venueData);
      console.log("Create venue response:", response.data);

      if (response.data?.success) {
        return response.data;
      } else {
        console.warn(
          "Create venue response structure unexpected:",
          response.data
        );
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      console.warn("Create venue failed:", error);
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to create venue",
      };
    }
  },

  /**
   * Get venue detail by ID
   */
  getVenueById: async (id: string): Promise<VenueDetailResponse> => {
    try {
      console.log("Fetching venue detail for ID:", id);
      const response = await api.get(`/venues/${id}`);
      console.log("Venue detail response:", response.data);

      if (response.data?.success && response.data?.data) {
        return response.data;
      } else {
        console.warn(
          "Venue detail response structure unexpected:",
          response.data
        );
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      console.warn("Venue detail fetch failed:", error);
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to fetch venue details",
      };
    }
  },

  /**
   * Add gallery items to venue
   */
  addGalleryItems: async (
    venueId: string,
    data: AddGalleryItemsRequest
  ): Promise<GalleryResponse> => {
    try {
      console.log("Adding gallery items to venue:", venueId, data);
      const response = await api.post(`/venues/${venueId}/gallery`, data);
      console.log("Add gallery items response:", response.data);

      if (response.data?.success) {
        return response.data;
      } else {
        console.warn("Add gallery items response unexpected:", response.data);
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      console.warn("Add gallery items failed:", error);
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to add gallery items",
      };
    }
  },

  /**
   * Update gallery item
   */
  updateGalleryItem: async (
    venueId: string,
    mediaId: string,
    data: UpdateGalleryItemRequest
  ): Promise<GalleryResponse> => {
    try {
      console.log("Updating gallery item:", venueId, mediaId, data);
      const response = await api.patch(
        `/venues/${venueId}/gallery/${mediaId}`,
        data
      );
      console.log("Update gallery item response:", response.data);

      if (response.data?.success) {
        return response.data;
      } else {
        console.warn("Update gallery item response unexpected:", response.data);
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      console.warn("Update gallery item failed:", error);
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to update gallery item",
      };
    }
  },

  /**
   * Reorder gallery items
   */
  reorderGallery: async (
    venueId: string,
    data: ReorderGalleryRequest
  ): Promise<GalleryResponse> => {
    try {
      console.log("Reordering gallery for venue:", venueId, data);
      const response = await api.put(
        `/venues/${venueId}/gallery/reorder`,
        data
      );
      console.log("Reorder gallery response:", response.data);

      if (response.data?.success) {
        return response.data;
      } else {
        console.warn("Reorder gallery response unexpected:", response.data);
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      console.warn("Reorder gallery failed:", error);
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to reorder gallery",
      };
    }
  },

  /**
   * Remove gallery item
   */
  removeGalleryItem: async (
    venueId: string,
    mediaId: string
  ): Promise<GalleryResponse> => {
    try {
      console.log("Removing gallery item:", venueId, mediaId);
      const response = await api.delete(
        `/venues/${venueId}/gallery/${mediaId}`
      );
      console.log("Remove gallery item response:", response.data);

      if (response.data?.success) {
        return response.data;
      } else {
        console.warn("Remove gallery item response unexpected:", response.data);
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      console.warn("Remove gallery item failed:", error);
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to remove gallery item",
      };
    }
  },

  /**
   * Update venue
   */
  updateVenue: async (
    id: string,
    data: UpdateVenueRequest
  ): Promise<VenueDetailResponse> => {
    try {
      console.log("Updating venue:", id, data);
      const response = await api.put(`/venues/${id}`, data);
      console.log("Update venue response:", response.data);

      if (response.data?.success) {
        return response.data;
      } else {
        console.warn("Update venue response unexpected:", response.data);
        return {
          success: false,
          error: "Invalid response structure",
        };
      }
    } catch (error: any) {
      console.warn("Update venue failed:", error);
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to update venue",
      };
    }
  },

  /**
   * Delete venue
   */
  deleteVenue: async (id: string): Promise<void> => {
    await api.delete(`/venues/${id}`);
  },
};

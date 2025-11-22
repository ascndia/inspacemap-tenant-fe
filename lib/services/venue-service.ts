import api from "@/lib/api";
import type {
  Venue,
  VenueListResponse,
  CreateVenueRequest,
  CreateVenueResponse,
  VenueDetailResponse,
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
   * Update venue
   */
  updateVenue: async (id: string, data: Partial<Venue>): Promise<Venue> => {
    const response = await api.put(`/venues/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete venue
   */
  deleteVenue: async (id: string): Promise<void> => {
    await api.delete(`/venues/${id}`);
  },
};

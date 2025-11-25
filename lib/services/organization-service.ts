import api from "@/lib/api";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email: string;
  phone: string;
  address: string;
  logoURL?: string;
  website?: string;
  isActive?: boolean;
  type: string;
  members: number[];
  status: string;
  settings?: Record<string, any>;
}

class OrganizationService {
  /**
   * Get organization by ID
   */
  async getOrganization(
    organizationId: string
  ): Promise<{ success: boolean; data?: Organization; error?: string }> {
    try {
      const response = await api.get(`/organizations/${organizationId}`);
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
        error: error.message || "Failed to fetch organization",
      };
    }
  }

  /**
   * Get current user's organization
   */
  async getCurrentOrganization(): Promise<{
    success: boolean;
    data?: Organization;
    error?: string;
  }> {
    try {
      const response = await api.get("/organizations/me");
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
        error: error.message || "Failed to fetch current organization",
      };
    }
  }
}

export const organizationService = new OrganizationService();

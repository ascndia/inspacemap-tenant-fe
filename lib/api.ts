import axios from "axios";
import type { MediaItem, MediaListResponse } from "@/types/media";
import type {
  GraphRevision,
  GraphRevisionDetail,
  CreateDraftRevisionResponse,
  ListRevisionsResponse,
  GetRevisionDetailResponse,
  DeleteRevisionResponse,
} from "@/types/graph";

export const mockOrganizations = [
  {
    id: "1",
    name: "Acme Corp",
    type: "business",
    members: [1, 2, 3],
    status: "active",
    description: "Leading provider of coyote-catching equipment.",
    email: "contact@acme.com",
    phone: "+1 (555) 123-4567",
    address: "123 Desert Road, Arizona, USA",
    // New schema fields
    slug: "acme-corp",
    logoURL: "/placeholder-logo.png",
    website: "https://acme.com",
    isActive: true,
    settings: {
      theme: "light",
      notifications: true,
      language: "en",
    },
  },
  {
    id: "2",
    name: "Global Retail",
    type: "company",
    members: [1, 2, 3, 4, 5],
    status: "active",
    slug: "global-retail",
    logoURL: "/placeholder-logo.png",
    website: "https://globalretail.com",
    isActive: true,
    settings: {},
  },
];

export const mockVenues = [
  {
    id: "1",
    name: "Grand Plaza Mall",
    address: "123 Market St, San Francisco, CA",
    status: "published",
    coverImageId: "1",
    floors: [
      {
        id: "f1",
        name: "Ground Floor",
        level: 0,
        areas: [
          { id: "a1", name: "Main Entrance", category: "entrance" },
          { id: "a2", name: "Food Court", category: "dining" },
        ],
      },
      {
        id: "f2",
        name: "Second Floor",
        level: 1,
        areas: [{ id: "a3", name: "Cinema", category: "entertainment" }],
      },
    ],
    location: { lat: 37.7749, lng: -122.4194 },
  },
  {
    id: "2",
    name: "Tech Hub Office",
    address: "456 Innovation Dr, San Jose, CA",
    status: "draft",
    coverImageId: "4",
    floors: [
      {
        id: "f3",
        name: "Lobby",
        level: 0,
        areas: [{ id: "a4", name: "Reception", category: "service" }],
      },
    ],
    location: { lat: 37.3382, lng: -121.8863 },
  },
  {
    id: "3",
    name: "City Center Hotel",
    address: "789 Downtown Ave, Los Angeles, CA",
    status: "published",
    coverImageId: "5",
    floors: [],
    location: { lat: 34.0522, lng: -118.2437 },
  },
];

export const mockMedia: MediaListResponse = {
  data: [
    {
      id: "1",
      asset_id: "asset-1",
      name: "Lobby 360 Panorama",
      file_name: "lobby_360.jpg",
      file_type: "image/jpeg",
      file_size: 4404019,
      category: "panorama",
      url: "/placeholder.svg",
      thumbnail_url: "/placeholder.svg",
      width: 4096,
      height: 2048,
      uploaded_at: "2023-10-25T14:30:00Z",
      uploaded_by: "John Doe",
      organization_id: "org-1",
    },
    {
      id: "2",
      asset_id: "asset-2",
      name: "Hallway A",
      file_name: "hallway_A.jpg",
      file_type: "image/jpeg",
      file_size: 3250585,
      category: "panorama",
      url: "/placeholder.svg",
      thumbnail_url: "/placeholder.svg",
      width: 4096,
      height: 2048,
      uploaded_at: "2023-10-25T11:15:00Z",
      uploaded_by: "Jane Smith",
      organization_id: "org-1",
    },
    {
      id: "3",
      asset_id: "asset-3",
      name: "Intro Video",
      file_name: "intro_video.mp4",
      file_type: "video/mp4",
      file_size: 26214400,
      category: "panorama",
      url: "/placeholder.svg",
      thumbnail_url: "/placeholder.svg",
      width: 1920,
      height: 1080,
      uploaded_at: "2023-10-24T09:45:00Z",
      uploaded_by: "John Doe",
      organization_id: "org-1",
    },
    {
      id: "4",
      asset_id: "asset-4",
      name: "Storefront",
      file_name: "storefront_01.jpg",
      file_type: "image/jpeg",
      file_size: 2936012,
      category: "panorama",
      url: "/placeholder.svg",
      thumbnail_url: "/placeholder.svg",
      width: 4096,
      height: 2048,
      uploaded_at: "2023-10-23T16:20:00Z",
      uploaded_by: "Jane Smith",
      organization_id: "org-1",
    },
    {
      id: "5",
      asset_id: "asset-5",
      name: "Atrium View",
      file_name: "atrium_view.jpg",
      file_type: "image/jpeg",
      file_size: 5505020,
      category: "panorama",
      url: "/placeholder.svg",
      thumbnail_url: "/placeholder.svg",
      width: 4096,
      height: 2048,
      uploaded_at: "2023-10-22T10:00:00Z",
      uploaded_by: "Bob Johnson",
      organization_id: "org-1",
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 5,
    total_pages: 1,
  },
};
export const mockMembers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@acme.com",
    role: "Admin",
    status: "Active",
    lastActive: "2 mins ago",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@acme.com",
    role: "Editor",
    status: "Active",
    lastActive: "1 hour ago",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@acme.com",
    role: "Viewer",
    status: "Invited",
    lastActive: "-",
  },
];

export const mockAuditLogs = [
  {
    id: 1,
    user: "John Doe",
    action: "Updated Venue",
    resource: "Grand Plaza Mall",
    date: "2023-10-25 14:30",
    ip: "192.168.1.1",
  },
  {
    id: 2,
    user: "Jane Smith",
    action: "Uploaded Media",
    resource: "lobby_360.jpg",
    date: "2023-10-25 11:15",
    ip: "192.168.1.2",
  },
  {
    id: 3,
    user: "John Doe",
    action: "Invited Member",
    resource: "bob@acme.com",
    date: "2023-10-24 09:45",
    ip: "192.168.1.1",
  },
  {
    id: 4,
    user: "System",
    action: "Backup Created",
    resource: "Daily Backup",
    date: "2023-10-24 00:00",
    ip: "localhost",
  },
  {
    id: 5,
    user: "Jane Smith",
    action: "Deleted Venue",
    resource: "Old Warehouse",
    date: "2023-10-23 16:20",
    ip: "192.168.1.2",
  },
];

// Buat instance Axios
const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor untuk menyisipkan Token & Tenant ID otomatis
api.interceptors.request.use((config) => {
  // Ambil dari LocalStorage
  const token = localStorage.getItem("access_token");
  const currentOrgStr = localStorage.getItem("current_org");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Header wajib untuk Multi-tenant backend - use organization_id from current org
  if (currentOrgStr) {
    try {
      const currentOrg = JSON.parse(currentOrgStr);
      config.headers["X-Tenant-ID"] = currentOrg.organization_id;
    } catch (error) {
      console.error("Failed to parse current_org for tenant ID:", error);
    }
  }

  return config;
});

// Response interceptor for token refresh/error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log all errors for debugging during development
    console.log("API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      pathname:
        typeof window !== "undefined" ? window.location.pathname : "unknown",
    });

    // Log detailed error response for debugging
    if (error.response?.data) {
      console.log("API Error Response Data:", error.response.data);
    }

    // Don't automatically logout on any HTTP errors during development
    // This prevents unwanted logouts when APIs are not fully implemented
    // Components should handle authentication errors individually

    return Promise.reject(error);
  }
);

export default api;

// Media API functions
export const uploadMedia = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<MediaItem> => {
  // Simulate upload progress
  if (onProgress) {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      onProgress(i);
    }
  }

  // Simulate API response
  const media: MediaItem = {
    id: Date.now().toString(),
    asset_id: `asset-${Date.now()}`,
    name: file.name,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    category: file.type.startsWith("image/")
      ? "panorama"
      : file.type.startsWith("video/")
      ? "panorama"
      : "panorama",
    url: URL.createObjectURL(file), // In real app, this would be the uploaded URL
    thumbnail_url: URL.createObjectURL(file),
    uploaded_at: new Date().toISOString(),
    uploaded_by: "Current User", // In real app, get from auth
    organization_id: "org-1",
  };

  return media;

  // Uncomment below for real API call
  // const formData = new FormData();
  // formData.append("file", file);
  //
  // const response = await api.post("/media/upload", formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data',
  //   },
  //   onUploadProgress: (progressEvent) => {
  //     if (onProgress && progressEvent.total) {
  //       const progress = Math.round(
  //         (progressEvent.loaded * 100) / progressEvent.total
  //       );
  //       onProgress(progress);
  //     }
  //   },
  // });
  //
  // return response.data;
};

export const getMedia = async (): Promise<MediaItem[]> => {
  const response = await api.get("/media");
  return response.data;
};

// Graph Revision API functions
export const createDraftRevision = async (
  venueId: string,
  note?: string
): Promise<CreateDraftRevisionResponse> => {
  const response = await api.post(`/editor/${venueId}/revisions/draft`, {
    note,
  });
  return response.data;
};

export const listRevisions = async (
  venueId: string
): Promise<ListRevisionsResponse> => {
  const response = await api.get(`/editor/${venueId}/revisions`);
  return response.data;
};

export const getRevisionDetail = async (
  revisionId: string
): Promise<GetRevisionDetailResponse> => {
  const response = await api.get(`/editor/revisions/${revisionId}`);
  return response.data;
};

export const deleteRevision = async (
  revisionId: string
): Promise<DeleteRevisionResponse> => {
  const response = await api.delete(`/editor/revisions/${revisionId}`);
  return response.data;
};

// export const updateRevision = async (
//   revisionId: string,
//   data: { note: string }
// ): Promise<any> => {
//   const response = await api.put(`/editor/revisions/${revisionId}`, data);
//   return response.data;
// };

// Graph API functions
export const getGraphData = async (revisionId: string): Promise<any> => {
  const response = await api.get(`/editor/${revisionId}`);
  return response.data;
};

export const createGraphNode = async (
  floorId: string,
  nodeData: any
): Promise<any> => {
  const response = await api.post(`/editor/nodes`, {
    ...nodeData,
    floor_id: floorId,
  });
  return response.data;
};

export const updateGraphNode = async (
  floorId: string,
  nodeId: string,
  nodeData: any
): Promise<{ success: boolean; data: string }> => {
  const response = await api.put(`/editor/nodes/${nodeId}`, {
    ...nodeData,
  });
  return response.data;
};

export const updateRevision = async (
  revisionId: string,
  revisionData: { note: string }
): Promise<{ success: boolean; data: string }> => {
  const response = await api.put(
    `/editor/revisions/${revisionId}`,
    revisionData
  );
  return response.data;
};

export const publishRevision = async (
  revisionId: string,
  note?: string
): Promise<{ success: boolean; data: string }> => {
  const response = await api.post(`/editor/${revisionId}/publish`, {
    revision_id: revisionId,
    note,
  });
  return response.data;
};

export const cloneRevision = async (
  sourceRevisionId: string,
  targetVenueId: string,
  note?: string
): Promise<{
  success: boolean;
  data: {
    new_revision_id: string;
    note: string;
    status: string;
    created_at: string;
    created_by: string;
  };
}> => {
  const response = await api.post(`/editor/revisions/clone`, {
    source_revision_id: sourceRevisionId,
    target_venue_id: targetVenueId,
    note,
  });
  return response.data;
};

export const updateNodePosition = async (
  nodeId: string,
  x: number,
  y: number
): Promise<any> => {
  const response = await api.put(`/editor/nodes/${nodeId}/position`, {
    x,
    y,
  });
  return response.data;
};

export const calibrateNode = async (
  nodeId: string,
  rotationOffset: number
): Promise<any> => {
  const response = await api.put(`/editor/nodes/${nodeId}/calibration`, {
    rotation_offset: rotationOffset,
  });
  return response.data;
};

export const deleteGraphNode = async (
  floorId: string,
  nodeId: string
): Promise<any> => {
  const response = await api.delete(`/editor/nodes/${nodeId}`);
  return response.data;
};

export const createGraphConnection = async (
  floorId: string,
  connectionData: any
): Promise<any> => {
  const response = await api.post(`/editor/connections`, {
    ...connectionData,
  });
  return response.data;
};

export const deleteGraphConnection = async (
  fromNodeId: string,
  toNodeId: string
): Promise<any> => {
  const response = await api.delete(`/editor/connections`, {
    params: {
      from_node_id: fromNodeId,
      to_node_id: toNodeId,
    },
  });
  return response.data;
};

export const updateFloor = async (
  floorId: string,
  floorData: any
): Promise<any> => {
  const response = await api.put(`/editor/floors/${floorId}`, floorData);
  return response.data;
};

export const createFloor = async (
  revisionId: string,
  floorData: any
): Promise<any> => {
  const response = await api.post(`/editor/${revisionId}/floors`, floorData);
  return response.data;
};

export const deleteFloor = async (floorId: string): Promise<any> => {
  const response = await api.delete(`/editor/floors/${floorId}`);
  return response.data;
};

export const getFloors = async (revisionId: string): Promise<any> => {
  const response = await api.get(`/editor/${revisionId}/floors`);
  return response.data;
};

export const getFloor = async (floorId: string): Promise<any> => {
  const response = await api.get(`/editor/floors/${floorId}`);
  return response.data;
};

// Area API functions
export const createArea = async (
  floorId: string,
  areaData: any
): Promise<any> => {
  const response = await api.post(`/editor/floors/${floorId}/areas`, areaData);
  return response.data;
};

export const updateArea = async (
  areaId: string,
  areaData: any
): Promise<any> => {
  const response = await api.put(`/editor/areas/${areaId}`, areaData);
  return response.data;
};

export const deleteArea = async (areaId: string): Promise<any> => {
  const response = await api.delete(`/editor/areas/${areaId}`);
  return response.data;
};

export const setAreaStartNode = async (
  areaId: string,
  data: { node_id: string | null }
): Promise<any> => {
  const response = await api.put(`/editor/areas/${areaId}/start-node`, data);
  return response.data;
};

// User API functions
export const updateUser = async (
  userId: string,
  userData: { full_name: string; email: string; password?: string }
): Promise<any> => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};

// Organization User Management API functions
export const createOrganizationUser = async (
  orgId: string,
  userData: {
    full_name: string;
    email: string;
    password: string;
    role_id: string;
  }
): Promise<any> => {
  const response = await api.post(`/orgs/${orgId}/users`, userData);
  return response.data;
};

export const getOrganizationMembers = async (orgId: string): Promise<any[]> => {
  const response = await api.get(`/orgs/${orgId}/members`);
  return response.data;
};

export const updateOrganizationMemberRole = async (
  orgId: string,
  userData: { target_user_id: string; new_role_id: string }
): Promise<any> => {
  const response = await api.patch(`/orgs/${orgId}/members`, userData);
  return response.data;
};

export const removeOrganizationMember = async (
  orgId: string,
  userId: string
): Promise<any> => {
  const response = await api.delete(`/orgs/${orgId}/members/${userId}`);
  return response.data;
};

// Roles API functions
export const getRoles = async (): Promise<any[]> => {
  const response = await api.get("/roles");
  return response.data;
};

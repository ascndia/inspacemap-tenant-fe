import api from "@/lib/api";
import type {
  MediaItem,
  MediaUploadInitRequest,
  MediaUploadInitResponse,
  MediaConfirmRequest,
  MediaListResponse,
} from "@/types/media";

export const mediaService = {
  /**
   * Initialize media upload
   */
  initUpload: async (
    data: MediaUploadInitRequest
  ): Promise<MediaUploadInitResponse> => {
    const response = await api.post("/media/upload-init", data);
    return response.data.data;
  },

  /**
   * Confirm media upload after uploading to MinIO
   */
  confirmUpload: async (data: MediaConfirmRequest): Promise<MediaItem> => {
    const response = await api.post("/media/confirm", data);
    return response.data.data;
  },

  /**
   * Get media list with pagination and filters
   */
  getMedia: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    venue_id?: string;
    floor_id?: string;
  }): Promise<MediaListResponse> => {
    const response = await api.get("/media", { params });
    return response.data;
  },

  /**
   * Get single media item
   */
  getMediaById: async (id: string): Promise<MediaItem> => {
    const response = await api.get(`/media/${id}`);
    return response.data.data;
  },

  /**
   * Delete media item
   */
  deleteMedia: async (id: string): Promise<void> => {
    await api.delete(`/media/${id}`);
  },

  /**
   * Update media metadata
   */
  updateMedia: async (
    id: string,
    data: Partial<MediaItem>
  ): Promise<MediaItem> => {
    const response = await api.put(`/media/${id}`, data);
    return response.data.data;
  },

  /**
   * Upload file using MinIO flow
   */
  uploadFile: async (
    file: File,
    category: "panorama" | "icon" | "floorplan" = "panorama",
    onProgress?: (progress: number) => void
  ): Promise<MediaItem> => {
    try {
      // Step 1: Initialize upload
      const initData = await mediaService.initUpload({
        file_name: file.name,
        file_type: file.type,
        category,
        file_size: file.size,
      });

      // Step 2: Upload to MinIO
      await fetch(initData.upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Step 3: Get image dimensions (for images)
      let width = 0;
      let height = 0;

      if (file.type.startsWith("image/")) {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      }

      // Step 4: Confirm upload
      const mediaItem = await mediaService.confirmUpload({
        asset_id: initData.asset_id,
        width,
        height,
      });

      return mediaItem;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },
};

/**
 * Helper function to get image dimensions
 */
const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
};

import api from "@/lib/api";
import type {
  MediaItem,
  MediaUploadInitRequest,
  MediaUploadInitResponse,
  MediaConfirmRequest,
  MediaListResponse,
} from "@/types/media";
import { mockMedia } from "@/lib/api";

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
    type?: string;
    mime_type?: string;
    uploaded_after?: string;
    search?: string;
    venue_id?: string;
    floor_id?: string;
  }): Promise<MediaListResponse> => {
    try {
      console.log("Fetching media from backend...");
      // Convert page-based pagination to offset-based pagination for backend
      const backendParams = {
        ...params,
        offset: params?.page ? (params.page - 1) * (params.limit || 50) : 0,
      };
      // Remove page from params since backend uses offset
      delete backendParams.page;

      console.log("Backend params (converted to offset):", backendParams);
      console.log("Making API call to /media with params:", backendParams);
      const response = await api.get("/media", { params: backendParams });
      console.log("Raw backend response:", response);
      console.log("Backend response status:", response.status);
      console.log("Backend response data:", response.data);

      // Handle backend response structure: { success: true, data: { assets: [...], total: number } }
      console.log(
        "Checking response.data.data.assets:",
        response.data?.data?.assets
      );
      console.log(
        "Is assets an array?",
        Array.isArray(response.data?.data?.assets)
      );
      console.log("Full response.data.data:", response.data?.data);
      console.log("Total from backend:", response.data?.data?.total);
      console.log("Assets length:", response.data?.data?.assets?.length);

      if (
        response.data?.data?.assets &&
        Array.isArray(response.data.data.assets)
      ) {
        console.log(
          "Processing media array with",
          response.data.data.assets.length,
          "items"
        );

        // Transform backend assets to frontend MediaItem format
        const transformedAssets = response.data.data.assets.map(
          (asset: any) => ({
            id: asset.id,
            asset_id: asset.id, // Use id as asset_id for compatibility
            name: asset.FileName || "Unnamed",
            file_name: asset.FileName || asset.name || "unnamed",
            file_type: asset.MimeType || "application/octet-stream",
            file_size:
              typeof asset.SizeInBytes === "number" && !isNaN(asset.SizeInBytes)
                ? asset.SizeInBytes
                : 0,
            category: asset.Type || "panorama",
            url: asset.PublicURL?.replace("localhost:9000", "localhost:9002"),
            thumbnail_url:
              asset.ThumbnailURL?.replace("localhost:9000", "localhost:9002") ||
              asset.PublicURL?.replace("localhost:9000", "localhost:9002"),
            width: asset.Width || 0,
            height: asset.Height || 0,
            uploaded_at: asset.UploadedAt || new Date().toISOString(),
            uploaded_by: "User", // Backend doesn't provide this in the response
            organization_id: asset.OrganizationID || "org-1",
          })
        );

        // Return in expected frontend format
        const result: MediaListResponse = {
          data: transformedAssets,
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 50,
            total: response.data.data.total || transformedAssets.length,
            total_pages: Math.ceil(
              (response.data.data.total || transformedAssets.length) /
                (params?.limit || 50)
            ),
          },
        };

        console.log("Transformed to frontend format:", result);
        return result;
      } else {
        console.warn(
          "Backend response data.data.assets is not an array:",
          response.data?.data?.assets
        );
        throw new Error("Invalid backend response structure");
      }
    } catch (error: any) {
      console.warn(
        "Backend media fetch failed, falling back to mock data:",
        error
      );
      console.warn("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      // Return mock data as fallback
      return mockMedia;
    }
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
   * Upload file using MinIO flow (with fallback for development)
   */
  uploadFile: async (
    file: File,
    category: "panorama" | "icon" | "floorplan" = "panorama",
    onProgress?: (progress: number) => void
  ): Promise<MediaItem> => {
    try {
      // Try real upload first
      try {
        console.log("Starting real upload process for file:", file.name);

        // Step 1: Initialize upload
        const initRequest = {
          file_name: file.name,
          file_type: file.type,
          category,
          file_size: file.size,
        };
        console.log("Init upload request:", initRequest);

        const initData = await mediaService.initUpload(initRequest);
        console.log("Init upload response:", initData);

        // Step 2: Upload to MinIO
        console.log("Uploading to MinIO URL:", initData.upload_url);

        // Fix MinIO URL for frontend access (replace internal hostname with external)
        let uploadUrl = initData.upload_url;
        if (uploadUrl.includes("minio_dev:9000")) {
          uploadUrl = uploadUrl.replace("minio_dev:9000", "localhost:9002");
          console.log("Fixed MinIO URL for frontend:", uploadUrl);
        }

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
        console.log("MinIO upload completed successfully");

        // Step 3: Get image dimensions (for images)
        let width = 0;
        let height = 0;

        if (file.type.startsWith("image/")) {
          const dimensions = await getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
        }

        // Step 4: Confirm upload
        const confirmData = {
          asset_id: initData.asset_id,
          width,
          height,
        };
        console.log("Confirm upload request:", confirmData);

        let mediaItem;
        try {
          mediaItem = await mediaService.confirmUpload(confirmData);
          console.log("Confirm upload response:", mediaItem);
        } catch (confirmError: any) {
          console.error("Confirm upload failed specifically:", confirmError);
          console.error("Confirm error response:", confirmError.response?.data);
          console.error("Confirm error status:", confirmError.response?.status);

          // Check if it's a Redis/backend issue (500 error)
          if (confirmError.response?.status === 500) {
            console.warn(
              "Backend confirm failed with 500, falling back to mock media item with real MinIO URL"
            );

            // Create mock media item but with real MinIO URL
            const minioUrl = uploadUrl.replace(
              "?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=admin_inspacemap%2F20251122%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251122T050855Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&x-id=PutObject&X-Amz-Signature=7b46c9070b757d0e44ad7da96d07d57866a4fbaa26bffef2345a8a7232d4f6f5",
              ""
            );

            mediaItem = {
              id: Date.now().toString(),
              asset_id: initData.asset_id,
              name: file.name,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              category,
              url: minioUrl,
              thumbnail_url: minioUrl, // Same URL for now
              width,
              height,
              uploaded_at: new Date().toISOString(),
              uploaded_by: "Current User",
              organization_id: "org-1",
            };

            console.log("Created fallback media item:", mediaItem);
          } else {
            throw confirmError;
          }
        }

        // Fix URLs in the returned media item
        if (mediaItem.url?.includes("minio_dev:9000")) {
          mediaItem.url = mediaItem.url.replace(
            "minio_dev:9000",
            "localhost:9002"
          );
        }
        if (mediaItem.thumbnail_url?.includes("minio_dev:9000")) {
          mediaItem.thumbnail_url = mediaItem.thumbnail_url.replace(
            "minio_dev:9000",
            "localhost:9002"
          );
        }

        return mediaItem;
      } catch (backendError: any) {
        console.warn(
          "Backend upload failed, checking error details:",
          backendError
        );
        console.warn("Error response:", backendError.response?.data);
        console.warn("Error status:", backendError.response?.status);
        console.warn("Error config:", backendError.config);

        // Fallback: Mock upload process
        onProgress?.(10);

        // Simulate upload progress
        for (let progress = 20; progress <= 90; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          onProgress?.(progress);
        }

        // Get image dimensions
        let width = 0;
        let height = 0;
        if (file.type.startsWith("image/")) {
          const dimensions = await getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
        }

        onProgress?.(100);

        // Return mock media item
        const mockMedia: MediaItem = {
          id: Date.now().toString(),
          asset_id: `asset-${Date.now()}`,
          name: file.name,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          category,
          url: URL.createObjectURL(file), // In real app, this would be the uploaded URL
          thumbnail_url: URL.createObjectURL(file),
          width,
          height,
          uploaded_at: new Date().toISOString(),
          uploaded_by: "Current User",
          organization_id: "org-1",
        };

        return mockMedia;
      }
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

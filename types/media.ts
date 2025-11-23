export interface MediaItem {
  id: string;
  asset_id: string;
  name: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: "panorama" | "icon" | "floorplan";
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  uploaded_at: string;
  uploaded_by: string;
  organization_id: string;
  venue_id?: string;
  floor_id?: string;
  tags?: string[];
}

export interface MediaUploadInitRequest {
  file_name: string;
  file_type: string;
  category: "panorama" | "icon" | "floorplan";
  file_size: number;
}

export interface MediaUploadInitResponse {
  upload_url: string;
  asset_id: string;
  key: string;
}

export interface MediaConfirmRequest {
  asset_id: string;
  width: number;
  height: number;
}

export interface MediaListResponse {
  data: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

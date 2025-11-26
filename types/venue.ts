export interface VenueCoordinates {
  latitude: number;
  longitude: number;
}

export interface VenueDetail {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  full_address: string;
  coordinates: VenueCoordinates;
  visibility: "public" | "private" | "unlisted";
  cover_image_id?: string;
  cover_image_url?: string;
  gallery: VenueGalleryItem[] | null;
  pois: any[] | null; // POI structure not specified yet
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  city: string;
  visibility: "public" | "private" | "unlisted";
  is_live: boolean;
  cover_image_url?: string;
}

export interface VenueListResponse {
  success: boolean;
  data?: {
    limit: number;
    offset: number;
    total: number;
    venues: Venue[];
  };
  error?: string;
}

export interface VenueFilters {
  status?: "published" | "draft";
  search?: string;
  page?: number;
  limit?: number;
}

export interface VenueGalleryItem {
  media_asset_id: string;
  url: string;
  thumbnail_url: string;
  sort_order?: number;
  caption?: string;
  is_visible?: boolean;
  is_featured?: boolean;
}

export interface AddGalleryItemsRequest {
  items: VenueGalleryItem[];
}

export interface UpdateGalleryItemRequest {
  caption?: string;
  sort_order?: number;
  is_visible?: boolean;
  is_featured?: boolean;
}

export interface ReorderGalleryRequest {
  media_asset_ids: string[];
}

export interface GalleryResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface CreateVenueRequest {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  visibility?: "public" | "private" | "unlisted";
  cover_image_id?: string;
  gallery?: VenueGalleryItem[];
}

export interface CreateVenueResponse {
  success: boolean;
  data?: {
    id: string;
  };
  error?: string;
}

export interface UpdateVenueRequest {
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  coordinates?: VenueCoordinates;
  visibility?: "public" | "private" | "unlisted";
  cover_image_id?: string | null;
  gallery?: VenueGalleryItem[];
}

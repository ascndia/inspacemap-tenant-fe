export interface MediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "panorama";
  size: string;
  url: string;
  thumbnail?: string;
  tags?: string[];
  uploadedAt: string;
  uploadedBy: string;
  venueId?: string;
  floorId?: string;
}

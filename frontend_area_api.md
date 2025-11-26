# Comprehensive Area API Documentation

## Overview

This document provides a complete guide to all area management APIs in the InSpaceMap backend. It covers both tenant portal and editor interfaces, including the latest enhancements for comprehensive area details and gallery management.

## Base URLs

- **Tenant Portal:** `/api/v1/venues/{venue_id}/areas`
- **Editor Interface:** `/api/v1/editor`

## Authentication

All requests require:

- `Authorization: Bearer <token>` header
- `X-Tenant-ID: <organization_id>` header

---

## 📋 Area Listing & Filtering

### List Areas (Tenant Portal)

**Endpoint:** `GET /api/v1/venues/{venue_id}/areas`

**Purpose:** Retrieve paginated list of areas for a venue with filtering options.

**Path Parameters:**

- `venue_id` (UUID, required): Venue identifier

**Query Parameters:**

- `revision_id` (UUID, optional): Specific revision ID (defaults to venue's live revision)
- `floor_id` (UUID, optional): Filter by floor
- `status` (string, optional): "published", "draft", or "all" (default: published)
- `limit` (int, optional): Items per page (default: 20, max: 100)
- `offset` (int, optional): Pagination offset (default: 0)
- `name` (string, optional): Filter by area name (partial match)
- `category` (string, optional): Filter by category

**Response:**

```json
{
  "success": true,
  "data": {
    "areas": [
      {
        "id": "uuid",
        "name": "Conference Room A",
        "description": "Main conference room",
        "category": "meeting_room",
        "floor_id": "uuid",
        "floor_name": "2nd Floor",
        "revision_id": "uuid",
        "cover_url": "https://...",
        "gallery_count": 5,
        "created_at": "2025-11-25T10:00:00Z",
        "updated_at": "2025-11-25T10:00:00Z"
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 🔍 Area Detail Retrieval

### Get Complete Area Details (Editor)

**Endpoint:** `GET /api/v1/editor/areas/{id}` ⭐ **NEW**

**Purpose:** Retrieve comprehensive area information including all attributes and gallery items in one request.

**Path Parameters:**

- `id` (UUID, required): Area identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Conference Room A",
    "description": "Main conference room on the 2nd floor",
    "category": "meeting_room",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "boundary": [
      { "x": 100.0, "y": 200.0 },
      { "x": 200.0, "y": 200.0 },
      { "x": 200.0, "y": 300.0 },
      { "x": 100.0, "y": 300.0 }
    ],
    "start_node_id": "uuid",
    "floor_id": "uuid",
    "floor_name": "2nd Floor",
    "revision_id": "uuid",
    "cover_image_id": "uuid",
    "cover_url": "https://cdn.example.com/cover.jpg",
    "gallery": [
      {
        "media_id": "uuid",
        "url": "https://cdn.example.com/gallery1.jpg",
        "thumbnail_url": "https://cdn.example.com/gallery1_thumb.jpg",
        "caption": "Main entrance view",
        "sort_order": 0
      },
      {
        "media_id": "uuid",
        "url": "https://cdn.example.com/gallery2.jpg",
        "thumbnail_url": "https://cdn.example.com/gallery2_thumb.jpg",
        "caption": "Stage area",
        "sort_order": 1
      }
    ],
    "created_at": "2025-11-25T10:00:00Z",
    "updated_at": "2025-11-25T10:00:00Z"
  }
}
```

**Key Features:**

- ✅ All area attributes in one response
- ✅ Complete gallery with media URLs
- ✅ Boundary coordinates for polygon rendering
- ✅ Floor and revision context
- ✅ Cover image information

### Get Area Gallery Only

**Endpoint:** `GET /api/v1/editor/areas/{id}/gallery` ⭐ **NEW**

**Purpose:** Retrieve only the gallery items for an area (lighter weight than full details).

**Path Parameters:**

- `id` (UUID, required): Area identifier

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "media_id": "uuid",
      "url": "https://cdn.example.com/gallery1.jpg",
      "thumbnail_url": "https://cdn.example.com/gallery1_thumb.jpg",
      "caption": "Main entrance view",
      "sort_order": 0
    }
  ]
}
```

---

## ✏️ Area CRUD Operations (Editor Only)

### Create Area

**Endpoint:** `POST /api/v1/editor/floors/{floor_id}/areas`

**Purpose:** Create a new area within a specific floor.

**Path Parameters:**

- `floor_id` (UUID, required): Floor identifier

**Request Body:**

```json
{
  "name": "Conference Room A",
  "description": "Main conference room",
  "category": "meeting_room",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "boundary": [
    { "x": 100.0, "y": 200.0 },
    { "x": 200.0, "y": 200.0 },
    { "x": 200.0, "y": 300.0 },
    { "x": 100.0, "y": 300.0 }
  ],
  "cover_image_id": "uuid",
  "gallery": [
    {
      "media_asset_id": "uuid",
      "sort_order": 1,
      "caption": "Entrance view"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

### Update Area

**Endpoint:** `PUT /api/v1/editor/areas/{id}`

**Purpose:** Update area properties (partial updates supported).

**Path Parameters:**

- `id` (UUID, required): Area identifier

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Conference Room A",
  "description": "Updated description",
  "category": "meeting_room",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "boundary": [
    { "x": 100.0, "y": 200.0 },
    { "x": 200.0, "y": 200.0 }
  ],
  "floor_id": "uuid",
  "cover_image_id": "uuid"
}
```

### Delete Area

**Endpoint:** `DELETE /api/v1/editor/areas/{id}`

**Purpose:** Permanently delete an area.

**Path Parameters:**

- `id` (UUID, required): Area identifier

### Set Area Start Node

**Endpoint:** `PUT /api/v1/editor/areas/{id}/start-node`

**Purpose:** Set the starting point for 360° navigation within the area.

**Path Parameters:**

- `id` (UUID, required): Area identifier

**Request Body:**

```json
{
  "node_id": "uuid"
}
```

**Response:** May include warning if node is outside boundary.

---

## 🖼️ Area Gallery Management (Editor Only)

### Add Gallery Items

**Endpoint:** `POST /api/v1/editor/areas/{id}/gallery`

**Purpose:** Add multiple media items to an area's gallery.

**Path Parameters:**

- `id` (UUID, required): Area identifier

**Request Body:**

```json
{
  "items": [
    {
      "media_asset_id": "uuid",
      "caption": "Beautiful view",
      "sort_order": 1,
      "is_visible": true
    }
  ]
}
```

### Reorder Gallery

**Endpoint:** `PUT /api/v1/editor/areas/{id}/gallery/reorder`

**Purpose:** Change the display order of gallery items.

**Path Parameters:**

- `id` (UUID, required): Area identifier

**Request Body:**

```json
{
  "media_asset_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### Update Gallery Item

**Endpoint:** `PATCH /api/v1/editor/areas/{id}/gallery/{media_id}`

**Purpose:** Update properties of a specific gallery item.

**Path Parameters:**

- `id` (UUID, required): Area identifier
- `media_id` (UUID, required): Media asset identifier

**Request Body:** (all fields optional)

```json
{
  "caption": "Updated caption",
  "is_visible": false,
  "sort_order": 5
}
```

### Remove Gallery Item

**Endpoint:** `DELETE /api/v1/editor/areas/{id}/gallery/{media_id}`

**Purpose:** Remove a media item from the area's gallery.

**Path Parameters:**

- `id` (UUID, required): Area identifier
- `media_id` (UUID, required): Media asset identifier

---

## 🔒 Business Rules & Constraints

### Revision Management

- **Draft Required:** All modifications (create, update, delete, gallery ops) require the area to be in a draft revision
- **Published Protection:** Published areas cannot be modified directly
- **Status Filtering:** Use `status` parameter to work with draft/published/all areas

### Boundary Validation

- Must form valid polygons (minimum 3 points)
- Used for point-in-polygon checks when setting start nodes
- Coordinates are in floor plan coordinate space

### Gallery Constraints

- Gallery operations only allowed on draft revisions
- Media assets must exist before adding to gallery
- Sort order determines display sequence

### Coordinate Systems

- **Geographic:** `latitude`/`longitude` for map positioning
- **Floor Plan:** `x`/`y` coordinates for boundaries and nodes
- **Boundary:** Array of `{x, y}` points defining polygon

---

## 📊 Data Models

### AreaEditorDetail (Complete Area)

```typescript
interface AreaEditorDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  boundary: BoundaryPoint[];
  start_node_id?: string;
  floor_id: string;
  floor_name: string;
  revision_id: string;
  cover_image_id?: string;
  cover_url: string;
  gallery: AreaGalleryDetail[];
  created_at: string;
  updated_at: string;
}
```

### AreaGalleryDetail

```typescript
interface AreaGalleryDetail {
  media_id: string;
  url: string;
  thumbnail_url: string;
  caption: string;
  sort_order: number;
}
```

### BoundaryPoint

```typescript
interface BoundaryPoint {
  x: number;
  y: number;
}
```

---

## 🚨 Error Handling

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input/format
- `401 Unauthorized` - Missing/invalid auth
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server/database errors

### Error Response Format

```json
{
  "success": false,
  "message": "Detailed error message"
}
```

### Common Error Scenarios

- **Invalid UUID format:** "Invalid area_id format"
- **Draft revision required:** "Area gallery can only be modified in draft revisions"
- **Resource not found:** "Area not found"
- **Boundary validation:** "Area boundary must form a valid polygon"
- **Node outside boundary:** Warning when setting start node

---

## 🔄 API Evolution

### Recent Changes (v1.1)

- ✅ **Complete Area Details:** `GET /editor/areas/{id}` now returns all attributes + gallery
- ✅ **Gallery Retrieval:** `GET /editor/areas/{id}/gallery` for gallery-only access
- ✅ **Enhanced Models:** `AreaEditorDetail` provides comprehensive area data
- ✅ **Unified Response:** Single endpoint for complete area information

### Migration Notes

- **Old:** Multiple calls needed (area details + separate gallery call)
- **New:** One call to `GET /editor/areas/{id}` gets everything
- **Backward Compatible:** Existing endpoints still functional

---

## 📝 Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Get complete area details
const getAreaDetails = async (areaId: string) => {
  const response = await fetch(`/api/v1/editor/areas/${areaId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": organizationId,
    },
  });

  const { data: area } = await response.json();

  // Area now has all attributes + gallery
  console.log(area.name, area.gallery.length);
};

// Get only gallery
const getAreaGallery = async (areaId: string) => {
  const response = await fetch(`/api/v1/editor/areas/${areaId}/gallery`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": organizationId,
    },
  });

  const { data: gallery } = await response.json();
  return gallery;
};
```

### cURL Examples

```bash
# Get complete area details
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: $ORG_ID" \
     https://api.inspacemap.com/api/v1/editor/areas/$AREA_ID

# List areas with filtering
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: $ORG_ID" \
     "https://api.inspacemap.com/api/v1/venues/$VENUE_ID/areas?status=draft&limit=10"
```

---

## 🔗 Related Documentation

- [Media API Documentation](./MEDIA_API.md) - For uploading/managing media assets
- [Graph API Documentation](./GRAPH_API.md) - For node/edge management
- [Venue API Documentation](./VENUE_API.md) - For venue-level operations
- [Authentication Guide](./AUTH_GUIDE.md) - For token management

---

_Last Updated: November 25, 2025_
_Version: 1.1_</content>
<parameter name="filePath">c:\kuliahh maseh\mpt\backend\COMPREHENSIVE_AREA_API.md

# Area API Documentation for Editor

This document provides detailed API usage guide for area management endpoints specifically designed for editor consumption. All endpoints require authentication and tenant context.

## Base URL

```
/api/v1/editor
```

## Authentication

All requests must include:

- `Authorization: Bearer <token>` header
- `X-Tenant-ID` header with organization ID

---

## Area CRUD Operations

### Create Area

Create a new area within a floor.

**Endpoint:** `POST /floors/{floor_id}/areas`

**Path Parameters:**

- `floor_id` (UUID): The ID of the floor where the area will be created

**Request Body:**

```json
{
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
  "cover_image_id": "550e8400-e29b-41d4-a716-446655440000",
  "gallery": [
    {
      "media_asset_id": "550e8400-e29b-41d4-a716-446655440001",
      "sort_order": 1,
      "caption": "Main entrance view"
    }
  ]
}
```

**Field Descriptions:**

- `name` (string, required): Area name
- `description` (string): Area description
- `category` (string): Area category (e.g., "meeting_room", "office", "lobby")
- `latitude` (float64): Geographic latitude coordinate
- `longitude` (float64): Geographic longitude coordinate
- `boundary` (array of BoundaryPoint): Array of points defining the area's polygon boundary
- `cover_image_id` (UUID): ID of the media asset to use as cover image
- `gallery` (array): Initial gallery items for the area

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid JSON or missing required fields
- `400 Bad Request`: Invalid floor_id format
- `500 Internal Server Error`: Database or server error

---

### Update Area

Update an existing area's properties.

**Endpoint:** `PUT /areas/{id}`

**Path Parameters:**

- `id` (UUID): The ID of the area to update

**Request Body:**

```json
{
  "name": "Updated Conference Room A",
  "description": "Updated description for the main conference room",
  "category": "meeting_room",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "boundary": [
    { "x": 100.0, "y": 200.0 },
    { "x": 200.0, "y": 200.0 },
    { "x": 200.0, "y": 300.0 },
    { "x": 100.0, "y": 300.0 }
  ],
  "cover_image_id": "550e8400-e29b-41d4-a716-446655440000",
  "floor_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Field Descriptions:**

- All fields are optional for update operations
- `floor_id` (UUID): Can be used to move area to different floor
- `boundary` (array): Must be a valid polygon (at least 3 points)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Area updated"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid area_id or JSON format
- `500 Internal Server Error`: Area not in draft revision, database error, or validation failure

---

### Delete Area

Delete an existing area.

**Endpoint:** `DELETE /areas/{id}`

**Path Parameters:**

- `id` (UUID): The ID of the area to delete

**Request Body:** None

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Area deleted"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid area_id format
- `500 Internal Server Error`: Area not in draft revision or database error

---

### Set Area Start Node

Set the starting node for 360° navigation within an area.

**Endpoint:** `PUT /areas/{id}/start-node`

**Path Parameters:**

- `id` (UUID): The ID of the area

**Request Body:**

```json
{
  "node_id": "550e8400-e29b-41d4-a716-446655440004"
}
```

**Field Descriptions:**

- `node_id` (UUID, required): ID of the graph node to set as start point

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "warning": "The selected node is outside the area boundary"
  }
}
```

**Response Notes:**

- Returns a warning if the selected node is outside the area boundary
- The start node is still set even with the warning
- Node must be on the same floor as the area

**Error Responses:**

- `400 Bad Request`: Invalid area_id or node_id format, or invalid JSON
- `500 Internal Server Error`: Area not in draft revision, node not found, or node/area floor mismatch

---

## Area Gallery Management

### Add Gallery Items

Add multiple media items to an area's gallery.

**Endpoint:** `POST /areas/{id}/gallery`

**Path Parameters:**

- `id` (UUID): The ID of the area

**Request Body:**

```json
{
  "items": [
    {
      "media_asset_id": "550e8400-e29b-41d4-a716-446655440005",
      "caption": "Beautiful view from the entrance",
      "sort_order": 1,
      "is_visible": true
    },
    {
      "media_asset_id": "550e8400-e29b-41d4-a716-446655440006",
      "caption": "Stage area",
      "sort_order": 2,
      "is_visible": true
    }
  ]
}
```

**Field Descriptions:**

- `items` (array, required): Array of gallery items to add
- `media_asset_id` (UUID, required): ID of the uploaded media asset
- `caption` (string): Optional caption for the image
- `sort_order` (int): Display order (lower numbers appear first)
- `is_visible` (bool): Whether the item is visible in the gallery

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Items added to area gallery"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid area_id format or JSON structure
- `500 Internal Server Error`: Area not in draft revision or database error

---

### Reorder Gallery Items

Change the display order of gallery items.

**Endpoint:** `PUT /areas/{id}/gallery/reorder`

**Path Parameters:**

- `id` (UUID): The ID of the area

**Request Body:**

```json
{
  "media_asset_ids": [
    "550e8400-e29b-41d4-a716-446655440006",
    "550e8400-e29b-41d4-a716-446655440005",
    "550e8400-e29b-41d4-a716-446655440007"
  ]
}
```

**Field Descriptions:**

- `media_asset_ids` (array of UUID, required): Ordered array of media asset IDs
- Order in the array determines the sort_order (first item gets sort_order 0)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Area gallery reordered"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid area_id format or JSON structure
- `500 Internal Server Error`: Area not in draft revision or database error

---

### Update Gallery Item

Update properties of a specific gallery item.

**Endpoint:** `PATCH /areas/{id}/gallery/{media_id}`

**Path Parameters:**

- `id` (UUID): The ID of the area
- `media_id` (UUID): The ID of the media asset in the gallery

**Request Body:**

```json
{
  "caption": "Updated caption for this beautiful view",
  "is_visible": false,
  "sort_order": 5
}
```

**Field Descriptions:**

- All fields are optional
- `caption` (string): Update the image caption
- `is_visible` (bool): Change visibility status
- `sort_order` (int): Change display order

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Item updated"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid area_id or media_id format
- `500 Internal Server Error`: Area not in draft revision or item not found

---

### Remove Gallery Item

Remove a specific media item from the area's gallery.

**Endpoint:** `DELETE /areas/{id}/gallery/{media_id}`

**Path Parameters:**

- `id` (UUID): The ID of the area
- `media_id` (UUID): The ID of the media asset to remove

**Request Body:** None

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Item removed"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid area_id or media_id format
- `500 Internal Server Error`: Area not in draft revision or item not found

---

## Important Notes

### Revision Constraints

- All area modification operations (create, update, delete, set start node, gallery operations) require the area to be in a **draft revision**
- Attempting to modify areas in published revisions will result in a 500 error: "area is not in a draft revision"

### Boundary Validation

- Area boundaries must form valid polygons (minimum 3 points)
- Points are defined in 2D coordinate space relative to the floor plan
- Use the Ray Casting algorithm for point-in-polygon validation when setting start nodes

### Media Assets

- All media references use `media_asset_id` (UUID) pointing to uploaded assets
- Cover images and gallery items must reference existing media assets
- Use the Media API endpoints to upload and manage media assets first

### Error Handling

- All endpoints return standardized error responses with appropriate HTTP status codes
- Check the `success` field in responses to verify operation status
- Error messages provide specific details about validation failures or constraint violations

### Coordinate Systems

- Geographic coordinates (`latitude`, `longitude`) are used for map positioning
- Boundary coordinates (`x`, `y`) are in floor plan coordinate space
- Node coordinates are also in floor plan coordinate space for boundary validation

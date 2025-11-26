# Editor Manifest Area Integration - Frontend Agent Guide

## Overview

The editor manifest endpoint (`GET /api/v1/editor/:revision_id`) has been updated to include comprehensive area data alongside existing node data. This enables the editor interface to display, edit, and manage areas within the visual editor.

## What Changed

### 1. FloorData Structure Enhanced

The `FloorData` object now includes an `areas` array containing all areas for that floor:

```typescript
interface FloorData {
  id: string;
  name: string;
  level_index: number;
  map_image_url: string;
  width: number;
  height: number;
  nodes: NodeData[];
  areas: AreaData[]; // ← NEW: Array of areas for this floor
}
```

### 2. New AreaData Structure

Complete area information is now provided for each floor:

```typescript
interface AreaData {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  boundary: BoundaryPoint[];
  start_node_id?: string;
  cover_image_url?: string;
  gallery: AreaGalleryDetail[];
}

interface BoundaryPoint {
  x: number;
  y: number;
}

interface AreaGalleryDetail {
  media_id: string;
  url: string;
  thumbnail_url: string;
  caption: string;
  sort_order: number;
}
```

## Frontend Integration Tasks

### 1. Update Type Definitions

Add the new interfaces to your TypeScript definitions:

```typescript
// Add to your existing types
interface AreaData {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  boundary: BoundaryPoint[];
  start_node_id?: string;
  cover_image_url?: string;
  gallery: AreaGalleryDetail[];
}

interface BoundaryPoint {
  x: number;
  y: number;
}

interface AreaGalleryDetail {
  media_id: string;
  url: string;
  thumbnail_url: string;
  caption: string;
  sort_order: number;
}

// Update FloorData interface
interface FloorData {
  id: string;
  name: string;
  level_index: number;
  map_image_url: string;
  width: number;
  height: number;
  nodes: NodeData[];
  areas: AreaData[]; // Add this field
}
```

### 2. Update API Response Handling

Modify your manifest loading logic to handle the new areas data:

```typescript
// Before
const manifest = await fetch(`/api/v1/editor/${revisionId}`);
const data: { floors: FloorData[] } = await manifest.json();

// After - areas are now included
const manifest = await fetch(`/api/v1/editor/${revisionId}`);
const data: { floors: FloorData[] } = await manifest.json();

// Now each floor has areas
data.floors.forEach((floor) => {
  console.log(`Floor ${floor.name} has ${floor.areas.length} areas`);
});
```

### 3. Implement Area Visualization

Add area rendering to your floor map component:

```typescript
function renderFloorAreas(floor: FloorData, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;

  floor.areas.forEach((area) => {
    // Draw area boundary
    ctx.beginPath();
    ctx.strokeStyle = "#007bff";
    ctx.lineWidth = 2;

    area.boundary.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    ctx.closePath();
    ctx.stroke();

    // Add area label
    const centerX =
      area.boundary.reduce((sum, p) => sum + p.x, 0) / area.boundary.length;
    const centerY =
      area.boundary.reduce((sum, p) => sum + p.y, 0) / area.boundary.length;

    ctx.fillStyle = "#007bff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(area.name, centerX, centerY);
  });
}
```

### 4. Area Management UI

Create UI components for area CRUD operations:

```typescript
// Area List Component
function AreaList({ floor }: { floor: FloorData }) {
  return (
    <div className="area-list">
      {floor.areas.map((area) => (
        <div key={area.id} className="area-item">
          <h4>{area.name}</h4>
          <p>{area.description}</p>
          <span className="category">{area.category}</span>

          {/* Area Gallery */}
          <div className="area-gallery">
            {area.gallery.map((item) => (
              <img
                key={item.media_id}
                src={item.thumbnail_url}
                alt={item.caption}
                title={item.caption}
              />
            ))}
          </div>

          {/* Start Node Indicator */}
          {area.start_node_id && (
            <span className="start-node-badge">
              Start Node: {area.start_node_id}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 5. Area Editing Tools

Implement area editing functionality:

```typescript
// Area Boundary Editor
class AreaEditor {
  private isDrawing = false;
  private currentArea: BoundaryPoint[] = [];

  startDrawing(point: BoundaryPoint) {
    this.isDrawing = true;
    this.currentArea = [point];
  }

  addPoint(point: BoundaryPoint) {
    if (this.isDrawing) {
      this.currentArea.push(point);
    }
  }

  finishDrawing(): BoundaryPoint[] {
    this.isDrawing = false;
    const area = [...this.currentArea];
    this.currentArea = [];
    return area;
  }

  // Validate polygon (minimum 3 points, no self-intersection)
  validateArea(boundary: BoundaryPoint[]): boolean {
    return boundary.length >= 3;
  }
}
```

### 6. Node-Area Association

Update node editing to show area relationships:

```typescript
// Enhanced Node Component
function NodeComponent({ node, areas }: { node: NodeData; areas: AreaData[] }) {
  const nodeArea = areas.find((area) => area.id === node.area_id);

  return (
    <div className="node">
      <div className="node-position">
        ({node.x}, {node.y})
      </div>

      {nodeArea && <div className="node-area">Area: {nodeArea.name}</div>}

      {/* Start node indicators */}
      {areas.some((area) => area.start_node_id === node.id) && (
        <div className="start-node-indicator">🚀</div>
      )}
    </div>
  );
}
```

### 7. Area API Integration

Connect to area CRUD endpoints for editing:

```typescript
class AreaService {
  private baseUrl = "/api/v1/editor";

  async createArea(floorId: string, areaData: Partial<AreaData>) {
    const response = await fetch(`${this.baseUrl}/floors/${floorId}/areas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(areaData),
    });
    return response.json();
  }

  async updateArea(areaId: string, updates: Partial<AreaData>) {
    const response = await fetch(`${this.baseUrl}/areas/${areaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  async deleteArea(areaId: string) {
    await fetch(`${this.baseUrl}/areas/${areaId}`, {
      method: "DELETE",
    });
  }

  async setAreaStartNode(areaId: string, nodeId: string) {
    const response = await fetch(`${this.baseUrl}/areas/${areaId}/start-node`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node_id: nodeId }),
    });
    return response.json();
  }

  async updateAreaGallery(areaId: string, items: any[]) {
    const response = await fetch(`${this.baseUrl}/areas/${areaId}/gallery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    return response.json();
  }
}
```

## Data Flow Updates

### 1. Manifest Loading

```typescript
// Updated manifest loading
async function loadEditorManifest(revisionId: string) {
  const response = await fetch(`/api/v1/editor/${revisionId}`);
  const manifest = await response.json();

  // Process areas for each floor
  manifest.floors.forEach((floor) => {
    floor.areas.forEach((area) => {
      // Initialize area state
      initializeArea(area);

      // Load area gallery
      loadAreaGallery(area);
    });
  });

  return manifest;
}
```

### 2. State Management

```typescript
interface EditorState {
  floors: FloorData[];
  selectedFloorId?: string;
  selectedAreaId?: string;
  selectedNodeId?: string;
  toolMode: "select" | "draw_area" | "edit_nodes";
}

// Update state when manifest loads
function updateEditorState(manifest: ManifestResponse) {
  setFloors(manifest.floors);
  setSelectedFloorId(manifest.floors[0]?.id);
}
```

## Migration Notes

### Breaking Changes

- `FloorData` now includes `areas` array (non-breaking, defaults to empty array)
- New `AreaData` type provides comprehensive area information

### Backward Compatibility

- Existing node-based functionality unchanged
- Areas are additive - existing code continues to work
- Mobile manifest structure unchanged (separate endpoint)

### Performance Considerations

- Area gallery images use thumbnails for editor performance
- Boundary coordinates are in pixel space for direct canvas rendering
- Consider lazy-loading area details for large venues

## Testing Checklist

- [ ] Manifest loads with areas data
- [ ] Area boundaries render correctly on floor maps
- [ ] Area gallery displays properly
- [ ] Area CRUD operations work through API
- [ ] Node-area associations display correctly
- [ ] Start node indicators show properly
- [ ] Area editing tools function correctly

## Next Steps

1. Implement area boundary drawing tools
2. Add area property editing forms
3. Create area gallery management UI
4. Implement area-node relationship visualization
5. Add area validation (polygon integrity, overlap detection)
6. Test with real venue data</content>
   <parameter name="filePath">c:\kuliahh maseh\mpt\backend\EDITOR_MANIFEST_AREAS_GUIDE.md

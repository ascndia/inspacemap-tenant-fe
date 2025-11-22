// Graph Editor Types and Interfaces

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GraphNode {
  id: string;
  position: Vector3; // Position on the floorplan (x, y, z)
  rotation: number; // Panorama rotation offset (0-360°)
  pitch: number; // Panorama pitch offset (-90° to +90°)
  heading: number; // Viewing direction (0-360°)
  fov: number; // Field of view (default 75°)
  connections: string[]; // Array of connected node IDs
  panoramaUrl?: string; // Associated 360° image URL
  label?: string; // Optional display label
  locked?: boolean; // Whether the node is locked (cannot be moved)
  metadata?: Record<string, any>; // Additional custom data
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number; // Calculated distance between nodes
  bidirectional: boolean; // Whether connection works both ways
  metadata?: Record<string, any>; // Additional connection data
  createdAt: Date;
  updatedAt: Date;
}

export interface Floorplan {
  id: string;
  venueId: string;
  floorId: string;
  name: string;
  fileUrl: string; // URL to floorplan file (PDF/SVG)
  scale: number; // Scale factor for real-world measurements
  bounds: {
    width: number;
    height: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PanoramaImage {
  id: string;
  nodeId?: string; // Associated node ID if linked
  fileUrl: string;
  thumbnailUrl?: string;
  filename: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  metadata?: Record<string, any>;
  uploadedAt: Date;
}

export interface GraphData {
  id: string;
  venueId: string;
  floorId: string;
  name: string;
  nodes: GraphNode[];
  connections: GraphConnection[];
  floorplan?: Floorplan;
  panoramas: PanoramaImage[];
  settings: GraphSettings;
  version: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showLabels: boolean;
  showConnections: boolean;
  connectionStyle: "straight" | "curved";
  nodeSize: number;
  autoSave: boolean;
  collaboration: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GraphStats {
  nodeCount: number;
  connectionCount: number;
  isolatedNodes: number;
  connectedComponents: number;
  averageDegree: number;
  maxDegree: number;
  totalDistance: number;
  averageDistance: number;
  hasPanoramas: number;
  missingPanoramas: number;
  density: number;
  diameter: number;
  clusteringCoefficient: number;
}

export interface PanoramaView {
  rotation: number;
  pitch: number;
  heading: number;
  fov: number;
  position: Vector3;
}

// Engine Interfaces (for future 3D implementation)
export interface FloorplanRenderer {
  loadFloorplan(file: File): Promise<void>;
  renderFloorplan(): any; // THREE.Mesh in actual implementation
  setScale(scale: number): void;
  setPosition(x: number, y: number): void;
  getBounds(): { width: number; height: number };
  dispose(): void;
}

export interface GraphCreator {
  createNode(position: Vector3, attributes?: Partial<GraphNode>): GraphNode;
  connectNodes(fromNode: GraphNode, toNode: GraphNode): GraphConnection;
  deleteNode(nodeId: string): void;
  deleteConnection(connectionId: string): void;
  validateGraph(): ValidationResult;
  exportGraph(): GraphData;
  importGraph(data: GraphData): void;
}

export interface PanoramaPreview {
  loadPanorama(imageUrl: string): Promise<void>;
  setRotation(rotation: number): void;
  setPitch(pitch: number): void;
  setHeading(heading: number): void;
  setFov(fov: number): void;
  getCurrentView(): PanoramaView;
  takeSnapshot(): string; // Returns base64 image
  dispose(): void;
}

export interface GraphEngine {
  // Floorplan Management
  loadFloorplan(floorId: string, svgData: string): Promise<void>;
  renderFloorplan(): any; // THREE.Mesh

  // Graph Operations
  createNode(position: Vector3, attributes: Partial<GraphNode>): GraphNode;
  connectNodes(fromNode: GraphNode, toNode: GraphNode): GraphConnection;
  validateGraph(): ValidationResult;

  // Panorama Preview
  loadPanorama(nodeId: string, imageUrl: string): Promise<void>;
  updateNodeAttributes(nodeId: string, attributes: Partial<GraphNode>): void;
  renderPanoramaPreview(nodeId: string): any; // THREE.Scene

  // Cleanup
  dispose(): void;
}

// Action Types for State Management
export type GraphAction =
  | {
      type: "ADD_NODE";
      payload: { position: Vector3; attributes?: Partial<GraphNode> };
    }
  | {
      type: "UPDATE_NODE";
      payload: { nodeId: string; updates: Partial<GraphNode> };
    }
  | { type: "DELETE_NODE"; payload: { nodeId: string } }
  | {
      type: "ADD_CONNECTION";
      payload: { fromNodeId: string; toNodeId: string };
    }
  | { type: "DELETE_CONNECTION"; payload: { connectionId: string } }
  | { type: "LOAD_FLOORPLAN"; payload: { floorplan: Floorplan } }
  | { type: "SET_SELECTED_NODE"; payload: { nodeId: string | null } }
  | {
      type: "SET_SELECTED_CONNECTION";
      payload: { connectionId: string | null };
    }
  | { type: "UPDATE_SETTINGS"; payload: { settings: Partial<GraphSettings> } }
  | { type: "LOAD_GRAPH"; payload: { graph: GraphData } }
  | { type: "RESET_GRAPH" }
  | { type: "UNDO" }
  | { type: "REDO" };

// UI State Types
export interface GraphUIState {
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  hoveredNodeId: string | null;
  hoveredConnectionId: string | null;
  isConnecting: boolean;
  connectingFromId: string | null;
  tool: "select" | "add-node" | "connect" | "pan" | "zoom";
  zoom: number;
  panOffset: Vector3;
  showProperties: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
}

// Venue and Floor Types (extending existing mock data)
export interface Venue {
  id: string;
  name: string;
  address: string;
  status: "draft" | "published" | "archived";
  location: {
    lat: number;
    lng: number;
  };
  floors: Floor[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Floor {
  id: string;
  venueId: string;
  name: string;
  level: number; // Floor level (0 = ground, 1 = first floor, etc.)
  floorplan?: Floorplan;
  graph?: GraphData;
  areas: Area[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Area {
  id: string;
  floorId: string;
  name: string;
  category: string; // 'entrance', 'dining', 'entertainment', etc.
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Graph Revision Types (for API integration)
export interface GraphRevision {
  id: string;
  venue_id: string;
  status: "draft" | "published" | "archived";
  note?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  floors?: GraphRevisionFloor[];
}

export interface GraphRevisionFloor {
  id: string;
  name: string;
  level_index: number;
  map_image_url?: string;
  map_width?: number;
  map_height?: number;
  pixels_per_meter?: number;
  is_active: boolean;
  nodes_count: number;
  areas_count: number;
}

export interface GraphRevisionDetail extends GraphRevision {
  floors: GraphRevisionFloor[];
}

export interface CreateDraftRevisionRequest {
  venue_id: string;
  note?: string;
}

export interface CreateDraftRevisionResponse {
  success: boolean;
  data: {
    id: string;
  };
}

export interface ListRevisionsResponse {
  success: boolean;
  data: GraphRevision[];
}

export interface GetRevisionDetailResponse {
  success: boolean;
  data: GraphRevisionDetail;
}

export interface DeleteRevisionResponse {
  success: boolean;
  data: string;
}

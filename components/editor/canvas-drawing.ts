"use client";

import { GraphNode, GraphConnection, Area } from "@/types/graph";

export interface DrawParams {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  panOffset: { x: number; y: number };
  zoom: number;
  floorplanImage: HTMLImageElement | null;
  graph: {
    nodes: GraphNode[];
    connections: GraphConnection[];
    areas: Area[];
    floorplan?: any;
    settings: any;
  };
  ui: {
    showGrid: boolean;
    selectedNodeId: string | null;
    selectedAreaId: string | null;
    isConnecting?: boolean;
    connectingFromId?: string | null;
    hoveredNodeId?: string | null;
    hoveredAreaId?: string | null;
    hoveredAreaVertex?: { areaId: string; vertexIndex: number } | null;
    mousePosition?: { x: number; y: number };
    isDrawingArea?: boolean;
    drawingAreaVertices?: { x: number; y: number }[];
    draggingAreaId?: string | null;
  };
  pathPreview: string[] | null;
}

export function drawCanvas(params: DrawParams) {
  const {
    ctx,
    canvas,
    panOffset,
    zoom,
    floorplanImage,
    graph,
    ui,
    pathPreview,
  } = params;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Save context for transformations
  ctx.save();

  // Apply zoom and pan
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(zoom, zoom);

  // Draw floorplan background if available
  drawFloorplan(
    ctx,
    floorplanImage,
    graph.floorplan,
    graph.settings.floorplanOpacity
  );

  // Draw grid
  if (ui.showGrid) {
    drawGrid(ctx, zoom, graph.settings.gridSize || 20);
  }

  // Draw connections
  drawConnections(ctx, zoom, graph.connections, graph.nodes);

  // Draw areas
  drawAreas(
    ctx,
    zoom,
    graph.areas,
    ui.selectedAreaId,
    ui.hoveredAreaId,
    ui.hoveredAreaVertex,
    ui.draggingAreaId
  );

  // Draw area drawing preview
  if (
    ui.isDrawingArea &&
    ui.drawingAreaVertices &&
    ui.drawingAreaVertices.length > 0
  ) {
    const isDrawingComplete = ui.drawingAreaVertices.length >= 3;
    drawAreaPreview(
      ctx,
      zoom,
      ui.drawingAreaVertices,
      ui.mousePosition,
      isDrawingComplete
    );
  }

  // Draw connection preview when connecting
  if (ui.isConnecting && ui.connectingFromId && ui.mousePosition) {
    drawConnectionPreview(
      ctx,
      zoom,
      ui.connectingFromId,
      ui.mousePosition,
      graph.nodes
    );
  }

  // Draw path preview
  if (pathPreview && pathPreview.length > 1) {
    drawPathPreview(ctx, zoom, pathPreview, graph.nodes);
  }

  // Draw nodes
  drawNodes(
    ctx,
    zoom,
    graph.nodes,
    ui.selectedNodeId,
    ui.isConnecting,
    ui.connectingFromId,
    ui.hoveredNodeId
  );

  ctx.restore();
}

function drawFloorplan(
  ctx: CanvasRenderingContext2D,
  floorplanImage: HTMLImageElement | null,
  floorplan: any,
  floorplanOpacity: number = 0.5
) {
  if (floorplanImage && floorplan) {
    const scale = floorplan.scale || 1;
    const imgWidth = floorplanImage.width * scale;
    const imgHeight = floorplanImage.height * scale;

    // Center the floorplan
    const offsetX = -imgWidth / 2;
    const offsetY = -imgHeight / 2;

    // Save current global alpha
    const originalAlpha = ctx.globalAlpha;

    // Set floorplan opacity
    ctx.globalAlpha = floorplanOpacity;

    ctx.drawImage(floorplanImage, offsetX, offsetY, imgWidth, imgHeight);

    // Restore original alpha
    ctx.globalAlpha = originalAlpha;
  } else if (floorplan) {
    // Placeholder when image is loading
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(-500, -500, 1000, 1000);
    ctx.strokeStyle = "#ccc";
    ctx.strokeRect(-500, -500, 1000, 1000);
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Loading floorplan...", 0, 0);
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  gridSize: number
) {
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1 / zoom;

  // Draw more grid lines for better coverage
  const gridRange = 2000; // Increased from 500 to 2000

  for (let x = -gridRange; x <= gridRange; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, -gridRange);
    ctx.lineTo(x, gridRange);
    ctx.stroke();
  }

  for (let y = -gridRange; y <= gridRange; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(-gridRange, y);
    ctx.lineTo(gridRange, y);
    ctx.stroke();
  }
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  connections: GraphConnection[],
  nodes: GraphNode[]
) {
  connections.forEach((connection) => {
    const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
    const toNode = nodes.find((n) => n.id === connection.toNodeId);

    if (fromNode && toNode) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.moveTo(fromNode.position.x, fromNode.position.y);
      ctx.lineTo(toNode.position.x, toNode.position.y);
      ctx.stroke();

      // Draw arrow head
      const angle = Math.atan2(
        toNode.position.y - fromNode.position.y,
        toNode.position.x - fromNode.position.x
      );
      const arrowLength = 10 / zoom;
      ctx.beginPath();
      ctx.moveTo(toNode.position.x, toNode.position.y);
      ctx.lineTo(
        toNode.position.x - arrowLength * Math.cos(angle - Math.PI / 6),
        toNode.position.y - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(toNode.position.x, toNode.position.y);
      ctx.lineTo(
        toNode.position.x - arrowLength * Math.cos(angle + Math.PI / 6),
        toNode.position.y - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  });
}

function drawConnectionPreview(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  fromNodeId: string,
  mousePosition: { x: number; y: number },
  nodes: GraphNode[]
) {
  const fromNode = nodes.find((n) => n.id === fromNodeId);
  if (!fromNode) return;

  // Draw preview connection line
  ctx.strokeStyle = "#f59e0b"; // Orange color for preview
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([5 / zoom, 5 / zoom]); // Dashed line

  ctx.beginPath();
  ctx.moveTo(fromNode.position.x, fromNode.position.y);
  ctx.lineTo(mousePosition.x, mousePosition.y);
  ctx.stroke();

  ctx.setLineDash([]); // Reset dash
}

function drawPathPreview(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  pathPreview: string[],
  nodes: GraphNode[]
) {
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 3 / zoom;
  ctx.setLineDash([5 / zoom, 5 / zoom]);

  for (let i = 0; i < pathPreview.length - 1; i++) {
    const fromNode = nodes.find((n) => n.id === pathPreview[i]);
    const toNode = nodes.find((n) => n.id === pathPreview[i + 1]);

    if (fromNode && toNode) {
      ctx.beginPath();
      ctx.moveTo(fromNode.position.x, fromNode.position.y);
      ctx.lineTo(toNode.position.x, toNode.position.y);
      ctx.stroke();
    }
  }

  ctx.setLineDash([]);
}

export function getConnectionAtPoint(
  x: number,
  y: number,
  connections: GraphConnection[],
  nodes: GraphNode[],
  tolerance: number = 5
): GraphConnection | null {
  for (const connection of connections) {
    const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
    const toNode = nodes.find((n) => n.id === connection.toNodeId);

    if (fromNode && toNode) {
      // Check if point is near the line segment
      if (
        pointToLineDistance(x, y, fromNode.position, toNode.position) <=
        tolerance
      ) {
        return connection;
      }
    }
  }
  return null;
}

function pointToLineDistance(
  px: number,
  py: number,
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0)
    return Math.sqrt((px - lineStart.x) ** 2 + (py - lineStart.y) ** 2);

  const t = Math.max(
    0,
    Math.min(
      1,
      ((px - lineStart.x) * dx + (py - lineStart.y) * dy) / (length * length)
    )
  );
  const closestX = lineStart.x + t * dx;
  const closestY = lineStart.y + t * dy;

  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  nodes: GraphNode[],
  selectedNodeId: string | null,
  isConnecting?: boolean,
  connectingFromId?: string | null,
  hoveredNodeId?: string | null
) {
  nodes.forEach((node) => {
    const isSelected = selectedNodeId === node.id;
    const isConnectingFrom = connectingFromId === node.id;
    const isHovered = hoveredNodeId === node.id;
    const isValidTarget = isConnecting && connectingFromId !== node.id;

    // Determine radius based on state
    let radius = 8 / zoom;
    if (isConnectingFrom) {
      radius = 12 / zoom; // Enlarge connecting from node
    } else if (isHovered && isValidTarget) {
      radius = 12 / zoom; // Enlarge hovered target node in connect mode
    } else if (isHovered) {
      radius = 10 / zoom; // Slightly enlarge hovered node
    }

    // Node circle
    ctx.fillStyle = isSelected
      ? "#3b82f6"
      : isConnectingFrom
      ? "#f59e0b" // Orange for connecting from
      : isHovered && isValidTarget
      ? "#10b981" // Green for valid target
      : node.panorama_url
      ? "#22c55e"
      : "#6b7280";

    // Add glow effect for connect mode
    if (isConnecting && (isHovered || isConnectingFrom)) {
      ctx.shadowColor = isConnectingFrom ? "#f59e0b" : "#10b981";
      ctx.shadowBlur = 8 / zoom;
    }

    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Node border
    ctx.strokeStyle = isSelected ? "#1e40af" : "#374151";
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();

    // Lock indicator for locked nodes
    if (node.locked) {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(
        node.position.x + radius * 0.7,
        node.position.y - radius * 0.7,
        3 / zoom,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Node label
    ctx.fillStyle = "#000";
    ctx.font = `${12 / zoom}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(
      node.label || `Node ${node.id.slice(0, 4)}`,
      node.position.x,
      node.position.y - radius - 5 / zoom
    );
  });
}

function drawAreas(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  areas: Area[],
  selectedAreaId: string | null | undefined,
  hoveredAreaId: string | null | undefined,
  hoveredAreaVertex: { areaId: string; vertexIndex: number } | null | undefined,
  draggingAreaId?: string | null
) {
  areas.forEach((area) => {
    const isSelected = selectedAreaId === area.id;
    const isHovered = hoveredAreaId === area.id;
    const isDragging = draggingAreaId === area.id;

    // Set area color based on category
    const categoryColors: Record<string, string> = {
      meeting_room: "#3b82f6",
      office: "#10b981",
      lobby: "#f59e0b",
      dining: "#ef4444",
      entertainment: "#8b5cf6",
      service: "#f97316",
    };

    const fillColor = categoryColors[area.category] || "#6b7280";
    const strokeColor =
      isSelected || isDragging ? "#1e40af" : isHovered ? "#374151" : "#4b5563";

    // Draw filled polygon
    ctx.fillStyle = isDragging ? fillColor + "60" : fillColor + "40"; // More transparent when dragging
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSelected || isDragging ? 3 / zoom : 2 / zoom;

    ctx.beginPath();
    if (area.boundary.length > 0) {
      ctx.moveTo(area.boundary[0].x, area.boundary[0].y);
      for (let i = 1; i < area.boundary.length; i++) {
        ctx.lineTo(area.boundary[i].x, area.boundary[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw vertex handles for selected area
    if (isSelected && !isDragging) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#1e40af";
      ctx.lineWidth = 1 / zoom;

      area.boundary.forEach((vertex, vertexIndex) => {
        const isVertexHovered =
          hoveredAreaVertex?.areaId === area.id &&
          hoveredAreaVertex?.vertexIndex === vertexIndex;
        const radius = isVertexHovered ? 8 / zoom : 6 / zoom;

        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    }

    // Draw area label
    if (area.boundary.length > 0) {
      const centerX =
        area.boundary.reduce((sum, p) => sum + p.x, 0) / area.boundary.length;
      const centerY =
        area.boundary.reduce((sum, p) => sum + p.y, 0) / area.boundary.length;

      ctx.fillStyle = "#000000";
      ctx.font = `${14 / zoom}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(area.name, centerX, centerY);
    }
  });
}

function drawAreaPreview(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  vertices: { x: number; y: number }[],
  mousePosition?: { x: number; y: number },
  isDrawingComplete: boolean = false
) {
  if (vertices.length === 0) return;

  // Draw existing vertices and lines
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2 / zoom;
  ctx.fillStyle = "#3b82f6";

  // Draw lines between vertices
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }

  // Only draw line to mouse position if still actively drawing and not complete
  if (mousePosition && !isDrawingComplete && vertices.length >= 2) {
    ctx.lineTo(mousePosition.x, mousePosition.y);
  }

  ctx.stroke();

  // Draw vertex circles
  vertices.forEach((vertex) => {
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, 4 / zoom, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Draw mouse position circle only when actively drawing
  if (mousePosition && !isDrawingComplete && vertices.length >= 2) {
    ctx.beginPath();
    ctx.arc(mousePosition.x, mousePosition.y, 4 / zoom, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw closing hint when near first vertex
  if (vertices.length >= 3 && mousePosition) {
    const firstVertex = vertices[0];
    const distance = Math.sqrt(
      Math.pow(mousePosition.x - firstVertex.x, 2) +
        Math.pow(mousePosition.y - firstVertex.y, 2)
    );

    if (distance < 20 / zoom) {
      // Draw a hint circle around the first vertex
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.beginPath();
      ctx.arc(firstVertex.x, firstVertex.y, 15 / zoom, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

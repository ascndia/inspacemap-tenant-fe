"use client";

import { GraphNode, GraphConnection } from "@/types/graph";

export interface DrawParams {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  panOffset: { x: number; y: number };
  zoom: number;
  floorplanImage: HTMLImageElement | null;
  graph: {
    nodes: GraphNode[];
    connections: GraphConnection[];
    floorplan?: any;
    settings: any;
  };
  ui: {
    showGrid: boolean;
    selectedNodeId: string | null;
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
  drawFloorplan(ctx, floorplanImage, graph.floorplan);

  // Draw grid
  if (ui.showGrid) {
    drawGrid(ctx, zoom, graph.settings.gridSize || 20);
  }

  // Draw connections
  drawConnections(ctx, zoom, graph.connections, graph.nodes);

  // Draw path preview
  if (pathPreview && pathPreview.length > 1) {
    drawPathPreview(ctx, zoom, pathPreview, graph.nodes);
  }

  // Draw nodes
  drawNodes(ctx, zoom, graph.nodes, ui.selectedNodeId);

  ctx.restore();
}

function drawFloorplan(
  ctx: CanvasRenderingContext2D,
  floorplanImage: HTMLImageElement | null,
  floorplan: any
) {
  if (floorplanImage && floorplan) {
    const scale = floorplan.scale || 1;
    const imgWidth = floorplanImage.width * scale;
    const imgHeight = floorplanImage.height * scale;

    // Center the floorplan
    const offsetX = -imgWidth / 2;
    const offsetY = -imgHeight / 2;

    ctx.drawImage(floorplanImage, offsetX, offsetY, imgWidth, imgHeight);
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

  for (let x = -500; x <= 500; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, -500);
    ctx.lineTo(x, 500);
    ctx.stroke();
  }

  for (let y = -500; y <= 500; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(-500, y);
    ctx.lineTo(500, y);
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

function drawNodes(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  nodes: GraphNode[],
  selectedNodeId: string | null
) {
  nodes.forEach((node) => {
    const isSelected = selectedNodeId === node.id;
    const radius = 8 / zoom;

    // Node circle
    ctx.fillStyle = isSelected
      ? "#3b82f6"
      : node.panoramaUrl
      ? "#22c55e"
      : "#6b7280";
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, radius, 0, 2 * Math.PI);
    ctx.fill();

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

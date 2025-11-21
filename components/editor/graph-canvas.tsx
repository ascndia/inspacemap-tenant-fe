"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree, Html } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useGraph } from "@/contexts/graph-context";
import { GraphEngine } from "@/lib/engine/core/graph-engine";
import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  PlusCircle,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  Link,
  Unlink,
} from "lucide-react";

// Node Component for 3D Scene
function Node3D({
  node,
  isSelected,
  onSelect,
  onUpdate,
}: {
  node: any;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: any) => void;
}) {
  const { updateNode } = useGraph();
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handlePointerDown = (event: THREE.Event) => {
    event.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: event.point.x - node.position.x,
      y: event.point.z - node.position.y,
    });
    onSelect();
  };

  const handlePointerMove = (event: THREE.Event) => {
    if (isDragging && meshRef.current) {
      const newX = event.point.x - dragStart.x;
      const newY = event.point.z - dragStart.y;
      meshRef.current.position.set(newX, 0.1, newY);
      updateNode(node.id, {
        position: { x: newX, y: newY, z: node.position.z },
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <mesh
      ref={meshRef}
      position={[node.position.x, 0.1, node.position.y]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshLambertMaterial
        color={
          isSelected ? "#3b82f6" : node.panoramaUrl ? "#22c55e" : "#6b7280"
        }
        transparent
        opacity={0.9}
      />

      {/* Label */}
      <Html position={[0, 0.3, 0]} center>
        <div className="bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-medium select-none pointer-events-none">
          {node.label || `Node ${node.id.slice(0, 4)}`}
        </div>
      </Html>
    </mesh>
  );
}

// Connection Component for 3D Scene
function Connection3D({
  connection,
  nodes,
}: {
  connection: any;
  nodes: any[];
}) {
  const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
  const toNode = nodes.find((n) => n.id === connection.toNodeId);

  if (!fromNode || !toNode) return null;

  const points = [
    new THREE.Vector3(fromNode.position.x, 0.1, fromNode.position.y),
    new THREE.Vector3(toNode.position.x, 0.1, toNode.position.y),
  ];

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#3b82f6" opacity={0.6} transparent />
    </line>
  );
}

// Path Preview Component
function PathPreview3D({ pathNodeIds, nodes }: { pathNodeIds: string[], nodes: any[] }) {
  if (!pathNodeIds || pathNodeIds.length < 2) return null;

  const pathNodes = pathNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean);
  if (pathNodes.length < 2) return null;

  const points = pathNodes.map(node => new THREE.Vector3(node.position.x, 0.15, node.position.y));

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ef4444" linewidth={3} opacity={0.8} transparent />
    </line>
  );
}
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (floorplan?.fileUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(floorplan.fileUrl, (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        setTexture(loadedTexture);
      });
    }
  }, [floorplan]);

  if (!texture || !floorplan) return null;

  const width = floorplan.bounds.width / 100;
  const height = floorplan.bounds.height / 100;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, height]} />
      <meshLambertMaterial map={texture} transparent />
    </mesh>
  );
}

// Main 3D Scene Component
function Scene3D({ pathPreview }: { pathPreview: string[] | null }) {
  const { state, addNode, setSelectedNode, addConnection, ui, updateSettings } =
    useGraph();

  const { camera, gl, scene } = useThree();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const handleCanvasClick = useCallback(
    (event: THREE.Event) => {
      if (ui.tool === "add-node") {
        const position = { x: event.point.x, y: event.point.z, z: 0 };
        addNode(position);
      }
    },
    [ui.tool, addNode]
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (ui.tool === "connect" && !isConnecting) {
        setIsConnecting(true);
        setConnectingFrom(nodeId);
      } else if (
        ui.tool === "connect" &&
        isConnecting &&
        connectingFrom &&
        connectingFrom !== nodeId
      ) {
        addConnection(connectingFrom, nodeId);
        setIsConnecting(false);
        setConnectingFrom(null);
      } else {
        setSelectedNode(nodeId);
        setIsConnecting(false);
        setConnectingFrom(null);
      }
    },
    [ui.tool, isConnecting, connectingFrom, setSelectedNode, addConnection]
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 10, 0]} intensity={0.3} />

      {/* Grid */}
      {ui.showGrid && (
        <gridHelper
          args={[20, 20, 0x888888, 0xcccccc]}
          position={[0, -0.01, 0]}
        />
      )}

      {/* Floorplan */}
      {state.graph?.floorplan && (
        <Floorplan3D floorplan={state.graph.floorplan} />
      )}

      {/* Nodes */}
      {state.graph?.nodes.map((node) => (
        <Node3D
          key={node.id}
          node={node}
          isSelected={ui.selectedNodeId === node.id}
          onSelect={() => handleNodeClick(node.id)}
          onUpdate={(updates) => {
            // This will be handled by the context
            console.log("Node update:", updates);
          }}
        />
      ))}

      {/* Connections */}
      {state.graph?.connections.map((connection) => (
        <Connection3D
          key={connection.id}
          connection={connection}
          nodes={state.graph?.nodes || []}
        />
      ))}

      {/* Path Preview */}
      {pathPreview && (
        <PathPreview3D pathNodeIds={pathPreview} nodes={state.graph?.nodes || []} />
      )}

      {/* Click handler for canvas */}
      <mesh position={[0, -0.02, 0]} onPointerDown={handleCanvasClick}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Controls */}
      <OrbitControls
        enablePan={ui.tool === "pan"}
        enableZoom={ui.tool === "zoom"}
        enableRotate={ui.tool === "rotate"}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export function GraphCanvas({ pathPreview }: { pathPreview: string[] | null }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { ui, updateSettings, addNode, undo, redo, canUndo, canRedo } =
    useGraph();

  const [scale, setScale] = useState(1);

  const handleToolChange = (tool: string) => {
    updateSettings({ tool });
  };

  const handleAddNode = () => {
    // Add node at center for now
    addNode({ x: 0, y: 0, z: 0 });
  };

  return (
    <div className="relative h-full w-full bg-muted/10 overflow-hidden rounded-lg border">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-background/95 backdrop-blur p-2 rounded-lg border shadow-sm">
        <Button
          variant={ui.tool === "select" ? "default" : "ghost"}
          size="icon"
          title="Select"
          onClick={() => handleToolChange("select")}
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button
          variant={ui.tool === "add-node" ? "default" : "ghost"}
          size="icon"
          title="Add Node"
          onClick={() => handleToolChange("add-node")}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Button
          variant={ui.tool === "connect" ? "default" : "ghost"}
          size="icon"
          title="Connect Nodes"
          onClick={() => handleToolChange("connect")}
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          variant={ui.tool === "pan" ? "default" : "ghost"}
          size="icon"
          title="Pan"
          onClick={() => handleToolChange("pan")}
        >
          <Move className="h-4 w-4" />
        </Button>
        <div className="h-px bg-border my-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale((s) => Math.min(s + 0.1, 2))}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale(1)}
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="h-px bg-border my-1" />
        <Button
          variant="ghost"
          size="icon"
          disabled={!canUndo}
          onClick={undo}
          title="Undo"
        >
          ↶
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canRedo}
          onClick={redo}
          title="Redo"
        >
          ↷
        </Button>
      </div>

      {/* 3D Canvas */}
      <div ref={canvasRef} className="w-full h-full">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 75 }}
          shadows
          gl={{ antialias: true }}
        >
          <Scene3D pathPreview={pathPreview} />
        </Canvas>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur px-3 py-1 rounded-full border shadow-sm text-xs text-muted-foreground">
        {state.graph?.nodes.length || 0} Nodes •{" "}
        {state.graph?.connections.length || 0} Connections • Tool: {ui.tool}
      </div>
    </div>
  );
}

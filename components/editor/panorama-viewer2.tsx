"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import View360, { EquirectProjection, EVENTS } from "@egjs/view360";
import { useGraphStore } from "@/stores/graph-store";

const normalizeYaw = (yaw: number) => ((yaw % 360) + 360) % 360;
const sanitizeYaw = (yaw?: number) =>
  Math.round(Number.isFinite(yaw) ? normalizeYaw(yaw as number) : 0);
const clampPitch = (pitch: number) => Math.max(-90, Math.min(90, pitch));
const sanitizePitch = (pitch?: number) =>
  clampPitch(Math.round(Number.isFinite(pitch) ? (pitch as number) : 0));
const yawDiffDeg = (a: number, b: number) => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

interface HotspotData {
  nodeId: string;
  node: any;
  yaw: number;
  pitch: number;
  distance: number;
}

export default function PanoramaViewer({
  selectedNode,
  graph,
  onNavigateToNode,
  onRotationChange,
  onPitchChange,
  initialYaw = 0,
  initialPitch = 0,
}: {
  selectedNode: any;
  graph?: any;
  onNavigateToNode: (nodeId: string) => void;
  onRotationChange?: (yaw: number) => void;
  onPitchChange?: (pitch: number) => void;
  initialYaw?: number;
  initialPitch?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<View360 | null>(null);
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);
  const [currentYaw, setCurrentYaw] = useState(initialYaw);
  const [currentPitch, setCurrentPitch] = useState(initialPitch);
  const lastReportedYaw = useRef(initialYaw);
  const lastReportedPitch = useRef(initialPitch);
  const isUserInteracting = useRef(false);
  const lastProgrammaticUpdate = useRef<number>(0);
  const panoramaSource = useGraphStore((s) => s.panoramaLastUpdateSource);
  const panoramaUpdatedAt = useGraphStore((s) => s.panoramaLastUpdatedAt);
  const panoramaYaw = useGraphStore((s) => s.panoramaYaw);
  const panoramaPitch = useGraphStore((s) => s.panoramaPitch);
  const setPanoramaRotation = useGraphStore((s) => s.setPanoramaRotation);
  const panoramaDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // NOTE: The rotation source is passed via props (initialYaw/initialPitch).
  // The parent (GraphCanvas) listens to viewer rotation via callbacks and updates
  // the global store. This component receives the rotation via props and updates the
  // View360 camera accordingly.

  // No direct store subscription here - parent passes initialYaw/initialPitch.

  // 1. Kalkulasi Data Hotspot (Hanya menghitung Yaw/Pitch, TANPA posisi layar X/Y)
  const calculateHotspots = useCallback(() => {
    if (!selectedNode || !graph?.nodes || !graph?.connections) return [];

    const calculated: HotspotData[] = [];
    const currentNode = selectedNode;

    const neighborConnections = graph.connections.filter(
      (conn: any) =>
        conn.fromNodeId === currentNode.id || conn.toNodeId === currentNode.id
    );

    for (const connection of neighborConnections) {
      const neighborId =
        connection.fromNodeId === currentNode.id
          ? connection.toNodeId
          : connection.fromNodeId;

      const neighborNode = graph.nodes.find(
        (node: any) => node.id === neighborId
      );
      if (!neighborNode) continue;

      const dx = neighborNode.position.x - currentNode.position.x;
      const dy = neighborNode.position.y - currentNode.position.y;
      const dz = neighborNode.position.z - currentNode.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Normalisasi & Rotasi (Math logic tetap diperlukan untuk menentukan Yaw/Pitch)
      const nx = dx / distance;
      const ny = dy / distance;
      const nz = dz / distance;

      // Use currentYaw (free view rotation) instead of node.heading
      const headingRad = (currentYaw * Math.PI) / 180;

      const rx = nx * Math.cos(headingRad) - ny * Math.sin(headingRad);
      const ry = nx * Math.sin(headingRad) + ny * Math.cos(headingRad);
      const rz = nz;

      const yaw = (Math.atan2(ry, rx) * 180) / Math.PI;
      const pitch = -(Math.asin(Math.max(-1, Math.min(1, rz))) * 180) / Math.PI;

      calculated.push({
        nodeId: neighborId,
        node: neighborNode,
        yaw: yaw,
        pitch: pitch,
        distance: distance,
      });
    }
    return calculated;
  }, [selectedNode, graph, currentYaw]);

  // Recalculate hotspots when graph/selection/rotation changes
  useEffect(() => {
    setHotspots(calculateHotspots() as HotspotData[]);
  }, [calculateHotspots]);

  // Update rotation state when props change (but not during user interaction)
  useEffect(() => {
    if (isUserInteracting.current) {
      console.log("Skipping viewer update due to user interaction");
      return; // Don't update camera during user interaction
    }

    const yaw = Number.isFinite(initialYaw) ? normalizeYaw(initialYaw) : 0;
    const pitch = clampPitch(Number.isFinite(initialPitch) ? initialPitch : 0);

    // If the last update came from our own viewer within a small grace period,
    // ignore this programmatic update to prevent feedback loops.
    const now = Date.now();
    const graceMs = 250;
    if (
      panoramaSource === "viewer" &&
      panoramaUpdatedAt &&
      now - panoramaUpdatedAt < graceMs
    ) {
      // Skip programmatic update that originated from this viewer
      // but still update local refs so internal state remains consistent
      console.log("Ignoring programmatic update from viewer (grace period)");
      lastReportedYaw.current = yaw;
      lastReportedPitch.current = pitch;
      return;
    }

    console.log(
      "Updating viewer from node initial values - yaw:",
      yaw,
      "pitch:",
      pitch
    );
    setCurrentYaw(yaw);
    setCurrentPitch(pitch);
    lastReportedYaw.current = yaw;
    lastReportedPitch.current = pitch;
    lastProgrammaticUpdate.current = Date.now();

    // Update viewer rotation if it exists (but don't recreate viewer)
    if (viewerRef.current) {
      viewerRef.current.camera.lookAt({
        yaw: (yaw * Math.PI) / 180,
        pitch: (pitch * Math.PI) / 180,
      });
    }
  }, [initialYaw, initialPitch, panoramaSource, panoramaUpdatedAt]);

  // React to global state changes (e.g., from properties panel slider)
  useEffect(() => {
    if (panoramaSource === "viewer") return; // Ignore updates from this viewer to prevent loops

    const yaw = Number.isFinite(panoramaYaw) ? normalizeYaw(panoramaYaw) : 0;
    const pitch = clampPitch(
      Number.isFinite(panoramaPitch) ? panoramaPitch : 0
    );

    console.log(
      "Updating viewer from global state - yaw:",
      yaw,
      "pitch:",
      pitch
    );
    setCurrentYaw(yaw);
    setCurrentPitch(pitch);
    lastReportedYaw.current = yaw;
    lastReportedPitch.current = pitch;
    lastProgrammaticUpdate.current = Date.now();

    // Update viewer rotation if it exists
    if (viewerRef.current) {
      viewerRef.current.camera.lookAt({
        yaw: (yaw * Math.PI) / 180,
        pitch: (pitch * Math.PI) / 180,
      });
    }
  }, [panoramaYaw, panoramaPitch, panoramaSource]);

  // 2. Setup Viewer
  useEffect(() => {
    if (!containerRef.current || !selectedNode?.panorama_url) return;

    const viewer = new View360(containerRef.current, {
      projection: new EquirectProjection({
        src: selectedNode.panorama_url,
      }),
      // Don't set initial rotation here - we'll set it after initialization
      // Matikan scroll zoom jika mengganggu
      wheelScrollable: false,
    });

    viewerRef.current = viewer;

    // Set initial rotation after viewer is created
    const initYaw = Number.isFinite(initialYaw) ? normalizeYaw(initialYaw) : 0;
    const initPitch = clampPitch(
      Number.isFinite(initialPitch) ? initialPitch : 0
    );
    viewer.camera.lookAt({
      yaw: (initYaw * Math.PI) / 180,
      pitch: (initPitch * Math.PI) / 180,
    });

    // Listen to viewChange event for precise camera updates
    const onViewChange = (evt: any) => {
      const { yaw, pitch } = evt;

      // Ignore changes during programmatic updates (grace period)
      const timeSinceProgrammaticUpdate =
        Date.now() - lastProgrammaticUpdate.current;
      if (timeSinceProgrammaticUpdate < 200) {
        return;
      }

      console.log("View change detected - yaw:", yaw, "pitch:", pitch);
      isUserInteracting.current = true;

      setCurrentYaw(yaw);
      setCurrentPitch((pitch * 180) / Math.PI); // Convert pitch from radians to degrees

      // Update store directly (debounced) to avoid parent round-trip. Also call callbacks for compatibility.
      if (panoramaDebounceRef.current)
        clearTimeout(panoramaDebounceRef.current);
      panoramaDebounceRef.current = setTimeout(() => {
        setPanoramaRotation(yaw, (pitch * 180) / Math.PI, "viewer"); // Store pitch in degrees
        panoramaDebounceRef.current = null;
      }, 100);
      onRotationChange?.(yaw);
      onPitchChange?.((pitch * 180) / Math.PI);

      lastReportedYaw.current = yaw;
      lastReportedPitch.current = (pitch * 180) / Math.PI;

      // Reset interaction flag after delay
      setTimeout(() => {
        isUserInteracting.current = false;
      }, 100);
    };

    viewer.on(EVENTS.VIEW_CHANGE, onViewChange);
    const resizeObserver = new ResizeObserver(() => {
      viewer.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      viewer.off(EVENTS.VIEW_CHANGE, onViewChange);
      resizeObserver.disconnect();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [selectedNode?.panorama_url]); // Only recreate when panorama URL changes

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4 relative">
        {/* Container Utama View360 */}
        <div
          ref={containerRef}
          className="view360-container absolute inset-0 w-full h-full"
        >
          {/* Canvas Wajib untuk V4 */}
          <canvas
            className="view360-canvas"
            style={{ width: "100%", height: "100%" }}
          />

          {/* FIX 2: Native Hotspot Container
            V4 akan otomatis mencari elemen dengan class "view360-hotspot" 
            di dalam container dan memposisikannya berdasarkan atribut data-yaw/pitch.
            Tidak perlu lagi perhitungan coordinateToScreen manual!
          */}
          <div className="view360-hotspots">
            {hotspots.map((hs) => (
              <div
                key={hs.nodeId}
                className="view360-hotspot cursor-pointer flex flex-col items-center justify-center"
                // Inilah MAGIC-nya V4: Cukup kasih data attribute
                data-yaw={hs.yaw}
                data-pitch={hs.pitch}
                onClick={() => onNavigateToNode(hs.nodeId)}
                style={{
                  transform: "translate(-50%, -50%)", // Centering pivot
                  position: "absolute", // Wajib absolute agar library bisa menggesernya
                }}
              >
                {/* Visual Hotspot */}
                <div className="w-10 h-10 rounded-full bg-blue-500/80 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs hover:bg-blue-600 transition-colors">
                  {hs.distance < 50 && (
                    <span className="absolute -top-5 text-lg font-bold">↑</span>
                  )}
                  <span className="text-[8px] mt-1 truncate max-w-[50px]">
                    {hs.node.name || hs.nodeId.slice(0, 4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!selectedNode && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a node to view panorama
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useGraph } from "@/contexts/graph-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Play, Pause } from "lucide-react";

function PanoramaSphere({ imageUrl }: { imageUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  useEffect(() => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
    }
  }, [texture]);

  useFrame((state) => {
    if (meshRef.current) {
      // Optional: Add subtle rotation for preview
      // meshRef.current.rotation.y += 0.001
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

export function PanoramaPreview() {
  const { selectedNode, updateNode } = useGraph();
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [heading, setHeading] = useState(0);
  const [fov, setFov] = useState(75);

  useEffect(() => {
    if (selectedNode) {
      setRotation(selectedNode.rotation || 0);
      setHeading(selectedNode.heading || 0);
      setFov(selectedNode.fov || 75);
    }
  }, [selectedNode]);

  const handleRotationChange = (value: number[]) => {
    const newRotation = value[0];
    setRotation(newRotation);
    if (selectedNode) {
      updateNode(selectedNode.id, { rotation: newRotation });
    }
  };

  const handleHeadingChange = (value: number[]) => {
    const newHeading = value[0];
    setHeading(newHeading);
    if (selectedNode) {
      updateNode(selectedNode.id, { heading: newHeading });
    }
  };

  const handleFovChange = (value: number[]) => {
    const newFov = value[0];
    setFov(newFov);
    if (selectedNode) {
      updateNode(selectedNode.id, { fov: newFov });
    }
  };

  const handleReset = () => {
    setRotation(0);
    setHeading(0);
    setFov(75);
    if (selectedNode) {
      updateNode(selectedNode.id, { rotation: 0, heading: 0, fov: 75 });
    }
  };

  if (!selectedNode?.panoramaUrl) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Select a node with a panorama image to preview
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 3D Panorama Viewer */}
      <div className="flex-1 relative bg-black rounded-t-lg overflow-hidden">
        <Canvas
          camera={{
            position: [0, 0, 0.1],
            fov: fov,
            near: 0.1,
            far: 10,
          }}
          gl={{ antialias: true }}
        >
          <PanoramaSphere imageUrl={selectedNode.panoramaUrl} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
          />
        </Canvas>

        {/* Overlay Controls */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 bg-background border-t">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Rotation</span>
            <span>{rotation}°</span>
          </div>
          <Slider
            value={[rotation]}
            onValueChange={handleRotationChange}
            min={0}
            max={360}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Heading</span>
            <span>{heading}°</span>
          </div>
          <Slider
            value={[heading]}
            onValueChange={handleHeadingChange}
            min={0}
            max={360}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>FOV</span>
            <span>{fov}°</span>
          </div>
          <Slider
            value={[fov]}
            onValueChange={handleFovChange}
            min={30}
            max={120}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

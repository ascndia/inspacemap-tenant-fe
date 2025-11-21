"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useGraph } from "@/contexts/graph-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Play, Pause } from "lucide-react";

export function PanoramaPreview() {
  const { selectedNode, updateNode } = useGraph();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [heading, setHeading] = useState(0);
  const [fov, setFov] = useState(75);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Load panorama image
  useEffect(() => {
    if (selectedNode?.panoramaUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
      };
      img.src = selectedNode.panoramaUrl;
    } else {
      setImage(null);
    }
  }, [selectedNode?.panoramaUrl]);

  // Update local state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setRotation(selectedNode.rotation || 0);
      setHeading(selectedNode.heading || 0);
      setFov(selectedNode.fov || 75);
    }
  }, [selectedNode]);

  // Draw panorama on canvas
  const drawPanorama = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate visible portion based on rotation and FOV
    const imageWidth = image.width;
    const imageHeight = image.height;

    // For equirectangular projection, we map rotation to horizontal offset
    const rotationOffset = (rotation / 360) * imageWidth;

    // Calculate FOV-based cropping
    const fovRatio = fov / 360; // FOV as fraction of full 360°
    const visibleWidth = imageWidth * fovRatio;
    const startX = (rotationOffset - visibleWidth / 2 + imageWidth) % imageWidth;

    // Draw the visible portion
    if (startX + visibleWidth <= imageWidth) {
      // Single draw
      ctx.drawImage(
        image,
        startX, 0, visibleWidth, imageHeight,
        0, 0, width, height
      );
    } else {
      // Wrap around (two draws needed)
      const firstWidth = imageWidth - startX;
      const secondWidth = visibleWidth - firstWidth;

      ctx.drawImage(
        image,
        startX, 0, firstWidth, imageHeight,
        0, 0, (firstWidth / visibleWidth) * width, height
      );

      ctx.drawImage(
        image,
        0, 0, secondWidth, imageHeight,
        (firstWidth / visibleWidth) * width, 0, (secondWidth / visibleWidth) * width, height
      );
    }

    // Add FOV indicator overlay
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // Add center crosshair
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 10, height / 2);
    ctx.lineTo(width / 2 + 10, height / 2);
    ctx.moveTo(width / 2, height / 2 - 10);
    ctx.lineTo(width / 2, height / 2 + 10);
    ctx.stroke();
  }, [image, rotation, fov]);

  // Animation loop for auto-rotation
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setRotation(prev => (prev + 0.5) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Redraw when parameters change
  useEffect(() => {
    drawPanorama();
  }, [drawPanorama]);

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
      {/* 2D Panorama Viewer */}
      <div className="flex-1 relative bg-black rounded-t-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={240}
          className="w-full h-full object-cover"
        />

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
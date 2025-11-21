"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { MousePointer2, PlusCircle, Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

export function GraphCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [nodes, setNodes] = useState([
    { id: 1, x: 100, y: 100, label: "Entry" },
    { id: 2, x: 300, y: 150, label: "Lobby" },
    { id: 3, x: 500, y: 100, label: "Hallway A" },
  ])
  const [edges, setEdges] = useState([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ])

  return (
    <div className="relative h-full w-full bg-muted/10 overflow-hidden rounded-lg border">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-background/95 backdrop-blur p-2 rounded-lg border shadow-sm">
        <Button variant="ghost" size="icon" title="Select">
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Add Node">
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Pan">
          <Move className="h-4 w-4" />
        </Button>
        <div className="h-px bg-border my-1" />
        <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(s + 0.1, 2))} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setScale(1)} title="Reset View">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{
          backgroundImage: "radial-gradient(#ccc 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div
          className="w-full h-full transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${scale})` }}
        >
          <svg className="w-full h-full pointer-events-none">
            {/* Edges */}
            {edges.map((edge, i) => {
              const from = nodes.find((n) => n.id === edge.from)!
              const to = nodes.find((n) => n.id === edge.to)!
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground/50"
                />
              )
            })}

            {/* Nodes */}
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                className="pointer-events-auto cursor-pointer group"
              >
                <circle
                  r="20"
                  className="fill-background stroke-primary stroke-2 group-hover:fill-primary/10 transition-colors"
                />
                <text y="35" textAnchor="middle" className="text-xs font-medium fill-foreground select-none">
                  {node.label}
                </text>
                <circle r="4" className="fill-primary" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur px-3 py-1 rounded-full border shadow-sm text-xs text-muted-foreground">
        {nodes.length} Nodes • {edges.length} Connections • {(scale * 100).toFixed(0)}% Zoom
      </div>
    </div>
  )
}

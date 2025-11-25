"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGraph } from "@/providers/GraphProvider";
import { useGraphStore } from "@/stores/graph-store";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { mediaService } from "@/lib/services/media-service";
import { MediaItem } from "@/types/media";
import { MediaPicker } from "@/components/media/media-picker";
import { ImageIcon, Eye } from "lucide-react";

export function PropertiesPanel() {
  const graphStore = useGraphStore();
  const graphProvider = useGraph();

  const selectedNodeId = graphStore.selectedNodeId;
  const selectedConnectionId = graphStore.selectedConnectionId;
  const selectedAreaId = graphStore.selectedAreaId;
  const graph = graphStore.graph;

  // Get selected node using selector
  const selectedNode = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    return graph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graph, selectedNodeId]);

  // Get selected connection using selector
  const selectedConnection = useMemo(() => {
    if (!graph || !selectedConnectionId) return null;
    return graph.connections.find((c) => c.id === selectedConnectionId) || null;
  }, [graph, selectedConnectionId]);

  // Get selected area using selector
  const selectedArea = useMemo(() => {
    if (!graph || !selectedAreaId) return null;
    return graph.areas.find((a) => a.id === selectedAreaId) || null;
  }, [graph, selectedAreaId]);

  const [rotationValue, setRotationValue] = useState(0);
  const [headingValue, setHeadingValue] = useState(0);
  const [fovValue, setFovValue] = useState(60);

  const [panoramaMedia, setPanoramaMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Sync local state with selected node
  useEffect(() => {
    if (selectedNode) {
      setRotationValue(selectedNode.rotation);
      setHeadingValue(selectedNode.heading);
      setFovValue(selectedNode.fov);
    }
  }, [selectedNode]);

  // Calculate graph stats
  const graphStats = useMemo(() => {
    if (!graph) return null;

    const nodeCount = graph.nodes.length;
    const connectionCount = graph.connections.length;
    const isolatedNodes = graph.nodes.filter(
      (node) => node.connections.length === 0
    ).length;
    const connectedComponents = 1; // Simplified calculation
    const averageDegree = nodeCount > 0 ? (connectionCount * 2) / nodeCount : 0;
    const maxDegree = Math.max(
      ...graph.nodes.map((node) => node.connections.length)
    );
    const totalDistance = graph.connections.reduce(
      (sum, conn) => sum + conn.distance,
      0
    );
    const averageDistance =
      connectionCount > 0 ? totalDistance / connectionCount : 0;
    const hasPanoramas = graph.nodes.filter(
      (node) => node.panorama_url || node.panorama_asset_id
    ).length;
    const missingPanoramas = nodeCount - hasPanoramas;
    const density =
      nodeCount > 1 ? (connectionCount * 2) / (nodeCount * (nodeCount - 1)) : 0;
    const diameter = 1; // Simplified calculation

    return {
      nodeCount,
      connectionCount,
      isolatedNodes,
      connectedComponents,
      averageDegree,
      maxDegree,
      totalDistance,
      averageDistance,
      hasPanoramas,
      missingPanoramas,
      density,
      diameter,
      clusteringCoefficient: 0, // Not implemented
    };
  }, [graph]);

  // Load panorama media assets
  useEffect(() => {
    const loadPanoramaMedia = async () => {
      try {
        setLoadingMedia(true);
        const response = await mediaService.getMedia();
        // Filter for panorama category
        const panoramas = response.data.filter(
          (item) => item.category === "panorama"
        );
        setPanoramaMedia(panoramas);
      } catch (error) {
        console.error("Failed to load panorama media:", error);
      } finally {
        setLoadingMedia(false);
      }
    };

    loadPanoramaMedia();
  }, []);

  const handleNodeUpdate = async (field: string, value: any) => {
    if (!selectedNode) return;

    console.log("handleNodeUpdate called with:", { field, value }); // Debug log

    const updates: any = {};
    if (field === "position") {
      updates.position = { ...selectedNode.position, ...value };
    } else if (field === "rotation") {
      updates.rotation = value;
    } else if (field === "heading") {
      // Heading is client-side only for panorama viewing, don't send to API
      graphStore.updateNode(selectedNode.id, { heading: value });
      return;
    } else if (field === "fov") {
      // FOV is client-side only for panorama viewing, don't send to API
      graphStore.updateNode(selectedNode.id, { fov: value });
      return;
    } else if (field === "label") {
      if (value && value.trim() !== "") {
        updates.label = value;
      }
    } else if (field === "panorama_asset_id") {
      // Only update if we have a valid asset ID, otherwise don't send the field
      if (
        value &&
        value.trim() !== "" &&
        value !== "null" &&
        value !== null &&
        value !== undefined
      ) {
        updates.panorama_asset_id = value;
      }
    }

    console.log("Updates object:", updates); // Debug log

    // Only proceed if we have at least one field to update
    if (Object.keys(updates).length === 0) {
      console.log("No updates to send, returning early"); // Debug log
      return;
    }

    try {
      await graphProvider.updateNode(selectedNode.id, updates);
    } catch (error) {
      console.error("Failed to update node:", error);
    }
  };

  const handleSettingsUpdate = (field: string, value: any) => {
    if (!graph) return;

    const updatedGraph = {
      ...graph,
      settings: {
        ...graph.settings,
        [field]: value,
      },
    };

    graphStore.setGraph(updatedGraph);
  };

  const autoLayout = () => {
    // TODO: Implement auto layout
    console.log("Auto layout not implemented yet");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Properties</h3>
      </div>

      <Tabs defaultValue="node" className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="node" className="flex-1">
              Node
            </TabsTrigger>
            <TabsTrigger value="area" className="flex-1">
              Area
            </TabsTrigger>
            <TabsTrigger value="connection" className="flex-1">
              Connection
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1">
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="node" className="space-y-4 mt-0">
            {selectedNode ? (
              <>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={selectedNode.label || ""}
                    onChange={(e) => handleNodeUpdate("label", e.target.value)}
                    placeholder="Enter node label"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position X</Label>
                    <Input
                      type="number"
                      value={selectedNode.position.x.toFixed(2)}
                      onChange={(e) =>
                        handleNodeUpdate("position", {
                          x: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position Y</Label>
                    <Input
                      type="number"
                      value={selectedNode.position.y.toFixed(2)}
                      onChange={(e) =>
                        handleNodeUpdate("position", {
                          y: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Panorama Image</Label>
                  {selectedNode.panorama_asset_id ||
                  selectedNode.panorama_url ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/20">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-medium">
                            {selectedNode.panorama_asset_id
                              ? "Panorama Selected"
                              : "Panorama Loaded"}
                          </p>
                          <p
                            className="text-muted-foreground text-xs truncate"
                            title={
                              selectedNode.panorama_asset_id ||
                              selectedNode.panorama_url
                            }
                          >
                            {selectedNode.panorama_asset_id
                              ? `Asset ID: ${selectedNode.panorama_asset_id}`
                              : "From backend"}
                          </p>
                        </div>
                      </div>
                      <MediaPicker
                        onSelect={(media) => {
                          if (media) {
                            handleNodeUpdate(
                              "panorama_asset_id",
                              media.asset_id
                            );
                            // Also update the panorama_url for immediate display
                            graphStore.updateNode(selectedNode.id, {
                              panorama_url: media.url,
                            });
                          } else {
                            handleNodeUpdate("panorama_asset_id", "");
                            graphStore.updateNode(selectedNode.id, {
                              panorama_url: undefined,
                            });
                          }
                        }}
                        acceptTypes={["image"]}
                        trigger={
                          <Button variant="outline" className="w-full">
                            Change Panorama
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <MediaPicker
                      onSelect={(media) => {
                        if (media) {
                          handleNodeUpdate("panorama_asset_id", media.asset_id);
                          // Also update the panorama_url for immediate display
                          graphStore.updateNode(selectedNode.id, {
                            panorama_url: media.url,
                          });
                        } else {
                          handleNodeUpdate("panorama_asset_id", "");
                          graphStore.updateNode(selectedNode.id, {
                            panorama_url: undefined,
                          });
                        }
                      }}
                      acceptTypes={["image"]}
                      trigger={
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          Select Panorama
                        </Button>
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Rotation: {rotationValue}°</Label>
                  <Slider
                    value={[rotationValue]}
                    onValueChange={([value]) => {
                      setRotationValue(value);
                      graphStore.updateNode(selectedNode.id, {
                        rotation: value,
                      });
                    }}
                    onPointerUp={() =>
                      handleNodeUpdate("rotation", rotationValue)
                    }
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Heading: {headingValue}°</Label>
                  <Slider
                    value={[headingValue]}
                    onValueChange={([value]) => {
                      setHeadingValue(value);
                      graphStore.updateNode(selectedNode.id, {
                        heading: value,
                      });
                    }}
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>FOV: {fovValue}°</Label>
                  <Slider
                    value={[fovValue]}
                    onValueChange={([value]) => {
                      setFovValue(value);
                      graphStore.updateNode(selectedNode.id, { fov: value });
                    }}
                    min={30}
                    max={120}
                    step={1}
                    className="w-full"
                  />
                </div>

                {(selectedNode.panorama_asset_id ||
                  selectedNode.panorama_url) && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        // Import the graph store to toggle panorama viewer
                        const {
                          useGraphStore,
                        } = require("@/stores/graph-store");
                        const graphStore = useGraphStore.getState();
                        graphStore.setPanoramaNode(selectedNode.id);
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      View Panorama
                    </Button>
                  </div>
                )}

                {(selectedNode.panorama_asset_id ||
                  selectedNode.panorama_url) && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        // Set panorama node to show panorama viewer
                        graphStore.setPanoramaNode(selectedNode.id);
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Panorama
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                Select a node to edit properties
              </div>
            )}
          </TabsContent>

          <TabsContent value="area" className="space-y-4 mt-0">
            {selectedArea ? (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={selectedArea.name || ""}
                    onChange={(e) => {
                      graphProvider.updateArea(selectedArea.id, {
                        name: e.target.value,
                      });
                    }}
                    placeholder="Enter area name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={selectedArea.category || "default"}
                    onValueChange={(value) => {
                      graphProvider.updateArea(selectedArea.id, {
                        category: value,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="corridor">Corridor</SelectItem>
                      <SelectItem value="staircase">Staircase</SelectItem>
                      <SelectItem value="elevator">Elevator</SelectItem>
                      <SelectItem value="entrance">Entrance</SelectItem>
                      <SelectItem value="exit">Exit</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                      <SelectItem value="garden">Garden</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={selectedArea.description || ""}
                    onChange={(e) => {
                      graphProvider.updateArea(selectedArea.id, {
                        description: e.target.value,
                      });
                    }}
                    placeholder="Enter area description"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Start Node</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedArea.start_node_id || ""}
                      onValueChange={(value) => {
                        graphProvider.setAreaStartNode(
                          selectedArea.id,
                          value || null
                        );
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select start node" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {graph?.nodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {node.label || `Node ${node.id.slice(0, 8)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        graphProvider.setAreaStartNode(selectedArea.id, null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  {selectedArea.start_node_id && (
                    <p className="text-xs text-muted-foreground">
                      Start node helps with navigation and area identification
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Area Actions</Label>
                  <div className="space-y-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        if (
                          confirm("Are you sure you want to delete this area?")
                        ) {
                          try {
                            await graphProvider.deleteArea(selectedArea.id);
                          } catch (error) {
                            console.error("Failed to delete area:", error);
                          }
                        }
                      }}
                    >
                      Delete Area
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>Vertices:</strong> {selectedArea.boundary.length}
                  </p>
                  <p>
                    <strong>Area ID:</strong> {selectedArea.id.slice(0, 8)}
                  </p>
                  {selectedArea.gallery_items &&
                    selectedArea.gallery_items.length > 0 && (
                      <p>
                        <strong>Gallery Items:</strong>{" "}
                        {selectedArea.gallery_items.length}
                      </p>
                    )}
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                Select an area to edit properties
              </div>
            )}
          </TabsContent>

          <TabsContent value="connection" className="space-y-4 mt-0">
            {selectedConnection ? (
              <div className="space-y-4">
                <div className="text-sm">
                  <strong>From:</strong> Node{" "}
                  {selectedConnection.fromNodeId.slice(0, 8)}
                  <br />
                  <strong>To:</strong> Node{" "}
                  {selectedConnection.toNodeId.slice(0, 8)}
                  <br />
                  <strong>Distance:</strong>{" "}
                  {selectedConnection.distance.toFixed(2)} units
                  <br />
                  <strong>Bidirectional:</strong>{" "}
                  {selectedConnection.bidirectional ? "Yes" : "No"}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                Select a connection to edit properties
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label>Grid Size</Label>
              <Input
                type="number"
                value={graph?.settings.gridSize || 20}
                onChange={(e) =>
                  handleSettingsUpdate("gridSize", parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Snap to Grid</Label>
              <Select
                value={graph?.settings.snapToGrid ?? true ? "on" : "off"}
                onValueChange={(value) =>
                  handleSettingsUpdate("snapToGrid", value === "on")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Enabled</SelectItem>
                  <SelectItem value="off">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Show Grid</Label>
              <Select
                value={graph?.settings.showGrid ?? true ? "on" : "off"}
                onValueChange={(value) =>
                  handleSettingsUpdate("showGrid", value === "on")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Enabled</SelectItem>
                  <SelectItem value="off">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auto Save</Label>
              <Select
                value={graph?.settings.autoSave ?? true ? "on" : "off"}
                onValueChange={(value) =>
                  handleSettingsUpdate("autoSave", value === "on")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Enabled</SelectItem>
                  <SelectItem value="off">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Floorplan Opacity:{" "}
                {Math.round((graph?.settings.floorplanOpacity || 0.5) * 100)}%
              </Label>
              <Slider
                value={[graph?.settings.floorplanOpacity || 0.5]}
                onValueChange={([value]) =>
                  handleSettingsUpdate("floorplanOpacity", value)
                }
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4 mt-0">
            {graphStats ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Graph Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nodes:</span>
                        <div className="font-medium">
                          {graphStats.nodeCount}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Connections:
                        </span>
                        <div className="font-medium">
                          {graphStats.connectionCount}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Isolated Nodes:
                        </span>
                        <div className="font-medium">
                          {graphStats.isolatedNodes}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Components:
                        </span>
                        <div className="font-medium">
                          {graphStats.connectedComponents}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Avg Degree:
                        </span>
                        <div className="font-medium">
                          {graphStats.averageDegree.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Max Degree:
                        </span>
                        <div className="font-medium">
                          {graphStats.maxDegree}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Density:</span>
                        <div className="font-medium">
                          {graphStats.density.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Diameter:</span>
                        <div className="font-medium">{graphStats.diameter}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Panorama Coverage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>With Panoramas:</span>
                      <span className="font-medium">
                        {graphStats.hasPanoramas}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Missing Panoramas:</span>
                      <span className="font-medium text-orange-600">
                        {graphStats.missingPanoramas}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width:
                            graphStats.nodeCount > 0
                              ? `${
                                  (graphStats.hasPanoramas /
                                    graphStats.nodeCount) *
                                  100
                                }%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Button
                    onClick={autoLayout}
                    className="w-full"
                    variant="outline"
                  >
                    Auto Layout Graph
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Automatically arrange nodes using force-directed layout
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                No graph data available
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <div className="p-4 border-t bg-muted/10 space-y-2">
        <Button onClick={autoLayout} className="w-full" variant="secondary">
          Auto Layout
        </Button>
        <Button
          className="w-full"
          disabled={!selectedNode && !selectedConnection && !selectedArea}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}

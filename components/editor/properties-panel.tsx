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
import { useGraph } from "@/contexts/graph-context";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PropertiesPanel() {
  const {
    selectedNode,
    selectedConnection,
    updateNode,
    updateSettings,
    state,
    autoLayout,
    getGraphStats,
  } = useGraph();

  const graphStats = getGraphStats();

  const handleNodeUpdate = (field: string, value: any) => {
    if (!selectedNode) return;

    const updates: any = {};
    if (field === "position") {
      updates.position = { ...selectedNode.position, ...value };
    } else if (field === "rotation") {
      updates.rotation = value;
    } else if (field === "heading") {
      updates.heading = value;
    } else if (field === "fov") {
      updates.fov = value;
    } else if (field === "label") {
      updates.label = value;
    } else if (field === "panoramaUrl") {
      updates.panoramaUrl = value;
    }

    updateNode(selectedNode.id, updates);
  };

  const handleSettingsUpdate = (field: string, value: any) => {
    updateSettings({ [field]: value });
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
                  <Select
                    value={selectedNode.panoramaUrl || ""}
                    onValueChange={(value) =>
                      handleNodeUpdate("panoramaUrl", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select image..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This would be populated from media library */}
                      <SelectItem value="lobby">lobby_360.jpg</SelectItem>
                      <SelectItem value="hall">hallway_360.jpg</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Upload New
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Rotation: {selectedNode.rotation}°</Label>
                  <Slider
                    value={[selectedNode.rotation]}
                    onValueChange={([value]) =>
                      handleNodeUpdate("rotation", value)
                    }
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Heading: {selectedNode.heading}°</Label>
                  <Slider
                    value={[selectedNode.heading]}
                    onValueChange={([value]) =>
                      handleNodeUpdate("heading", value)
                    }
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>FOV: {selectedNode.fov}°</Label>
                  <Slider
                    value={[selectedNode.fov]}
                    onValueChange={([value]) => handleNodeUpdate("fov", value)}
                    min={30}
                    max={120}
                    step={1}
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                Select a node to edit properties
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
                value={state.graph?.settings.gridSize || 20}
                onChange={(e) =>
                  handleSettingsUpdate("gridSize", parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Snap to Grid</Label>
              <Select
                value={state.ui.snapToGrid ? "on" : "off"}
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
                value={state.ui.showGrid ? "on" : "off"}
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
                value={state.graph?.settings.autoSave ? "on" : "off"}
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
          disabled={!selectedNode && !selectedConnection}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}

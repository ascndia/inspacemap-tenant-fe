import * as THREE from "three";
import { GraphNode, GraphConnection, Vector3, Floorplan } from "@/types/graph";

export class GraphEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private floorplanMesh: THREE.Mesh | null = null;
  private nodeMeshes: Map<string, THREE.Mesh> = new Map();
  private connectionLines: Map<string, THREE.Line> = new Map();
  private panoramaSphere: THREE.Mesh | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f5f5);

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.initializeScene();
    this.setupLighting();
    this.setupGrid();
  }

  private initializeScene() {
    // Add coordinate axes helper (optional)
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }

  private setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point light for better illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.3);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);
  }

  private setupGrid() {
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);
  }

  // Floorplan Management
  async loadFloorplan(floorplan: Floorplan): Promise<void> {
    // Remove existing floorplan
    if (this.floorplanMesh) {
      this.scene.remove(this.floorplanMesh);
      this.floorplanMesh.geometry.dispose();
      if (this.floorplanMesh.material instanceof THREE.Material) {
        this.floorplanMesh.material.dispose();
      }
    }

    try {
      const texture = await this.loadTexture(floorplan.fileUrl);
      const geometry = new THREE.PlaneGeometry(
        floorplan.bounds.width / 100, // Scale down for better viewing
        floorplan.bounds.height / 100
      );
      const material = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });

      this.floorplanMesh = new THREE.Mesh(geometry, material);
      this.floorplanMesh.rotation.x = -Math.PI / 2;
      this.floorplanMesh.receiveShadow = true;
      this.scene.add(this.floorplanMesh);

      // Adjust camera to fit floorplan
      this.fitCameraToFloorplan(floorplan);
    } catch (error) {
      console.error("Failed to load floorplan:", error);
      throw error;
    }
  }

  private async loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  private fitCameraToFloorplan(floorplan: Floorplan) {
    const width = floorplan.bounds.width / 100;
    const height = floorplan.bounds.height / 100;
    const maxDim = Math.max(width, height);

    const distance = maxDim / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
    this.camera.position.set(0, distance * 0.8, distance * 0.8);
    this.camera.lookAt(0, 0, 0);
  }

  // Node Management
  addNode(node: GraphNode): void {
    // Remove existing mesh if any
    this.removeNodeMesh(node.id);

    // Create node geometry
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshLambertMaterial({
      color: node.panoramaUrl ? 0x4ade80 : 0x6b7280,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(node.position.x, 0.1, node.position.y);
    mesh.castShadow = true;
    mesh.userData = { nodeId: node.id, type: "node" };

    this.nodeMeshes.set(node.id, mesh);
    this.scene.add(mesh);
  }

  updateNode(nodeId: string, updates: Partial<GraphNode>): void {
    const mesh = this.nodeMeshes.get(nodeId);
    if (!mesh) return;

    if (updates.position) {
      mesh.position.set(updates.position.x, 0.1, updates.position.y);
      // Update connections
      this.updateConnectionsForNode(nodeId);
    }

    if (updates.panoramaUrl !== undefined) {
      const material = mesh.material as THREE.MeshLambertMaterial;
      material.color.setHex(updates.panoramaUrl ? 0x4ade80 : 0x6b7280);
    }
  }

  removeNode(nodeId: string): void {
    this.removeNodeMesh(nodeId);
    // Remove associated connections
    this.connectionLines.forEach((line, connectionId) => {
      if (connectionId.includes(nodeId)) {
        this.scene.remove(line);
        line.geometry.dispose();
        if (line.material instanceof THREE.Material) {
          line.material.dispose();
        }
        this.connectionLines.delete(connectionId);
      }
    });
  }

  private removeNodeMesh(nodeId: string): void {
    const mesh = this.nodeMeshes.get(nodeId);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
      this.nodeMeshes.delete(nodeId);
    }
  }

  // Connection Management
  addConnection(connection: GraphConnection, nodes: GraphNode[]): void {
    const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
    const toNode = nodes.find((n) => n.id === connection.toNodeId);

    if (!fromNode || !toNode) return;

    // Remove existing connection if any
    this.removeConnection(connection.id);

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(fromNode.position.x, 0.1, fromNode.position.y),
      new THREE.Vector3(toNode.position.x, 0.1, toNode.position.y),
    ]);

    const material = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      linewidth: 2,
      transparent: true,
      opacity: 0.6,
    });

    const line = new THREE.Line(geometry, material);
    line.userData = { connectionId: connection.id, type: "connection" };

    this.connectionLines.set(connection.id, line);
    this.scene.add(line);
  }

  removeConnection(connectionId: string): void {
    const line = this.connectionLines.get(connectionId);
    if (line) {
      this.scene.remove(line);
      line.geometry.dispose();
      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      }
      this.connectionLines.delete(connectionId);
    }
  }

  private updateConnectionsForNode(nodeId: string): void {
    this.connectionLines.forEach((line, connectionId) => {
      if (connectionId.includes(nodeId)) {
        // Re-render connection
        this.removeConnection(connectionId);
        // Note: This would need the connection data to re-add
        // In practice, this should be called from the context after updating the graph
      }
    });
  }

  // Panorama Preview
  async loadPanorama(nodeId: string, imageUrl: string): Promise<void> {
    // Remove existing panorama
    if (this.panoramaSphere) {
      this.scene.remove(this.panoramaSphere);
      this.panoramaSphere.geometry.dispose();
      if (this.panoramaSphere.material instanceof THREE.Material) {
        this.panoramaSphere.material.dispose();
      }
    }

    try {
      const texture = await this.loadTexture(imageUrl);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      const geometry = new THREE.SphereGeometry(2, 64, 32);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide, // Render inside the sphere
      });

      this.panoramaSphere = new THREE.Mesh(geometry, material);

      // Position near the node
      const nodeMesh = this.nodeMeshes.get(nodeId);
      if (nodeMesh) {
        this.panoramaSphere.position.copy(nodeMesh.position);
        this.panoramaSphere.position.y += 1; // Slightly above the node
      }

      this.scene.add(this.panoramaSphere);
    } catch (error) {
      console.error("Failed to load panorama:", error);
      throw error;
    }
  }

  updatePanoramaAttributes(
    nodeId: string,
    rotation: number,
    heading: number,
    fov: number
  ): void {
    if (this.panoramaSphere) {
      this.panoramaSphere.rotation.y = (rotation * Math.PI) / 180;
      // Note: Heading and FOV would require more complex shader manipulation
      // For now, we just handle rotation
    }
  }

  // Camera Controls
  setCameraPosition(position: Vector3): void {
    this.camera.position.set(position.x, position.y, position.z);
  }

  setCameraTarget(target: Vector3): void {
    this.camera.lookAt(target.x, target.y, target.z);
  }

  // Rendering
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  // Event Handling
  getIntersections(
    mouse: THREE.Vector2,
    camera: THREE.Camera
  ): THREE.Intersection[] {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const objects = [
      ...Array.from(this.nodeMeshes.values()),
      ...Array.from(this.connectionLines.values()),
      this.floorplanMesh,
    ].filter(Boolean) as THREE.Object3D[];

    return raycaster.intersectObjects(objects);
  }

  // Utility Methods
  worldToScreen(worldPosition: Vector3): THREE.Vector3 {
    const vector = new THREE.Vector3(
      worldPosition.x,
      worldPosition.y,
      worldPosition.z
    );
    vector.project(this.camera);
    return vector;
  }

  screenToWorld(screenPosition: THREE.Vector2, planeY: number = 0): Vector3 {
    const vector = new THREE.Vector3(screenPosition.x, screenPosition.y, 0.5);
    vector.unproject(this.camera);

    const dir = vector.sub(this.camera.position).normalize();
    const distance = (planeY - this.camera.position.y) / dir.y;
    const worldPos = this.camera.position
      .clone()
      .add(dir.multiplyScalar(distance));

    return { x: worldPos.x, y: worldPos.z, z: worldPos.y }; // Note: Y and Z swapped for 2D plane
  }

  // Cleanup
  dispose(): void {
    // Dispose geometries and materials
    this.nodeMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    this.nodeMeshes.clear();

    this.connectionLines.forEach((line) => {
      line.geometry.dispose();
      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      }
    });
    this.connectionLines.clear();

    if (this.floorplanMesh) {
      this.floorplanMesh.geometry.dispose();
      if (this.floorplanMesh.material instanceof THREE.Material) {
        this.floorplanMesh.material.dispose();
      }
    }

    if (this.panoramaSphere) {
      this.panoramaSphere.geometry.dispose();
      if (this.panoramaSphere.material instanceof THREE.Material) {
        this.panoramaSphere.material.dispose();
      }
    }

    this.renderer.dispose();
  }

  // Getters
  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  // Resize handling
  setSize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

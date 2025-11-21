import * as THREE from "three";
import { GraphNode, GraphConnection, Vector3 } from "@/types/graph";

export class GraphAlgorithms {
  // Auto-layout algorithm using force-directed layout
  static autoLayout(
    nodes: GraphNode[],
    connections: GraphConnection[]
  ): Map<string, Vector3> {
    const positions = new Map<string, Vector3>();
    const iterations = 100;
    const k = 1; // Spring constant
    const repulsion = 100; // Repulsion force

    // Initialize random positions if not set
    nodes.forEach((node) => {
      if (!positions.has(node.id)) {
        positions.set(node.id, {
          x: (Math.random() - 0.5) * 10,
          y: 0,
          z: (Math.random() - 0.5) * 10,
        });
      }
    });

    // Force-directed layout iterations
    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, Vector3>();

      // Initialize forces
      nodes.forEach((node) => {
        forces.set(node.id, { x: 0, y: 0, z: 0 });
      });

      // Calculate repulsive forces between all pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const posA = positions.get(nodeA.id)!;
          const posB = positions.get(nodeB.id)!;

          const dx = posB.x - posA.x;
          const dz = posB.z - posA.z;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance > 0) {
            const force = repulsion / (distance * distance);
            const fx = (force * dx) / distance;
            const fz = (force * dz) / distance;

            const forceA = forces.get(nodeA.id)!;
            const forceB = forces.get(nodeB.id)!;

            forceA.x -= fx;
            forceA.z -= fz;
            forceB.x += fx;
            forceB.z += fz;
          }
        }
      }

      // Calculate attractive forces for connected nodes
      connections.forEach((connection) => {
        const nodeA = nodes.find((n) => n.id === connection.fromNodeId);
        const nodeB = nodes.find((n) => n.id === connection.toNodeId);

        if (nodeA && nodeB) {
          const posA = positions.get(nodeA.id)!;
          const posB = positions.get(nodeB.id)!;

          const dx = posB.x - posA.x;
          const dz = posB.z - posA.z;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance > 0) {
            const force = (distance * distance) / k;
            const fx = (force * dx) / distance;
            const fz = (force * dz) / distance;

            const forceA = forces.get(nodeA.id)!;
            const forceB = forces.get(nodeB.id)!;

            forceA.x += fx;
            forceA.z += fz;
            forceB.x -= fx;
            forceB.z -= fz;
          }
        }
      });

      // Apply forces with damping
      const damping = 0.9;
      nodes.forEach((node) => {
        const force = forces.get(node.id)!;
        const currentPos = positions.get(node.id)!;

        const newPos = {
          x: currentPos.x + force.x * damping * 0.01,
          y: 0,
          z: currentPos.z + force.z * damping * 0.01,
        };

        positions.set(node.id, newPos);
      });
    }

    return positions;
  }

  // A* pathfinding algorithm for navigation preview
  static findPath(
    startNodeId: string,
    endNodeId: string,
    nodes: GraphNode[],
    connections: GraphConnection[]
  ): GraphNode[] | null {
    const graph = this.buildAdjacencyList(nodes, connections);

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    // Initialize
    nodes.forEach((node) => {
      gScore.set(node.id, Infinity);
      fScore.set(node.id, Infinity);
    });

    gScore.set(startNodeId, 0);
    fScore.set(
      startNodeId,
      this.heuristic(
        nodes.find((n) => n.id === startNodeId)!,
        nodes.find((n) => n.id === endNodeId)!
      )
    );

    openSet.push({
      id: startNodeId,
      fScore: fScore.get(startNodeId)!,
    });

    while (openSet.length > 0) {
      // Find node with lowest fScore
      openSet.sort((a, b) => a.fScore - b.fScore);
      const current = openSet.shift()!;

      if (current.id === endNodeId) {
        return this.reconstructPath(cameFrom, current.id, nodes);
      }

      closedSet.add(current.id);

      const neighbors = graph.get(current.id) || [];
      for (const neighborId of neighbors) {
        if (closedSet.has(neighborId)) continue;

        const tentativeGScore =
          gScore.get(current.id)! +
          this.distance(
            nodes.find((n) => n.id === current.id)!,
            nodes.find((n) => n.id === neighborId)!
          );

        if (tentativeGScore < gScore.get(neighborId)!) {
          cameFrom.set(neighborId, current.id);
          gScore.set(neighborId, tentativeGScore);
          fScore.set(
            neighborId,
            tentativeGScore +
              this.heuristic(
                nodes.find((n) => n.id === neighborId)!,
                nodes.find((n) => n.id === endNodeId)!
              )
          );

          if (!openSet.find((n) => n.id === neighborId)) {
            openSet.push({
              id: neighborId,
              fScore: fScore.get(neighborId)!,
            });
          }
        }
      }
    }

    return null; // No path found
  }

  private static buildAdjacencyList(
    nodes: GraphNode[],
    connections: GraphConnection[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    nodes.forEach((node) => {
      graph.set(node.id, []);
    });

    connections.forEach((connection) => {
      const fromList = graph.get(connection.fromNodeId) || [];
      const toList = graph.get(connection.toNodeId) || [];

      if (connection.bidirectional) {
        fromList.push(connection.toNodeId);
        toList.push(connection.fromNodeId);
      } else {
        fromList.push(connection.toNodeId);
      }

      graph.set(connection.fromNodeId, fromList);
      graph.set(connection.toNodeId, toList);
    });

    return graph;
  }

  private static heuristic(nodeA: GraphNode, nodeB: GraphNode): number {
    return Math.sqrt(
      Math.pow(nodeB.position.x - nodeA.position.x, 2) +
        Math.pow(nodeB.position.z - nodeA.position.z, 2)
    );
  }

  private static distance(nodeA: GraphNode, nodeB: GraphNode): number {
    return Math.sqrt(
      Math.pow(nodeB.position.x - nodeA.position.x, 2) +
        Math.pow(nodeB.position.z - nodeA.position.z, 2)
    );
  }

  private static reconstructPath(
    cameFrom: Map<string, string>,
    currentId: string,
    nodes: GraphNode[]
  ): GraphNode[] {
    const path: GraphNode[] = [];
    let current = currentId;

    while (cameFrom.has(current)) {
      const node = nodes.find((n) => n.id === current);
      if (node) path.unshift(node);
      current = cameFrom.get(current)!;
    }

    const startNode = nodes.find((n) => n.id === current);
    if (startNode) path.unshift(startNode);

    return path;
  }

  // Graph clustering for large graphs
  static clusterNodes(
    nodes: GraphNode[],
    connections: GraphConnection[]
  ): GraphNode[][] {
    // Simple clustering based on connectivity
    const visited = new Set<string>();
    const clusters: GraphNode[][] = [];

    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        const cluster = this.dfsCluster(node.id, nodes, connections, visited);
        if (cluster.length > 0) {
          clusters.push(cluster);
        }
      }
    });

    return clusters;
  }

  private static dfsCluster(
    startId: string,
    nodes: GraphNode[],
    connections: GraphConnection[],
    visited: Set<string>
  ): GraphNode[] {
    const cluster: GraphNode[] = [];
    const stack = [startId];

    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        cluster.push(node);

        // Add connected nodes
        connections.forEach((conn) => {
          if (conn.fromNodeId === nodeId && !visited.has(conn.toNodeId)) {
            stack.push(conn.toNodeId);
          }
          if (conn.toNodeId === nodeId && !visited.has(conn.fromNodeId)) {
            stack.push(conn.fromNodeId);
          }
        });
      }
    }

    return cluster;
  }

  // Graph statistics
  static getGraphStats(nodes: GraphNode[], connections: GraphConnection[]) {
    const connectedComponents = this.clusterNodes(nodes, connections);
    const isolatedNodes = nodes.filter(
      (node) =>
        !connections.some(
          (conn) => conn.fromNodeId === node.id || conn.toNodeId === node.id
        )
    );

    return {
      totalNodes: nodes.length,
      totalConnections: connections.length,
      connectedComponents: connectedComponents.length,
      isolatedNodes: isolatedNodes.length,
      averageDegree: (connections.length * 2) / nodes.length,
      density:
        nodes.length > 1
          ? (connections.length * 2) / (nodes.length * (nodes.length - 1))
          : 0,
    };
  }
}

interface PathNode {
  id: string;
  fScore: number;
}

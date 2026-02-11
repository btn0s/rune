import { commandRegistry } from "./registry";

interface MatchResult {
  id: string;
  name: string;
  type: string;
  path: string;
  depth: number;
  bounds?: { x: number; y: number; width: number; height: number };
}

function getNodeBounds(node: SceneNode): { x: number; y: number; width: number; height: number } | undefined {
  if ("absoluteBoundingBox" in node && node.absoluteBoundingBox) {
    return {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    };
  }
  if ("x" in node && "y" in node && "width" in node && "height" in node) {
    return {
      x: (node as any).x,
      y: (node as any).y,
      width: (node as any).width,
      height: (node as any).height,
    };
  }
  return undefined;
}

function searchSubtree(
  node: BaseNode,
  nameFilter: string | undefined,
  typeFilter: string | undefined,
  pathFilter: string[] | undefined,
  maxDepth: number,
  maxResults: number,
  currentPath: string,
  currentDepth: number,
  results: MatchResult[],
): void {
  if (results.length >= maxResults) return;
  if (currentDepth > maxDepth) return;

  const matchesName = !nameFilter || node.name.toLowerCase().includes(nameFilter.toLowerCase());
  const matchesType = !typeFilter || node.type === typeFilter;
  const matchesPath = !pathFilter || doesPathMatch(currentPath, pathFilter);

  if (currentDepth > 0 && matchesName && matchesType && matchesPath) {
    const result: MatchResult = {
      id: node.id,
      name: node.name,
      type: node.type,
      path: currentPath,
      depth: currentDepth,
    };
    if (node.type !== "DOCUMENT" && node.type !== "PAGE") {
      result.bounds = getNodeBounds(node as SceneNode);
    }
    results.push(result);
  }

  if ("children" in node) {
    const children = (node as ChildrenMixin & BaseNode).children as readonly SceneNode[];
    for (const child of children) {
      const childPath = currentPath ? `${currentPath}/${child.name}` : child.name;
      searchSubtree(child, nameFilter, typeFilter, pathFilter, maxDepth, maxResults, childPath, currentDepth + 1, results);
      if (results.length >= maxResults) return;
    }
  }
}

function doesPathMatch(currentPath: string, pathSegments: string[]): boolean {
  const currentSegments = currentPath.toLowerCase().split("/");
  let segIdx = 0;
  for (const seg of currentSegments) {
    if (segIdx < pathSegments.length && seg.includes(pathSegments[segIdx])) {
      segIdx++;
    }
  }
  return segIdx === pathSegments.length;
}

commandRegistry.set("find_node_in_subtree", async (params) => {
  const { nodeId, name, type, path, maxDepth, maxResults } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (!name && !type && !path) {
    throw new Error("At least one of 'name', 'type', or 'path' is required");
  }

  const rootNode = await figma.getNodeByIdAsync(nodeId);
  if (!rootNode) throw new Error(`Node not found: ${nodeId}`);

  const pathFilter = path ? (path as string).toLowerCase().split("/").filter(Boolean) : undefined;
  const results: MatchResult[] = [];

  searchSubtree(
    rootNode,
    name,
    type,
    pathFilter,
    maxDepth ?? 100,
    maxResults ?? 50,
    "",
    0,
    results,
  );

  return {
    rootId: rootNode.id,
    rootName: rootNode.name,
    count: results.length,
    nodes: results,
  };
});

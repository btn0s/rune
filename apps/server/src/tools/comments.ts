import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";
import { logger } from "../logger";

interface FigmaComment {
  id: string;
  message: string;
  created_at: string;
  resolved_at?: string;
  order_id?: number;
  parent_id?: string;
  user: { handle: string; id: string };
  client_meta?: {
    node_id?: string;
    node_offset?: { x: number; y: number };
    x?: number;
    y?: number;
  };
}

interface GroupedComment {
  id: string;
  message: string;
  author: string;
  createdAt: string;
  resolved: boolean;
  orderNumber?: number;
  replies: Array<{
    id: string;
    message: string;
    author: string;
    createdAt: string;
  }>;
}

interface CommentGroup {
  nodeId: string | null;
  nodeName: string | null;
  proximity?: "pinned" | "nearby";
  comments: GroupedComment[];
}

function getApiToken(): string {
  const token =
    process.env.FIGMA_API_TOKEN ??
    process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Figma API token not found. Set FIGMA_API_TOKEN or FIGMA_PERSONAL_ACCESS_TOKEN environment variable.",
    );
  }
  return token;
}

async function fetchComments(fileKey: string): Promise<FigmaComment[]> {
  const token = getApiToken();
  const response = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/comments`,
    { headers: { "X-Figma-Token": token } },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Figma API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { comments: FigmaComment[] };
  return data.comments;
}

async function resolveNodeName(nodeId: string): Promise<string | null> {
  try {
    const result = (await sendCommand("get_node_by_id", { nodeId })) as {
      name?: string;
    };
    return result?.name ?? null;
  } catch {
    return null;
  }
}

interface NearestNodeResult {
  found: boolean;
  nodeId?: string;
  nodeName?: string;
  distance?: number;
}

async function findNearestNode(x: number, y: number): Promise<NearestNodeResult> {
  try {
    return (await sendCommand("find_nearest_node", { x, y, maxDistance: 200 })) as NearestNodeResult;
  } catch {
    return { found: false };
  }
}

// ─── get_comments ────────────────────────────────────────────────────────────

registerTool("get_comments", {
  title: "Get Comments",
  description:
    "Read all comments from the current Figma file via the REST API. " +
    "Returns comments grouped by the frame/node they're associated with, making it " +
    "easy to see which feedback belongs to which part of the design. " +
    "Each group includes the node ID, node name, and threaded comments with replies. " +
    "Comments pinned to a node show proximity: \"pinned\". Comments placed near (within 200px) " +
    "a frame but not directly pinned show proximity: \"nearby\". " +
    "Remaining comments are grouped under \"canvas\". " +
    "Requires FIGMA_API_TOKEN environment variable.",
  inputSchema: {
    includeResolved: z
      .boolean()
      .optional()
      .describe("Include resolved comment threads (default: false)"),
  },
}, async (args) => {
  const includeResolved = (args.includeResolved as boolean) ?? false;

  const fileKeyResult = (await sendCommand("get_file_key")) as {
    fileKey: string;
  };
  const fileKey = fileKeyResult.fileKey;

  logger.info(`get_comments: fetching comments for file ${fileKey}`);
  const allComments = await fetchComments(fileKey);

  const topLevel = allComments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, FigmaComment[]>();
  for (const c of allComments) {
    if (c.parent_id) {
      const existing = repliesByParent.get(c.parent_id) ?? [];
      existing.push(c);
      repliesByParent.set(c.parent_id, existing);
    }
  }

  const filtered = includeResolved
    ? topLevel
    : topLevel.filter((c) => !c.resolved_at);

  const groupMap = new Map<string, {
    nodeId: string | null;
    proximity: "pinned" | "nearby";
    comments: FigmaComment[];
  }>();

  for (const comment of filtered) {
    let nodeId = comment.client_meta?.node_id ?? null;
    let proximity: "pinned" | "nearby" = "pinned";

    if (!nodeId && comment.client_meta?.x !== undefined && comment.client_meta?.y !== undefined) {
      const nearest = await findNearestNode(comment.client_meta.x, comment.client_meta.y);
      if (nearest.found && nearest.nodeId) {
        nodeId = nearest.nodeId;
        proximity = "nearby";
      }
    }

    const key = nodeId ?? "__canvas__";
    const existing = groupMap.get(key);
    if (existing) {
      existing.comments.push(comment);
      if (proximity === "pinned") existing.proximity = "pinned";
    } else {
      groupMap.set(key, { nodeId, proximity, comments: [comment] });
    }
  }

  const groups: CommentGroup[] = [];
  for (const [, group] of groupMap) {
    let nodeName: string | null = null;
    if (group.nodeId) {
      nodeName = await resolveNodeName(group.nodeId);
    }

    const comments: GroupedComment[] = group.comments.map((c) => {
      const replies = (repliesByParent.get(c.id) ?? []).map((r) => ({
        id: r.id,
        message: r.message,
        author: r.user.handle,
        createdAt: r.created_at,
      }));

      return {
        id: c.id,
        message: c.message,
        author: c.user.handle,
        createdAt: c.created_at,
        resolved: !!c.resolved_at,
        orderNumber: c.order_id,
        replies,
      };
    });

    groups.push({
      nodeId: group.nodeId,
      nodeName: group.nodeId ? nodeName : "(canvas — not pinned to a node)",
      ...(group.nodeId ? { proximity: group.proximity } : {}),
      comments,
    });
  }

  groups.sort((a, b) => {
    if (a.nodeId && !b.nodeId) return -1;
    if (!a.nodeId && b.nodeId) return 1;
    return 0;
  });

  return {
    fileKey,
    totalComments: filtered.length,
    totalGroups: groups.length,
    groups,
  };
});

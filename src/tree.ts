import type { WebNode } from "./types";

const TAU = Math.PI * 2;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeAngle(a: number): number {
  const n = a % TAU;
  return n < 0 ? n + TAU : n;
}

/**
 * Pick an angle for a new child so it lands in the biggest empty gap among existing siblings.
 * - For root (parentOutward = undefined): full 2π circle.
 * - For non-root: constrained to a semicircle pointing outward from grandparent.
 */
export function computeChildAngle(
  existingAngles: number[],
  parentOutward: number | undefined,
): number {
  if (parentOutward === undefined) {
    if (existingAngles.length === 0) return -Math.PI / 2; // start at top
    const sorted = [...existingAngles].map(normalizeAngle).sort((a, b) => a - b);
    let bestGap = -1;
    let bestAngle = sorted[0];
    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      const b = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + TAU;
      const gap = b - a;
      if (gap > bestGap) {
        bestGap = gap;
        bestAngle = normalizeAngle(a + gap / 2);
      }
    }
    return bestAngle;
  }

  // Non-root: place within a semicircle centered on parentOutward (slightly narrowed
  // so children never fold back behind the parent).
  const range = Math.PI * 0.95;
  const lo = parentOutward - range / 2;
  if (existingAngles.length === 0) return parentOutward;

  // Map existing angles into offsets in [0, range] from lo; ignore any outside.
  const offsets = existingAngles
    .map((a) => {
      let d = ((a - lo) % TAU + TAU) % TAU;
      return d;
    })
    .filter((d) => d <= range)
    .sort((x, y) => x - y);

  if (offsets.length === 0) return parentOutward;

  let bestGap = offsets[0]; // gap from lo to first
  let bestOffset = offsets[0] / 2;
  for (let i = 0; i < offsets.length - 1; i++) {
    const gap = offsets[i + 1] - offsets[i];
    if (gap > bestGap) {
      bestGap = gap;
      bestOffset = offsets[i] + gap / 2;
    }
  }
  const tailGap = range - offsets[offsets.length - 1];
  if (tailGap > bestGap) {
    bestOffset = offsets[offsets.length - 1] + tailGap / 2;
  }
  return lo + bestOffset;
}

export function createNode(text: string): WebNode {
  return { id: newId(), text, children: [] };
}

export function addChild(root: WebNode, parentId: string, text: string): WebNode {
  return addChildHelper(root, parentId, text, undefined);
}

function addChildHelper(
  node: WebNode,
  parentId: string,
  text: string,
  parentOutward: number | undefined,
): WebNode {
  if (node.id === parentId) {
    const existing = node.children
      .map((c) => c.angle)
      .filter((a): a is number => typeof a === "number");
    const angle = computeChildAngle(existing, parentOutward);
    const newChild: WebNode = { id: newId(), text, children: [], angle };
    return { ...node, children: [...node.children, newChild] };
  }
  return {
    ...node,
    children: node.children.map((c) =>
      addChildHelper(c, parentId, text, c.angle),
    ),
  };
}

export function updateNode(root: WebNode, id: string, text: string): WebNode {
  if (root.id === id) return { ...root, text };
  return {
    ...root,
    children: root.children.map((c) => updateNode(c, id, text)),
  };
}

export function removeNode(root: WebNode, id: string): WebNode | null {
  if (root.id === id) return null;
  return {
    ...root,
    children: root.children
      .map((c) => removeNode(c, id))
      .filter((c): c is WebNode => c !== null),
  };
}

/**
 * Walk the tree and assign angles to any node missing one (e.g. data saved
 * before angles were tracked). Pure: returns a new tree.
 */
export function ensureAngles(root: WebNode): WebNode {
  function walk(node: WebNode, parentOutward: number | undefined): WebNode {
    const assigned: number[] = [];
    const newChildren = node.children.map((child) => {
      let angle = child.angle;
      if (typeof angle !== "number" || !Number.isFinite(angle)) {
        angle = computeChildAngle(assigned, parentOutward);
      }
      assigned.push(angle);
      return walk({ ...child, angle }, angle);
    });
    return { ...node, children: newChildren };
  }
  return walk(root, undefined);
}

import type { WebNode } from "./types";

export type LayoutPos = {
  x: number;
  y: number;
  depth: number;
  angle: number;
};

const BASE_RADIUS = 220;

/**
 * Radial layout that uses the angle stored on each node. Because angles are
 * assigned once at creation time and never re-computed, adding or removing
 * one node leaves every existing node in the same place.
 */
export function layoutRadial(root: WebNode): Map<string, LayoutPos> {
  const out = new Map<string, LayoutPos>();
  out.set(root.id, { x: 0, y: 0, depth: 0, angle: 0 });

  function place(node: WebNode, depth: number, parentX: number, parentY: number) {
    const childDepth = depth + 1;
    const radius = BASE_RADIUS * (1 + Math.log2(childDepth));
    for (const child of node.children) {
      const angle = typeof child.angle === "number" ? child.angle : 0;
      const x = parentX + Math.cos(angle) * radius;
      const y = parentY + Math.sin(angle) * radius;
      out.set(child.id, { x, y, depth: childDepth, angle });
      place(child, childDepth, x, y);
    }
  }

  place(root, 0, 0, 0);
  return out;
}

import type { WebNode } from "./types";
import { leafCount } from "./tree";

export type LayoutPos = {
  x: number;
  y: number;
  depth: number;
  angle: number;
};

const BASE_RADIUS = 220;

/**
 * Radial tree layout. Root at (0,0). Children are arranged in an angular wedge
 * proportional to their leaf count so dense subtrees get more room.
 */
export function layoutRadial(root: WebNode): Map<string, LayoutPos> {
  const out = new Map<string, LayoutPos>();
  out.set(root.id, { x: 0, y: 0, depth: 0, angle: 0 });

  // angleStart, angleEnd are absolute angles in radians; baseAngle is the
  // angle from the parent's parent to the parent (used to point children
  // outward from the parent's position).
  function place(
    node: WebNode,
    depth: number,
    angleStart: number,
    angleEnd: number,
    parentX: number,
    parentY: number,
  ) {
    const totalLeaves = node.children.reduce((s, c) => s + leafCount(c), 0) || 1;
    const wedge = angleEnd - angleStart;
    let cursor = angleStart;
    const childDepth = depth + 1;
    // Radius grows sub-linearly so deep webs stay compact-ish.
    const radius = BASE_RADIUS * (1 + Math.log2(childDepth));
    for (const child of node.children) {
      const share = (leafCount(child) / totalLeaves) * wedge;
      const childAngle = cursor + share / 2;
      const x = parentX + Math.cos(childAngle) * radius;
      const y = parentY + Math.sin(childAngle) * radius;
      out.set(child.id, { x, y, depth: childDepth, angle: childAngle });
      // Children of this child get a wedge centered on childAngle, slightly
      // narrower than `share` to keep grandchildren from fanning over siblings.
      const childWedge = Math.min(share, Math.PI * 0.9);
      place(
        child,
        childDepth,
        childAngle - childWedge / 2,
        childAngle + childWedge / 2,
        x,
        y,
      );
      cursor += share;
    }
  }

  place(root, 0, 0, Math.PI * 2, 0, 0);
  return out;
}

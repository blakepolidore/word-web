import type { WebNode } from "./types";

export type LayoutPos = {
  x: number;
  y: number;
  depth: number;
  angle: number;
};

const BASE_RADIUS = 150;
const RADIAL_INCREMENT = 120;

/**
 * Radial tidy-tree layout.
 *
 * - extent(node): bottom-up "angular weight". A leaf weighs 1; an internal
 *   node weighs the sum of its children. So a dense subtree claims more
 *   angular space, a sparse one claims less.
 * - place(): top-down. Each parent's wedge is split among its children in
 *   proportion to extent. Each child gets a contiguous, disjoint sub-wedge,
 *   so two distinct subtrees can never occupy the same angular sector — no
 *   cross-subtree bubble overlap, no crossing connector lines.
 * - Radius is fixed per depth: r_d = BASE_RADIUS + depth * RADIAL_INCREMENT.
 *   Connector lengths are bounded by RADIAL_INCREMENT plus a small lateral
 *   component, regardless of how deep the tree goes.
 */
export function layoutRadial(root: WebNode): Map<string, LayoutPos> {
  const out = new Map<string, LayoutPos>();
  const extents = new Map<string, number>();

  function extent(node: WebNode): number {
    const cached = extents.get(node.id);
    if (cached !== undefined) return cached;
    let value: number;
    if (node.children.length === 0) {
      value = 1;
    } else {
      let sum = 0;
      for (const c of node.children) sum += extent(c);
      value = Math.max(1, sum);
    }
    extents.set(node.id, value);
    return value;
  }

  out.set(root.id, { x: 0, y: 0, depth: 0, angle: 0 });

  function place(
    node: WebNode,
    wedgeStart: number,
    wedgeEnd: number,
    depth: number,
  ) {
    if (node.children.length === 0) return;
    const childDepth = depth + 1;
    const radius = BASE_RADIUS + depth * RADIAL_INCREMENT;
    const wedgeWidth = wedgeEnd - wedgeStart;
    let total = 0;
    for (const c of node.children) total += extent(c);
    let cursor = wedgeStart;
    for (const child of node.children) {
      const share = (extent(child) / total) * wedgeWidth;
      const childStart = cursor;
      const childEnd = cursor + share;
      cursor = childEnd;
      const angle = (childStart + childEnd) / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      out.set(child.id, { x, y, depth: childDepth, angle });
      place(child, childStart, childEnd, childDepth);
    }
  }

  // Start with the first child at the top: rotate the root wedge so its
  // bisector points up (−π/2).
  place(root, -Math.PI / 2 - Math.PI, -Math.PI / 2 + Math.PI, 0);

  return out;
}

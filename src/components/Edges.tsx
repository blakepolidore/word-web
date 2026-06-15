import type { WebNode } from "../types";
import type { LayoutPos } from "../layout";

type Props = {
  root: WebNode;
  positions: Map<string, LayoutPos>;
};

function collectEdges(
  node: WebNode,
  positions: Map<string, LayoutPos>,
  acc: { x1: number; y1: number; x2: number; y2: number; key: string }[],
) {
  const parent = positions.get(node.id);
  if (!parent) return;
  for (const child of node.children) {
    const c = positions.get(child.id);
    if (!c) continue;
    acc.push({
      x1: parent.x,
      y1: parent.y,
      x2: c.x,
      y2: c.y,
      key: `${node.id}->${child.id}`,
    });
    collectEdges(child, positions, acc);
  }
}

export function Edges({ root, positions }: Props) {
  const edges: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  collectEdges(root, positions, edges);
  return (
    <svg className="edges" overflow="visible">
      {edges.map((e) => (
        <line
          key={e.key}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="#94a3b8"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

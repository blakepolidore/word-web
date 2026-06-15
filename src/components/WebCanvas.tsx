import { useEffect, useMemo, useRef, useState } from "react";
import type { WebNode } from "../types";
import { layoutRadial } from "../layout";
import { Edges } from "./Edges";
import { Bubble } from "./Bubble";

type Props = {
  root: WebNode;
  onAddChild: (parentId: string, text: string) => void;
  onEditNode: (id: string, text: string) => void;
  onDeleteNode: (id: string) => void;
};

type View = { x: number; y: number; scale: number };

function flatten(node: WebNode): WebNode[] {
  return [node, ...node.children.flatMap(flatten)];
}

export function WebCanvas({ root, onAddChild, onEditNode, onDeleteNode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const draggingRef = useRef<{ startX: number; startY: number; vx: number; vy: number } | null>(
    null,
  );

  const positions = useMemo(() => layoutRadial(root), [root]);
  const nodes = useMemo(() => flatten(root), [root]);

  // Center the view on the root on first mount and when container resizes.
  useEffect(() => {
    function centerOnRoot() {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setView((v) => ({ ...v, x: r.width / 2, y: r.height / 2 }));
    }
    centerOnRoot();
    window.addEventListener("resize", centerOnRoot);
    return () => window.removeEventListener("resize", centerOnRoot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      vx: view.x,
      vy: view.y,
    };
    setAddingFor(null);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = draggingRef.current;
    if (!d) return;
    setView((v) => ({
      ...v,
      x: d.vx + (e.clientX - d.startX),
      y: d.vy + (e.clientY - d.startY),
    }));
  }

  function onPointerUp() {
    draggingRef.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const factor = Math.exp(-e.deltaY * 0.0015);
    setView((v) => {
      const newScale = Math.min(3, Math.max(0.25, v.scale * factor));
      const actualFactor = newScale / v.scale;
      // Zoom around cursor: keep the world-point under the cursor fixed.
      const x = mx - (mx - v.x) * actualFactor;
      const y = my - (my - v.y) * actualFactor;
      return { x, y, scale: newScale };
    });
  }

  function resetView() {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setView({ x: r.width / 2, y: r.height / 2, scale: 1 });
  }

  return (
    <div
      ref={containerRef}
      className="canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <div
        className="world"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
        }}
      >
        <Edges root={root} positions={positions} />
        {nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          return (
            <Bubble
              key={n.id}
              node={n}
              pos={p}
              isRoot={n.id === root.id}
              isAdding={addingFor === n.id}
              onStartAdd={() => setAddingFor(n.id)}
              onCommitAdd={(text) => {
                onAddChild(n.id, text);
                setAddingFor(n.id);
              }}
              onCancelAdd={() => setAddingFor(null)}
              onEdit={(text) => onEditNode(n.id, text)}
              onDelete={() => onDeleteNode(n.id)}
            />
          );
        })}
      </div>

      <div className="toolbar">
        <button type="button" onClick={resetView}>
          Reset view
        </button>
      </div>
      <div className="hint">Click a bubble to branch off it · Drag to pan · Scroll to zoom</div>
    </div>
  );
}

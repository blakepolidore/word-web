import { useEffect, useRef, useState } from "react";
import type { WebNode } from "../types";
import type { LayoutPos } from "../layout";

type Props = {
  node: WebNode;
  pos: LayoutPos;
  isRoot: boolean;
  isAdding: boolean;
  onStartAdd: () => void;
  onCommitAdd: (text: string) => void;
  onCancelAdd: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
};

const PALETTE = [
  "#475569", // root — slate
  "#5fa674", // green
  "#1e1b4b", // indigo-dark
  "#ef6b6b", // coral
  "#5b3a8b", // purple
  "#2c7a7b", // teal
  "#b45309", // burnt orange
];

function colorForDepth(depth: number): string {
  return PALETTE[depth % PALETTE.length];
}

export function Bubble({
  node,
  pos,
  isRoot,
  isAdding,
  onStartAdd,
  onCommitAdd,
  onCancelAdd,
  onEdit,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [addText, setAddText] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  useEffect(() => {
    if (editing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editing]);

  const bg = colorForDepth(isRoot ? 0 : pos.depth);
  const textLight = true;

  function commitAdd() {
    const t = addText.trim();
    if (t) onCommitAdd(t);
    setAddText("");
  }

  function commitEdit() {
    const t = editText.trim();
    if (t && t !== node.text) onEdit(t);
    setEditing(false);
  }

  return (
    <div
      className="bubble-wrap"
      style={{
        left: pos.x,
        top: pos.y,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="bubble"
        style={{
          background: bg,
          color: textLight ? "#fff" : "#111",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (editing) return;
          onStartAdd();
        }}
      >
        {editing ? (
          <input
            ref={editInputRef}
            className="bubble-edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setEditText(node.text);
                setEditing(false);
              }
            }}
            onBlur={commitEdit}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="bubble-text">{node.text}</span>
        )}

        {!editing && (
          <div className="bubble-controls" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="bubble-btn"
              title="Edit"
              onClick={() => {
                setEditText(node.text);
                setEditing(true);
              }}
            >
              ✎
            </button>
            <button
              type="button"
              className="bubble-btn"
              title={isRoot ? "Clear web" : "Delete"}
              onClick={onDelete}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {isAdding && !editing && (
        <div className="add-input-wrap" onClick={(e) => e.stopPropagation()}>
          <input
            ref={addInputRef}
            className="add-input"
            value={addText}
            placeholder="Add a connection…"
            onChange={(e) => setAddText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setAddText("");
                onCancelAdd();
              }
            }}
            onBlur={() => {
              if (addText.trim()) commitAdd();
              else onCancelAdd();
            }}
          />
        </div>
      )}
    </div>
  );
}

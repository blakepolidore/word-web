import type { WebNode } from "./types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createNode(text: string): WebNode {
  return { id: newId(), text, children: [] };
}

export function addChild(root: WebNode, parentId: string, text: string): WebNode {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, createNode(text)] };
  }
  return {
    ...root,
    children: root.children.map((c) => addChild(c, parentId, text)),
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

export function leafCount(node: WebNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + leafCount(c), 0);
}

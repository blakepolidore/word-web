import { useEffect, useState } from "react";
import type { WebNode, WebState } from "./types";
import { loadWeb, saveWeb, clearWeb } from "./storage";
import { addChild, createNode, removeNode, updateNode } from "./tree";
import { WebCanvas } from "./components/WebCanvas";

export default function App() {
  const [state, setState] = useState<WebState>(() => loadWeb());
  const [rootDraft, setRootDraft] = useState("");

  useEffect(() => {
    saveWeb(state);
  }, [state]);

  function handleAddRoot(text: string) {
    const t = text.trim();
    if (!t) return;
    setState({ root: createNode(t) });
    setRootDraft("");
  }

  function handleAddChild(parentId: string, text: string) {
    setState((s) => (s.root ? { root: addChild(s.root, parentId, text) } : s));
  }

  function handleEdit(id: string, text: string) {
    setState((s) => (s.root ? { root: updateNode(s.root, id, text) } : s));
  }

  function handleDelete(id: string) {
    setState((s) => {
      if (!s.root) return s;
      const next = removeNode(s.root, id);
      return { root: next };
    });
  }

  function handleClearAll() {
    clearWeb();
    setState({ root: null });
  }

  if (!state.root) {
    return (
      <div className="empty-screen">
        <div className="empty-card">
          <h1>Word Web</h1>
          <p>Start with a word or phrase, then branch out.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddRoot(rootDraft);
            }}
          >
            <input
              autoFocus
              className="root-input"
              placeholder="e.g. Halloween"
              value={rootDraft}
              onChange={(e) => setRootDraft(e.target.value)}
            />
            <button type="submit" className="primary-btn">
              Begin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="brand">Word Web</span>
        <button type="button" className="ghost-btn" onClick={handleClearAll}>
          Clear web
        </button>
      </header>
      <WebCanvas
        root={state.root as WebNode}
        onAddChild={handleAddChild}
        onEditNode={handleEdit}
        onDeleteNode={handleDelete}
      />
    </div>
  );
}

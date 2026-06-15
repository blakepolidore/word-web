export type WebNode = {
  id: string;
  text: string;
  children: WebNode[];
  /** Absolute angle (radians) from parent's center to this node. Assigned once at creation. */
  angle?: number;
};

export type WebState = {
  root: WebNode | null;
};

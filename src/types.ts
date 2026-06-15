export type WebNode = {
  id: string;
  text: string;
  children: WebNode[];
};

export type WebState = {
  root: WebNode | null;
};

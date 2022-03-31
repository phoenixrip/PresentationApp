import type { MutableRefObject } from 'react';

export interface TreeItem {
  id: string;
  children: TreeItem[];
  collapsed?: boolean;
  objType?: string;
}

export type TreeItems = TreeItem[];

export interface FlattenedItem extends TreeItem {
  parentId: null | string;
  depth: number;
  index: number;
  uniqueGlobalId?: string;
}

export type SensorContext = MutableRefObject<{
  items: FlattenedItem[];
  offset: number;
}>;

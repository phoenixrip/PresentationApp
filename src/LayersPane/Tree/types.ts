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
  guid?: string;
}

export type SensorContext = MutableRefObject<{
  items: FlattenedItem[];
  offset: number;
}>;

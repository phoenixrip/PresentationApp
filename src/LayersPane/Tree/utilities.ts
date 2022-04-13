// @ts-nocheck

import { arrayMove } from '@dnd-kit/sortable';
import { CustomFabricObject } from '../../Types/CustomFabricTypes';

import type { FlattenedItem, TreeItem, TreeItems } from './types';

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

interface NewTreeItem extends Partial<CustomFabricObject> {
  children: Array<NewTreeItem>,
  guid: string,
  treeIndex?: number,
  parentID: string | undefined,
  depth: number,
  type: string
}


export function getProjection(
  items: NewFlattenedItem[],
  activeId: string,
  overId: string,
  dragOffset: number,
  indentationWidth: number
) {
  const activeItemIndex = items.findIndex(({ id }) => id === activeId)
  const activeItem = items[activeItemIndex]

  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const overItem = items[overItemIndex]
  // const canDropInOver = canDropIn(overItem)
  // console.log(`overItemIndex: ${overItemIndex}, can drop: ${canDropInOver}`)


  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth

  const effectiveNextDepth = nextItem?.depth || 0
  let effectivePrevDepth = 0
  if (previousItem) {
    if (previousItem?.handleChildrenMode !== undefined) {
      const isDefinedAsCantRecieve = previousItem?.cantRecieveTypes?.[activeItem.type]
      const isCanRecieveDefined = previousItem?.canRecieveTypes !== undefined
      const isDefinedAsCanRecieve = previousItem?.canRecieveTypes?.[activeItem.type]
      const canDropUnder = (isDefinedAsCantRecieve || (isCanRecieveDefined && isDefinedAsCanRecieve))
      console.log(`${canDropUnder ? 'CAN' : 'cant'} drop a ${activeItem.type} into a ${previousItem.type}`)
      if (canDropUnder) {
        effectivePrevDepth = (previousItem.depth + 1)
      } else {
        effectivePrevDepth = previousItem.depth
      }
    } else {
      effectivePrevDepth = previousItem?.depth ?? 0
    }
  }

  const maxDepth = Math.max(effectiveNextDepth, effectivePrevDepth)
  const minDepth = Math.min(effectiveNextDepth, effectivePrevDepth)
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }
  const parentID = getParentId()
  return { depth, maxDepth, minDepth, parentID };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentID;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentID;
    return newParent ?? null;
  }
  function canDropIn(checkItem) {
    if (!checkItem?.handleChildrenMode) return false
    const isDefinedAsCantRecieve = checkItem?.cantRecieveTypes?.[activeItem.type]
    const isCanRecieveDefined = checkItem?.canRecieveTypes !== undefined
    const isDefinedAsCanRecieve = checkItem?.canRecieveTypes?.[activeItem.type]
    const canDropUnder = (isDefinedAsCantRecieve || (isCanRecieveDefined && isDefinedAsCanRecieve))
    return canDropUnder
  }
}

function getMaxDepth({ previousItem }: { previousItem: NewFlattenedItem }) {
  if (previousItem) {
    return previousItem.depth + 1;
  }

  return 0;
}

function getMinDepth({ nextItem }: { nextItem: NewFlattenedItem }) {
  if (nextItem) {
    return nextItem.depth;
  }
  return 0;
}

function flatten(
  items: NewTreeItem[],
  parentID: string | null = null,
  depth = 0
): Array<NewFlattenedItem[]> {
  return items.reduce((acc, item) => {
    return [
      ...acc,
      { ...item, parentID, depth },
      ...flatten(item.children, item.id, depth + 1),
    ];
  }, [])
}

export function flattenTree(items: Array<NewTreeItem>): NewFlattenedItem[] {
  return flatten(items);
}


// interface NewTreeItem extends CustomFabricObject {}
interface NewFlattenedItem {
  children: Array<NewTreeItem>,
  guid: string,
  treeIndex?: number,
  parentID: string | undefined,
  depth: number,
  type: string
  collapsed?: boolean,
}
export type { NewTreeItem }

export function buildTree(flattenedItems: Array<CustomFabricObject>) {
  const root = { id: 'root', children: [] }
  const nodes = { [root.id]: root };
  const items: Array<NewFlattenedItem> = flattenedItems.map((item) => ({
    type: item.type,
    id: item.guid,
    guid: item.guid,
    children: [],
    depth: item.depth,
    parentID: item.parentID,
    structurePath: item.structurePath,
    treeIndex: item.treeIndex,
    topLevelIndex: item.topLevelIndex,
    userLocked: item.userLocked,
    handleChildrenMode: item.handleChildrenMode,
    canRecieveTypes: item.canRecieveTypes,
    cantRecieveTypes: item.cantRecieveTypes,
    children: [],
    collapsed: item.collapsed
  }));

  for (const item of items) {
    const { id, children } = item;
    const parentID = item.parentID ?? root.id;
    const parent = nodes[parentID] ?? findItem(items, parentID);

    nodes[id] = { ...item, id, children, parentID };
    parent.children.push(item);
  }

  return root.children;
}

export function findItem(items: NewTreeItem[], itemId: string) {
  return items.find(({ id }) => id === itemId);
}

export function findItemDeep(
  items: TreeItems,
  itemId: string
): TreeItem | undefined {
  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children.length) {
      const child = findItemDeep(children, itemId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

export function removeItem(items: TreeItems, id: string) {
  const newItems = [];

  for (const item of items) {
    if (item.id === id) {
      continue;
    }

    if (item.children.length) {
      item.children = removeItem(item.children, id);
    }

    newItems.push(item);
  }

  return newItems;
}

export function setProperty<T extends keyof TreeItem>(
  items: TreeItems,
  id: string,
  property: T,
  setter: (value: TreeItem[T]) => TreeItem[T]
) {
  for (const item of items) {
    if (item.id === id) {
      item[property] = setter(item[property]);
      continue;
    }

    if (item.children.length) {
      item.children = setProperty(item.children, id, property, setter);
    }
  }

  return [...items];
}

function countChildren(items: TreeItem[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount(items: TreeItems, id: string) {
  if (!id) {
    return 0;
  }

  const item = findItemDeep(items, id);

  return item ? countChildren(item.children) : 0;
}

export function removeChildrenOf(items: NewFlattenedItem[], ids: string[]) {
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item.parentID && excludeParentIds.includes(item.parentID)) {
      if (item.children.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }

    return true;
  });
}

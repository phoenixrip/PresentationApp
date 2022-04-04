interface CustomFabricObject extends fabric.Object {
  guid: string,
  userSetName: string,
  firstOccurrenceIndex?: number,
  parentID?: string,
  members?: Array<string>,
  objects?: Array<CustomFabricObject>,
  radius?: number,
  objectIndex?: number,
  treeIndex?: number,
  topLevelIndex?: number,
  depth?: number,
  structurePath?: Array<string>,
  text?: string
}

interface CustomFabricCircle extends CustomFabricObject, fabric.Circle { }
interface CustomFabricGroup extends CustomFabricObject, fabric.Group { }

export type {
  CustomFabricObject,
  CustomFabricCircle,
  CustomFabricGroup
}
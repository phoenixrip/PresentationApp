interface CustomFabricObject extends fabric.Object {
  uniqueGlobalId: string,
  userSetName: string,
  firstOccurrenceIndex?: number,
  parentGUID?: string,
  members?: Array<string>,
  objects?: Array<CustomFabricObject>,
  radius?: number,
  objectIndex?: number
}

interface CustomFabricCircle extends CustomFabricObject, fabric.Circle { }
interface CustomFabricGroup extends CustomFabricObject, fabric.Group { }

export type {
  CustomFabricObject,
  CustomFabricCircle,
  CustomFabricGroup
}
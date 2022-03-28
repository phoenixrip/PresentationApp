interface CustomFabricObject extends fabric.Object {
  uniqueGlobalId: string,
  userSetName: string,
  firstOccurrenceIndex: number
}

interface CustomFabricCircle extends CustomFabricObject, fabric.Circle {}

export type {
  CustomFabricObject,
  CustomFabricCircle
}
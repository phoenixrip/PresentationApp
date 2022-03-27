interface CustomFabricObject extends fabric.Object {
  uniqueGlobalId: string,
  userSetName: string
}

interface CustomFabricCircle extends CustomFabricObject, fabric.Circle {}

export type {
  CustomFabricObject,
  CustomFabricCircle
}
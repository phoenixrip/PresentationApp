function FakeGroup() {
  if (fabric.FakeGroup) return

  fabric.FakeGroup = fabric.util.createClass(fabric.Rect, {
    type: 'FakeGroup',
    handleChildrenMode: 'default',
    cantRecieveTypes: {},
    initialize(options) {
      this.callSuper('initialize', options)
      this.set({ selectable: false, evented: false, fill: undefined })
    },
    toggleUserLocked() {
      this.callSuper('toggleUserLocked')
      if (this.userLocked) {
        this.forEachChild(obj => obj.setUserLocked(true))
      } else {
        this.forEachChild(obj => obj.setUserLocked(false))
      }
      this.canvas?.requestRenderAll()
    },
    toggleVisibility() {
      this.callSuper('toggleVisibility')
      if (this.visible) {
        this.forEachChild(obj => obj.set({ visible: true }))
      } else {
        this.forEachChild(obj => obj.set({ visible: false }))
      }
      this.canvas?.requestRenderAll()
    },
    forEachChild(callBack) {
      const myStructurePathLength = this.structurePath.length
      let currI = (this?.treeIndex ?? 0) + 1
      while (this.canvas._objects?.[currI] && this.canvas._objects[currI].structurePath.length > myStructurePathLength) {
        const currChildObject = this.canvas._objects[currI]
        callBack(currChildObject)
        currI++
      }
    }
  })

  fabric.FakeGroup.fromObject = function (object, callback) {
    const obj = fabric.Object._fromObject('FakeGroup', object, callback);
    return obj
  }
}

export {
  FakeGroup
}
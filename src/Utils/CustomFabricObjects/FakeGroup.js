function FakeGroup() {
  if (fabric.FakeGroup) return

  fabric.FakeGroup = fabric.util.createClass(fabric.Rect, {
    type: 'FakeGroup',
    handleChildrenMode: 'default',
    cantRecieveTypes: {},
    initialize(options) {
      this.callSuper('initialize', options)
      this.set({ selectable: false, evented: false, fill: undefined })
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
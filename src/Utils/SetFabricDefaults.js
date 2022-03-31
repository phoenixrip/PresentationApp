import { fabric } from 'fabric'

function setFabricDefaults() {
  fabric.Object.prototype.set({
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerColor: '#4AB9D1',
    cornerStrokeColor: '#fff',
    borderColor: '#70ABFF',
    lockScalingFlip: true,
    paintFirst: "stroke",
    setUserName: "",
    includeDefaultValues: false,
    strokeWidth: 0
  })

  fabric.FakeGroup = FakeGroup
  // fabric.Canvas.prototype.setActiveObject = ((oldFunc) => {
  //   console.log('new set active object')
  //   fabric.Canvas.prototype.setActiveObject()
  // })(fabric.Canvas.prototype.setActiveObject)
}



class FakeGroup extends fabric.Rect {
  type = 'FakeGroup'
  initialize(options) {
    this.callSuper('initialize', options)
    this.set({
      selectable: false,
      evented: false,
      fill: undefined,
      visible: false,
    })
    return this
  }
}

export {
  setFabricDefaults,
  FakeGroup
}
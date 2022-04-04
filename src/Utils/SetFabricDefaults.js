import { faB } from '@fortawesome/free-solid-svg-icons'
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

  fabric.FakeGroup = fabric.util.createClass(fabric.Rect, {
    type: 'FakeGroup',
    initialize(options) {
      this.callSuper('initialize', options)
      this.set({
        selectable: false,
        evented: false,
        fill: undefined,
        visible: false,
      })
    }
  })

  fabric.CTextBox = fabric.util.createClass(fabric.Textbox, {
    type: 'CTextBox',
    initialize(text, options) {
      this.callSuper('initialize', text, options)
      this.bgRect = new fabric.Rect({
        fill: 'rgba(0, 0, 0, 0.75)',
        rx: 10,
        ry: 10,
        objectCaching: false
      })
    },
    _render(ctx) {
      this.bgRect.set({ width: this.width + 10, height: this.height + 10 })
      this.bgRect._render(ctx)
      console.log('CTextBoxRender')
      this.callSuper('_render', ctx)
    }
  })

  // fabric.CTextBox = CTextBox
}

// class CTextBox extends fabric.Textbox {
//   type = 'CTextBox'
//   _render(ctx) {

//     this.callSuper('_render', ctx)
//   }
// }

export {
  setFabricDefaults,
  // CTextBox,
  // FakeGroup
}
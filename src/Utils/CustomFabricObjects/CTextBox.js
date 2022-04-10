import gsap from 'gsap'

function CTextBox() {
  if (fabric.CTextBox) return
  fabric.CTextBox = fabric.util.createClass(fabric.Textbox, {
    type: 'CTextBox',
    initialize(text, options) {
      this.callSuper('initialize', text, options)
      // this.padding = 5
      // this.bgRect = new fabric.Rect({
      //   fill: 'rgba(0, 0, 0, 0.5)',
      //   objectCaching: false
      // })
      this.getObjectInTimeline = CTextBoxObjectInAnimations['default'].bind(this)
    },
    _render(ctx) {
      // this.bgRect.set({ width: this.width + 10, height: this.height + 10 })
      // this.bgRect._render(ctx)
      // this.fill = 'rgba(0, 0, 0, 0)'
      // console.log('CTextBoxRender')
      this.callSuper('_render', ctx)
    }
  })
  fabric.CTextBox.fromObject = function (object, callback) {
    return fabric.Object._fromObject('CTextBox', object, callback, 'text');
  }
}

const CTextBoxObjectInAnimations = {
  'default': function (animationSettings) {
    // This is the fabric.CTextBox instance
    const inTL = gsap.timeline({
      paused: true,
      onUpdate: this.canvas.requestRenderAll.bind(this.canvas)
    })
    inTL
      .fromTo(this, { opacity: 0 }, { opacity: 1, duration: 0.1 })
    return inTL
  }
}

export {
  CTextBox
}
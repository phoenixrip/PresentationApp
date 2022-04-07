import { fabric } from 'fabric'
import { customAttributesToIncludeInFabricCanvasToObject } from './consts'
import gsap from 'gsap'

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
    strokeWidth: 0,
    hasRotatingPoint: false
  })

  fabric.Object.prototype.getAnimatableValues = function () {
    let object = {}
    fabric.util.populateWithProperties(
      this,
      object,
      [
        ...customAttributesToIncludeInFabricCanvasToObject,
        'top',
        'left',
        'width',
        'height',
        'scaleX',
        'scaleY',
        'opacity'
      ]
    )
    return object
  }

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

  fabric.FakeGroup.fromObject = function (object, callback) {
    const obj = fabric.Object._fromObject('FakeGroup', object, callback);
    return obj
  }

  fabric.CTextBox = fabric.util.createClass(fabric.Textbox, {
    type: 'CTextBox',
    initialize(text, options) {
      this.callSuper('initialize', text, options)
      this.padding = 5
      this.bgRect = new fabric.Rect({
        fill: 'rgba(0, 0, 0, 0.5)',
        objectCaching: false
      })
      this.getObjectInTimeline = CTextBoxObjectInAnimations['default'].bind(this)
    },
    _render(ctx) {
      this.bgRect.set({ width: this.width + 10, height: this.height + 10 })
      this.bgRect._render(ctx)
      console.log('CTextBoxRender')
      this.callSuper('_render', ctx)
    }
  })
  fabric.CTextBox.fromObject = function (object, callback) {
    return fabric.Object._fromObject('CTextBox', object, callback, 'text');
  }
  const CTextBoxObjectInAnimations = {
    'default': function (animationSettings) {
      // This is the fabric.CTextBox instance
      console.log('GET CTEXTBOX IN ANIM')
      const inTL = gsap.timeline({
        paused: true,
        onUpdate: () => {
          console.log('cTextIn update')
          this.canvas.requestRenderAll()//.bind(this.canvas)
        }
      })
      inTL.fromTo(this.bgRect, {
        width: 0
      }, {
        width: this.width
      })
      return inTL
    }
  }
  fabric.CRect = fabric.util.createClass(fabric.Rect, {
    type: 'CRect',
    initialize(options) {
      this.callSuper('initialize', options)
      if (Array.isArray(options.fill)) {
        this.fillLayers = options.fill
      }
      this.objectCaching = false
    },
    drawObject(ctx, forClipping = false) {
      if (this.fillLayers) {
        this.fillLayers.forEach(fill => {
          this.fill = fill
          this._setFillStyles(ctx, this)
          this._render(ctx)
        })
      } else {
        this.callSuper('drawObject', ctx, forClipping)
      }
    },
    addNewLayerFillAtIndex(addAtIndex, newLayerData = 'red') {

    },
    updateLayerFill(layerIndex, newLayerData = 'blue') {

    }
  })
  fabric.CRect.fromObject = function (object, callback) {
    const obj = fabric.Object._fromObject('CRect', object, callback);
    return obj
  }


  fabric.LabelElement = fabric.util.createClass(fabric.Textbox, {
    type: 'LabelElement',
    _render(ctx) {
      this.callSuper('_render', ctx)
    }
  })
}

export {
  setFabricDefaults,
  // CTextBox,
  // FakeGroup
}
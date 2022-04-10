import { fabric } from 'fabric'
import { customAttributesToIncludeInFabricCanvasToObject } from './consts'
import { CTextBox } from './CustomFabricObjects/CTextBox'

function setFabricDefaults() {
  // All object default settings
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

  CTextBox()

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
    initialize(text, options) {
      this.callSuper('initialize', text, {
        fontSize: 29,
        fontFamily: 'Arial',
        fill: 'white',
        ...options
      })
      this.bgRect = new fabric.Rect({
        ...options.bgRectOptions,
        objectCaching: false
      })
    },
    _render(ctx) {
      this.bgRect.set({ width: this.width + 10, height: this.height + 10 })
      this.bgRect._render(ctx)
      this.callSuper('_render', ctx)
    }
  })
  fabric.LabelElement.fromObject = function (object, callback) {
    return fabric.Object._fromObject('LabelElement', object, callback, 'text');
  }


  fabric.TargetOverlayPath = fabric.util.createClass(fabric.Rect, {
    initialize(options, pathObjects = []) {
      this.callSuper('initialize', options)
      this.pathObjects = pathObjects.map(pathObj => new fabric.Path(pathObj.path, {
        top: pathObj.top,
        left: pathObj.left,
        scaleX: pathObj.scaleX,
        scaleY: pathObj.scaleY,
        fill: 'red',
        pathOffset: pathObj.pathOffset
      }))
      this.on('added', this.handleAdded)
    },
    handleAdded() {
      console.log('TargetOverlayPath added',)
      this.set({
        width: this.canvas.projectSettings.dimensions.width,
        height: this.canvas.projectSettings.dimensions.height,
        top: 0,
        left: 0
      })
      // this.pathObjects.forEach(obj => this.canvas.add(obj))
    },
    _render(ctx) {
      this.callSuper('_render', ctx)
      this.pathObjects.forEach(obj => {
        obj.render(ctx)
      })
    }
  })

  fabric.ObjectLabelGroup = fabric.util.createClass(fabric.Group, {
    type: 'ObjectLabelGroup',
    initialize(paths, options) {
      console.log('ObjectLabelGroup')
      this.callSuper('initialize', paths, options)
    },
    // drawObject: function (ctx) {
    // },
  })
}

export {
  setFabricDefaults,
  // CTextBox,
  // FakeGroup
}
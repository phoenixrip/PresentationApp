import { fabric } from 'fabric'
import { customAttributesToIncludeInFabricCanvasToObject } from './consts'
import { CTextBox } from './CustomFabricObjects/CTextBox'
import { CustomImageObject } from './CustomFabricObjects/CustomImageObject'
import { CustomMediaObject } from './CustomFabricObjects/CustomMediaObject'
import { FakeGroup } from './CustomFabricObjects/FakeGroup'
import fillableTextBox from './CustomFabricObjects/FillableTextBox'
import { createCustomControls } from './fabricCustomControls'

function setFabricDefaults() {
  // All object default settings
  createCustomControls()

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
  })


  fabric.Object.prototype.controls = {
    ...fabric.Object.prototype.controls,
    mtr: new fabric.Control({ visible: false })
  }
  fabric.Textbox.prototype.controls = {
    ...fabric.Textbox.prototype.controls,
    mtr: new fabric.Control({ visible: false })
  }

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
        'opacity',
        'visible'
      ]
    )
    return object
  }

  fabric.Object.prototype.toggleUserLocked = function () {
    if (!this.userLocked) {
      this.setUserLocked(true)
    } else {
      this.setUserLocked(false)
    }
    this.canvas?.requestRenderAll()
    if (this?.handleChildrenMode) {
      if (this.userLocked) {
        this.forEachChild(obj => obj.setUserLocked(true))
      } else {
        this.forEachChild(obj => obj.setUserLocked(false))
      }
    }
    return this
  }

  fabric.Object.prototype.forEachChild = function (callBack) {
    this.canvas.logFlatVisual()
    const myStructurePathLength = this.structurePath.length
    let currI = (this?.treeIndex ?? 0) + 1
    while (this.canvas._objects?.[currI] && this.canvas._objects[currI].structurePath.length > myStructurePathLength) {
      const currChildObject = this.canvas._objects[currI]
      console.log(currChildObject.type, currChildObject.structurePath)
      callBack(currChildObject)
      currI++
    }
  }

  fabric.Object.prototype.toggleVisibility = function () {
    if (!this.visible) {
      this.set({ visible: true })
    } else {
      this.set({ visible: false })
    }
    if (this?.handleChildrenMode) {
      if (this.visible) {
        this.forEachChild(obj => obj.set({ visible: true }))
      } else {
        this.forEachChild(obj => obj.set({ visible: false }))
      }
    }
    this.canvas?.requestRenderAll()
    return this
  }

  fabric.Object.prototype.setUserLocked = function (newUserLockedValue = true) {
    if (newUserLockedValue) {
      this.userLocked = true
      this.selectable = false
      this.evented = false
    } else {
      this.selectable = true
      this.evented = true
      this.userLocked = false
    }
  }

  CTextBox()
  FakeGroup()
  CustomImageObject()
  CustomMediaObject()
  fillableTextBox()

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
    handleChildrenMode: 'default',
    canRecieveTypes: {
      'path': true,
      'polygon': true,
      'polyline': true,
      'CRect': true
    },
    initialize(text, options) {
      this.callSuper('initialize', text, {
        fontSize: 29,
        fontFamily: 'Arial',
        fill: 'white',
        textAlign: 'center',
        ...options
      })
      this.bgRect = new fabric.Rect({
        ...options.bgRectOptions,
        objectCaching: false
      })
    },
    _render(ctx) {
      this.bgRect.set({ width: this.width + 20, height: this.height + 20 })
      this.bgRect._render(ctx)
      this.callSuper('_render', ctx)
    }
  })

  fabric.LabelElement.fromObject = function (object, callback) {
    return fabric.Object._fromObject('LabelElement', object, callback, 'text');
  }



  fabric.LabelAndTargetsGroup = fabric.util.createClass(fabric.FakeGroup, {
    type: 'LabelAndTargetsGroup',
    handleChildrenMode: 'locked',
    initialize(options) {
      this.callSuper('initialize', options)
    }
  })
  fabric.LabelAndTargetsGroup.fromObject = function (object, callback) {
    const obj = fabric.Object._fromObject('LabelAndTargetsGroup', object, callback);
    return obj
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
    },
    _render(ctx) {
      this.callSuper('_render', ctx)
      this.pathObjects.forEach(obj => {
        obj.render(ctx)
      })
    }
  })

  fabric.ImageLabelGroup = fabric.util.createClass(fabric.FakeGroup, {
    type: 'ImageLabelGroup',
    initialize() {

    }
  })

  fabric.ObjectLabelGroup = fabric.util.createClass(fabric.Group, {
    type: 'ObjectLabelGroup',
    initialize(paths, options) {
      console.log('ObjectLabelGroup')
      this.callSuper('initialize', paths, options)
    },
  })

  fabric.LockedGroup = fabric.util.createClass(fabric.FakeGroup, {
    type: 'LockedGroup',
  })

  fabric.InteractionCreatorRect = fabric.util.createClass(fabric.CRect, {
    type: 'InteractionCreatorRect',
    active: false,
    initialize(options) {
      this.callSuper(options)
      this.set({
        fill: 'rgba(0, 0, 0, 0.5)',
        stroke: '#478bff',
        strokeWidth: 2,
      })
    }
  })

}

export {
  setFabricDefaults,
  // CTextBox,
  // FakeGroup
}
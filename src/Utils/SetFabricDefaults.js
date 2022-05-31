import { fabric } from 'fabric'
import { customAttributesToIncludeInFabricCanvasToObject } from './consts'
import { CustomImageObject } from './CustomFabricObjects/CustomImageObject'
import { CustomMediaObject } from './CustomFabricObjects/CustomMediaObject'
import { FakeGroup } from './CustomFabricObjects/FakeGroup'
import { BodyTextbox } from './CustomFabricObjects/BodyTextbox'
import { CRect } from './CustomFabricObjects/CRect'
import { LinearGradientControls } from './CustomControls/LinearGradient'
import { EditablePath } from './CustomFabricObjects/EditablePath'

function setFabricDefaults() {
  // All object default settings
  fabric.Object.prototype.set({
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerColor: '#4AB9D1',
    cornerStrokeColor: '#fff',
    borderColor: '#70ABFF',
    lockScalingFlip: true,
    // paintFirst: "stroke",
    includeDefaultValues: false,
    setUserName: "",
    strokeWidth: 0,
  })

  // Custom additions for only the editor

  fabric.Object.prototype.controls = {
    ...fabric.Object.prototype.controls,
    mtr: new fabric.Control({ visible: false })
  }
  fabric.Textbox.prototype.controls = {
    ...fabric.Textbox.prototype.controls,
    mtr: new fabric.Control({ visible: false })
  }

  // Custom run on deselect object to reset editingstate and controls 
  fabric.Object.prototype.onDeselect = function (obj) {
    if (this.editingType === 'fill') {
      this.exitFillEditingMode(false)
    }
    this.resetControls()
  }

  fabric.Object.prototype.resetControls = function () {
    this.hasBorders = fabric.Object.prototype.hasBorders
    this.cornerColor = fabric.Object.prototype.cornerColor
    this.cornerSize = fabric.Object.prototype.cornerSize
    this.controls = fabric.Object.prototype.controls
    return this
  }

  fabric.Object.prototype.handleDeleteKeyPress = function () {
    if (this.editingType === 'fill') {
      alert('delete pressed in fill editing mode')
      return true
    }
    // return true if delete press has been handled and used
    let handledByObjectProto = false
    if (this._handleDeleteKeyPress) {
      handledByObjectProto = this._handleDeleteKeyPress()
    }
    if (handledByObjectProto) return true
    // return false if the object has nothing to apply the delete keypress to
    return false
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
        'visible',
        'rx',
        'ry',
        'strokeWidth'
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

  fabric.Object.prototype.forEachChild = function (callBack) {
    const myStructurePathLength = this.structurePath.length
    let currI = (this?.treeIndex ?? 0) + 1
    while (this.canvas._objects?.[currI] && this.canvas._objects[currI].structurePath.length > myStructurePathLength) {
      const currChildObject = this.canvas._objects[currI]
      callBack(currChildObject)
      currI++
    }
  }

  fabric.Object.prototype.toggleVisibility = function () {
    this.set({ visible: !this.visible })
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

  fabric.Object.prototype.hoveredControl = null
  fabric.Object.hoveringControlKey = false
  fabric.Object.selectedControlKeys = []

  // Monkey patch in a stable cornerHover
  fabric.Object.prototype._findTargetCorner = (function (originFunction) {
    return function (pointer, forTouch) {
      const currentHoveringControlKey = originFunction.call(this, pointer, forTouch)
      this.handleNewControlHoverState.call(this, currentHoveringControlKey)
      return currentHoveringControlKey
    }
  })(fabric.Object.prototype._findTargetCorner)

  fabric.Object.prototype.handleNewControlHoverState = function (newControlHoverState) {
    if (newControlHoverState === this.hoveringControlKey) return
    this.hoveringControlKey = newControlHoverState
    const newlyHoveredControl = this.controls[this.hoveringControlKey]
    if (newlyHoveredControl) {
      this.hoveredControl = newlyHoveredControl
    } else {
      this.hoveredControl = null
    }
    this.canvas.requestRenderAll()
  }
  // CUSTOM CONTROLS AND STATES FOR FILL EDITORS
  addFillEditControls()
  EditablePath()

  FakeGroup()
  CustomImageObject()
  CustomMediaObject()
  BodyTextbox()
  CRect()

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

function addFillEditControls() {
  fabric.Object.prototype.handleChangeFillMode = function ({ location, index = null, newValue }) {
    if (typeof index !== 'number') {
      this[location] = newValue
      return this.enterFillEditingMode({
        location,
        index
      })
    }
  }

  fabric.Object.prototype.enterFillEditingMode = function ({
    location = 'fill',
    index = null
  }) {
    this?.exitCurrentEditingType?.()
    this.activeStopIndex = null
    this.editingType = 'fill'
    this.editingLocation = location
    this.editingIndex = index
    this.activeFillValue = this.getActiveEditingFill()
    if (this.activeFillValue?.type === 'linear') {
      new LinearGradientControls(this)
    } else {
      this.controls = fabric.Object.prototype.controls
    }
    this.canvas?.requestRenderAll()
    return this
  }

  fabric.Object.prototype.exitFillEditingMode = function (render = true) {
    if (!this.editingType) return
    this.activeStopIndex = null
    this.editingType = ''
    delete this.editingLocation
    delete this.editingIndex
    delete this.activeFillValue
    this.controls = fabric.Object.prototype.controls
    if (render) {
      this.canvas?.requestRenderAll()
    }
  }

  fabric.Object.prototype.getActiveEditingFill = function () {
    const { editingIndex, editingLocation } = this
    if (typeof editingIndex !== 'number') {
      return this[editingLocation]
    }
  }

  fabric.Object.prototype.drawControls = (function (originalFn) {
    return function (ctx, styleOverride) {
      if (this.editingType === 'fill') {
        const curr = this.getActiveEditingFill()
        if (curr?.type === 'linear') {
          ctx.save();
          var retinaScaling = this.canvas.getRetinaScaling(), p;
          ctx.setTransform(retinaScaling, 0, 0, retinaScaling, 0, 0);
          this.setCoords()
          const gradStart = fabric.util.transformPoint(
            { x: this.activeFillValue.coords.x1 - (this.width * .5), y: this.activeFillValue.coords.y1 - (this.height * .5) },
            fabric.util.multiplyTransformMatrices(
              this.canvas.viewportTransform,
              this.calcTransformMatrix()
            )
          )
          const gradEnd = fabric.util.transformPoint(
            { x: this.activeFillValue.coords.x2 - (this.width * .5), y: this.activeFillValue.coords.y2 - (this.height * .5) },
            fabric.util.multiplyTransformMatrices(
              this.canvas.viewportTransform,
              this.calcTransformMatrix()
            )
          )
          ctx.beginPath()
          ctx.moveTo(gradStart.x, gradStart.y)
          ctx.lineTo(gradEnd.x, gradEnd.y)
          ctx.closePath()
          ctx.strokeStyle = 'black'
          ctx.lineWidth = 3
          ctx.stroke()
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 1
          ctx.stroke()
          this.forEachControl(function (control, key, fabricObject) {
            if (control.getVisibility(fabricObject, key)) {
              p = fabricObject.oCoords[key];
              control.render(ctx, p.x, p.y, styleOverride, fabricObject);
            }
          });
          ctx.restore();
          return this;
        }
      }
      originalFn.call(this, ctx, styleOverride)
      return this
    }
  })(fabric.Object.prototype.drawControls)
}

export {
  setFabricDefaults
}
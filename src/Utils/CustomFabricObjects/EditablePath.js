import { fabric } from 'fabric'
// import m from 'makerjs'


function EditablePath() {
  fabric.Path.prototype.objectCaching = false

  fabric.Path.prototype.getTotalLength = function () {
    const segmentInfo = fabric.util.getPathSegmentsInfo(this.path)
    const totalLength = segmentInfo[segmentInfo.length - 1].length
    return totalLength
  }

  fabric.Path.prototype._setInPathEditAction = function (isNew = false) {
    this._removeNewPointListener()
    this.controls['newPoint'].visible = false
    this.isInPathEditAction = true
    this.isInPathNewPointAction = isNew
  }
  fabric.Path.prototype.afterManualPathUpdate = function () {
    fabric.Polyline.prototype._setPositionDimensions.call(this, this)
    return this
  }
  fabric.Path.prototype.afterManualPathUpdateComplete = function () {
    this.afterManualPathUpdate()
    this.isInPathEditAction = this.isInPathNewPointAction = false
    this.searchablePath = this._renderPath2DCommands()
    this._renderPath2DChunks()
    this._initNewPointListener()
    return this
  }

  // Point selection
  fabric.Path.prototype.pointSelectionType = false
  fabric.Path.prototype.selectedPointIndexes = {}

  fabric.Path.prototype.handleSetNewPointSelected = function (pointIndex) {
    this.selectedPointIndexes = { [pointIndex]: true }
    this.pointSelectionType = 'single'
    return this.canvas.requestRenderAll()
  }
  fabric.Path.prototype.handleToggleMultiSelectedStateOfPoint = function (pointIndex) {
    if (this.selectedPointIndexes[pointIndex]) delete this.selectedPointIndexes[pointIndex]
    else this.selectedPointIndexes[pointIndex] = true
    const totalSelectedKeys = Object.keys(this.selectedPointIndexes).length
    this.pointSelectionType = totalSelectedKeys === 0 ? false : totalSelectedKeys === 1 ? 'single' : 'multi'
    return this.canvas.requestRenderAll()
  }
  fabric.Path.prototype._handleDeleteKeyPress = function () {
    if (this.editingType !== 'path') return false
    const selectedPointIndexes = Object.keys(this.selectedPointIndexes)
    if (!selectedPointIndexes.length) return false
    // We have selected points and a delete action
    selectedPointIndexes.forEach((deletePointIndexString) => {
      const deletePointIndex = parseInt(deletePointIndexString)
      const pointData = this.path[deletePointIndex]
      if (deletePointIndex === 0) {
        // special case for deleting the first point in the path
        // Todo, move the M command to the next availiable point
      } else {
        this.path.splice(deletePointIndex, 1)
      }
      this.selectedPointIndexes = {}
      this._initPointControls()
      this.afterManualPathUpdateComplete()
      this.canvas.requestRenderAll()
    })
    return true
  }

  fabric.Path.prototype._getCompiledObjectViewOptions = function () {
    var vpt = this.getViewportTransform(), matrix = this.calcTransformMatrix(), options;
    matrix = fabric.util.multiplyTransformMatrices(vpt, matrix);
    return fabric.util.qrDecompose(matrix)
  }

  fabric.Path.prototype._render = function (ctx) {
    this._renderPathCommands(ctx)
    this._renderPaintInOrder(ctx)
    if (this.editingType === 'path') {
      ctx.save()
      const options = this._getCompiledObjectViewOptions()
      ctx.scale(1 / options.scaleX, 1 / options.scaleY)
      ctx.lineWidth = 1
      ctx.strokeStyle = 'red'
      ctx.stroke()
      ctx.restore()
    }
  }

  fabric.Path.prototype._renderPath2DCommands = function () {
    var current, // current instruction
      subpathStartX = 0,
      subpathStartY = 0,
      x = 0, // current x
      y = 0, // current y
      controlX = 0, // current control point x
      controlY = 0, // current control point y
      l = -this.pathOffset.x,
      t = -this.pathOffset.y;
    const path = new Path2D()

    for (var i = 0, len = this.path.length; i < len; ++i) {

      current = this.path[i];

      switch (current[0]) { // first letter

        case 'L': // lineto, absolute
          x = current[1];
          y = current[2];
          path.lineTo(x + l, y + t);
          break;

        case 'M': // moveTo, absolute
          x = current[1];
          y = current[2];
          subpathStartX = x;
          subpathStartY = y;
          path.moveTo(x + l, y + t);
          break;

        case 'C': // bezierCurveTo, absolute
          x = current[5];
          y = current[6];
          controlX = current[3];
          controlY = current[4];
          path.bezierCurveTo(
            current[1] + l,
            current[2] + t,
            controlX + l,
            controlY + t,
            x + l,
            y + t
          );
          break;

        case 'Q': // quadraticCurveTo, absolute
          path.quadraticCurveTo(
            current[1] + l,
            current[2] + t,
            current[3] + l,
            current[4] + t
          );
          x = current[3];
          y = current[4];
          controlX = current[1];
          controlY = current[2];
          break;

        case 'z':
        case 'Z':
          x = subpathStartX;
          y = subpathStartY;
          path.closePath();
          break;
      }
    }
    return path
  }

  fabric.Path.prototype._renderPath2DChunks = function () {
    this.path2DChunks = []
    var current, // current instruction
      subpathStartX = 0,
      subpathStartY = 0,
      x = 0, // current x
      y = 0, // current y
      controlX = 0, // current control point x
      controlY = 0, // current control point y
      l = -this.pathOffset.x,
      t = -this.pathOffset.y;

    for (var i = 0, len = this.path.length; i < len; ++i) {

      current = this.path[i];
      let currentChunk = new Path2D()
      currentChunk.moveTo(x + l, y + t)

      switch (current[0]) { // first letter

        case 'L': // lineto, absolute
          x = current[1];
          y = current[2];
          currentChunk.lineTo(x + l, y + t);
          break;

        case 'M': // moveTo, absolute
          x = current[1];
          y = current[2];
          subpathStartX = x;
          subpathStartY = y;
          // Nothing rendered because a move to only renders a line if a z/Z is before it
          // currentChunk.moveTo(x + l, y + t);
          break;

        case 'C': // bezierCurveTo, absolute
          x = current[5];
          y = current[6];
          controlX = current[3];
          controlY = current[4];
          currentChunk.bezierCurveTo(
            current[1] + l,
            current[2] + t,
            controlX + l,
            controlY + t,
            x + l,
            y + t
          );
          break;

        case 'Q': // quadraticCurveTo, absolute
          currentChunk.quadraticCurveTo(
            current[1] + l,
            current[2] + t,
            current[3] + l,
            current[4] + t
          );
          x = current[3];
          y = current[4];
          controlX = current[1];
          controlY = current[2];
          break;

        case 'z':
        case 'Z':
          x = subpathStartX;
          y = subpathStartY;
          // Fake a close path for the sake of being able to add new points before the z
          currentChunk.lineTo(x + l, y + t)
          // path.closePath();
          break;
      }
      this.path2DChunks.push(currentChunk)
    }
  }

  fabric.Path.prototype.enterPathEditingMode = function () {
    if (this?.exitCurrentEditingType) this.exitCurrentEditingType()
    this.exitCurrentEditingType = this._onExitPathEditingMode
    // state for the path editor
    this.editingType = 'path'
    this.isNewPointListenerActive = false // Will be true instantly
    this.newPointCoords = { x: 0, y: 0, i: 0 } // Will be filled by the newPointListener when the mouse is on the stroke
    this.isInPathEditAction = false
    this.isInPathNewPointAction = false // True from mouseDown on the newPoint Control
    // Selection state
    this.selectedPointIndexes = {}

    // Update some fabric vars to make the editor look nicer
    this.objectCaching = false
    this.hasBorders = false
    this.cornerColor = 'rgba(50, 150, 255, 1)'
    this.cornerSize = 12
    this._initPointControls()

    // Prep the hover search for adding a new point
    this.searchablePath = this._renderPath2DCommands()
    this._renderPath2DChunks()
    this._initNewPointListener()
  }

  fabric.Path.prototype.exitPathEditingMode = function () {
    this._onExitPathEditingMode()
    this.resetControls()
    return this
  }

  fabric.Path.prototype._onExitPathEditingMode = function () {
    delete this.editingType
    this._removeNewPointListener()
  }

  fabric.Path.prototype.onDeselect = function () {
    if (this.editingType === 'path') this._onExitPathEditingMode()
    return this.callSuper('onDeselect')
  }

  fabric.Path.prototype._initPointControls = function () {
    this.controls = {
      'newPoint': this.controls['newPoint'] ?? new fabric.Control({
        visible: false,
        cursorStyle: 'copy',
        getVisibility(o, controlKey) {
          if (o.__corner && o.__corner !== 'newPoint') return false
          return this.visible
        },
        mouseDownHandler(eventData, transformData, x, y) { // Add a new point to the path where we clicked
          const o = transformData.target,
            local = getLocalPointFromTransform(transformData, x, y);
          o._setInPathEditAction(true)
          const pBefore = o.path[o.newPointCoords.i - 1]
          const pAfter = o.path[o.newPointCoords.i]

          if (pBefore[0] === 'L' && pAfter[0] === 'L') {

          }
          /* 
            Ok so options are
            Between 2 solid points we add a quadratic and make the one after a qaudratic
            [m | L] ---x--- [L | Z] => [(m)][q] -- [q]

            [l] x[l]
            [q] x[l]
            [q] x[b]
          */
          o.path.splice(o.newPointCoords.i, 0, ['L', local.x, local.y])
          o._initPointControls()
          o.handleSetNewPointSelected(o.newPointCoords.i)
          o.canvas.requestRenderAll()
        },
        actionHandler: anchorWrapper(0,
          function (eventData, transformData, x, y) {
            const o = transformData.target,
              local = getLocalPointFromTransform(transformData, x, y);
            o.path[o.newPointCoords.i][1] = local.x
            o.path[o.newPointCoords.i][2] = local.y
            o.afterManualPathUpdate()
            return true;
          }
        ),
        mouseUpHandler(eventData, transformData, x, y) {
          const o = transformData.target
          o.afterManualPathUpdateComplete()
        },
        positionHandler(dim, finalMatrix, o) {
          if (o.isInPathNewPointAction) {
            return fabric.util.transformPoint(
              { x: (o.path[o.newPointCoords.i][1] - o.pathOffset.x), y: (o.path[o.newPointCoords.i][2] - o.pathOffset.y) },
              fabric.util.multiplyTransformMatrices(o.canvas.viewportTransform, o.calcTransformMatrix())
            )
          }
          return fabric.util.transformPoint(
            { x: o.newPointCoords.x - o.pathOffset.x, y: o.newPointCoords.y - o.pathOffset.y },
            o.calcTransformMatrix()
          )
        },
        render(ctx, left, top, styleObj, fabricObject) {
          fabric.controlsUtils.renderCircleControl.call(this, ctx, left, top, { cornerSize: 10, cornerColor: '#fff', cornerStrokeColor: '#000' }, fabricObject)
        }
      })
    }

    this.path.forEach((pathVal, pointIndex) => {
      const type = pathVal[0]
      const useAnchorIndex = pointIndex > 0 ? pointIndex - 1
        : this.path[this.path.length - 1][0].toLowerCase() === 'z' ? this.path.length - 2 : this.path.length - 1

      if (type === 'M') {
        getPointControl.call(this, pointIndex, 1, useAnchorIndex)
      } else if (type === 'L') {
        getPointControl.call(this, pointIndex, 1, useAnchorIndex)
      } else if (type === 'C') {
        getPointControl.call(this, pointIndex, 5, useAnchorIndex)
        getCurveHandleControl.call(this, pointIndex, 1, useAnchorIndex, pointIndex - 1)
        getCurveHandleControl.call(this, pointIndex, 3, useAnchorIndex, pointIndex)

      } else if (type === 'Q') {
        getPointControl.call(this, pointIndex, 3, useAnchorIndex)
        getCurveHandleControl.call(this, pointIndex, 1, useAnchorIndex, pointIndex - 1)

      }
    })

    return this
  }

  fabric.Path.prototype._handleAddPointToPath = function () {

  }

  // Idle new point listener
  fabric.Path.prototype._initNewPointListener = function () {
    if (this.isNewPointListenerActive) return
    this.isNewPointListenerActive = true
    this.boundNewPointListener = this.boundNewPointListener ?? this.onNewPointListenerMove.bind(this)
    this.canvas.on('mouse:move', this.boundNewPointListener)
  }
  fabric.Path.prototype._removeNewPointListener = function () {
    this?.canvas?.contextTop?.restore?.()
    this?.canvas?.off?.('mouse:move', this.boundNewPointListener)
    this.isNewPointListenerActive = false
  }
  fabric.Path.prototype.onNewPointListenerMove = function ({ e }) {
    // Set up the object transform on the topCanvas to check against
    const tctx = this.canvas.contextTop
    tctx.save()
    var v = this.canvas.viewportTransform
    tctx.transform(v[0], v[1], v[2], v[3], v[4], v[5])
    this.transform(tctx)
    const options = this._getCompiledObjectViewOptions()
    let useActivePoint = false
    const baseCheckSize = 10
    const baseX = e.offsetX * this.canvas.getRetinaScaling()
    const baseY = e.offsetY * this.canvas.getRetinaScaling()

    tctx.lineWidth = baseCheckSize / options.scaleX
    if (tctx.isPointInStroke(this.searchablePath, baseX, baseY)) { // We're within 10 of the whole path, check which chunk
      for (let i = 0; i < this.path.length; i++) {
        if (!tctx.isPointInStroke(this.path2DChunks[i], baseX, baseY)) continue;
        // We are within 10 of this chunk
        tctx.lineWidth = 1 / options.scaleX
        if (tctx.isPointInStroke(this.path2DChunks[i], baseX, baseY)) {
          useActivePoint = { x: baseX, y: baseY, i }; break;
        } else { // Find nearest pixel point collision
          for (let dI = 1; dI < baseCheckSize; dI++) { // distanceIndex
            for (let vx = 0; vx < 3; vx++) { // vectorX
              let x = vx < 1 ? baseX - dI : vx > 1 ? baseX + dI : baseX
              for (let vy = 0; vy < 3; vy++) { // vectorY
                let y = vy < 1 ? baseY - dI : vy > 1 ? baseY + dI : baseY
                if (tctx.isPointInStroke(this.path2DChunks[i], x, y)) {
                  useActivePoint = { x, y, i }; break;
                }
              }
              if (useActivePoint) break;
            }
            if (useActivePoint) break;
          }
        }
      }
    }
    if (useActivePoint) {
      const useNewRelativeActivePoint = new fabric.Point(useActivePoint.x / this.canvas.getRetinaScaling(), useActivePoint.y / this.canvas.getRetinaScaling())
      const localPosition = this.toLocalPoint(useNewRelativeActivePoint, 'center', 'center')
      const polygonBaseSize = getObjectSizeWithStroke(this)
      const size = this._getTransformedDimensions(0, 0)
      this.newPointCoords = {
        x: localPosition.x * polygonBaseSize.x / size.x + this.pathOffset.x,
        y: localPosition.y * polygonBaseSize.y / size.y + this.pathOffset.y,
        i: useActivePoint.i
      }
      this.controls['newPoint'].visible = true
      this.canvas.requestRenderAll()
    } else {
      if (this.controls['newPoint'].visible) {
        this.controls['newPoint'].visible = false
        this.canvas.requestRenderAll()
      }
    }
    tctx.restore()
  }
}

// POINT CONTROLS
function getPointControl(pointIndex, pointValueIndex) {
  this.controls[`p${pointIndex}`] = new fabric.Control({
    deps: [],
    updateByVector(o, vector, updatePoint, updateDeps) {
      if (updatePoint) {
        o.path[this.pointIndex][this.pointValueIndex] -= vector[0]
        o.path[this.pointIndex][this.pointValueIndex + 1] -= vector[1]
      }
      if (updateDeps && this.deps.length) {
        this.deps.forEach(([targetPointIndex, targetPointValueIndex]) => {
          o.path[targetPointIndex][targetPointValueIndex] -= vector[0]
          o.path[targetPointIndex][targetPointValueIndex + 1] -= vector[1]
        })
      }
    },
    pointIndex,
    pointValueIndex: pointValueIndex,
    positionHandler: pointPositionHandler,
    getActionHandler(eventData, o, control) {
      let useAnchorIndex = null
      for (let i = 0; i < o.path.length; i++) {
        if (i !== pointIndex && !o.selectedPointIndexes[i] && o.path[i][0].toLowerCase() !== 'z') {
          useAnchorIndex = i
          break
        }
      }
      if (useAnchorIndex === null) {
        return fabric.controlsUtils.dragHandler
      } else {
        return anchorWrapper(useAnchorIndex, simplePointActionHandler)
      }
    },
    // actionHandler: anchorWrapper(useAnchorIndex, simplePointActionHandler),
    render: getRenderPointFunction(pointIndex),
    mouseDownHandler: getMouseDownHandler(pointIndex, pointValueIndex),
    mouseUpHandler: getPointMouseUpHandler(pointIndex, pointValueIndex)
  })
}
const pointStyleOverrides = {
  'default': {
    cornerColor: 'white',
    cornerStrokeColor: 'rgba(0, 0, 0, 1)',
    cornerSize: 10
  },
  'idle': {
    cornerColor: 'rgba(255, 255, 255, 0.5)',
    cornerStrokeColor: 'rgba(0, 0, 0, 0.75)',
    cornerSize: 8
  },
  'hovered': {
    cornerColor: 'white',
    cornerStrokeColor: '#3861F6',
    cornerSize: 10
  },
  'active': {
    cornerColor: '#3861F6',
    cornerStrokeColor: 'white',
    cornerSize: 12
  }
}
function getRenderPointFunction(pointIndex) {
  return function (ctx, left, top, styleOverride, fabricObject) {
    const isPointSelected = fabricObject.selectedPointIndexes[pointIndex]
    const isAPointHovered = fabricObject.hoveredControl !== null
    const isPointHovered = isAPointHovered && fabricObject.hoveredControl?.pointIndex === pointIndex

    const state = isPointSelected ? 'active'
      : isPointHovered ? 'hovered'
        : isAPointHovered ? 'idle'
          : 'default'

    const styleObj = pointStyleOverrides[state]
    fabric.controlsUtils.renderCircleControl.call(this, ctx, left, top, styleObj, fabricObject);
  }
}

// CURVE HANDLE CONTROLS
const handleColor = `#FFF`
const handleStyleOverrides = {
  'default': {
    handleLineColor: handleColor,
    cornerColor: handleColor,
    cornerSize: 10,
    cornerStrokeColor: 'black'
  },
  'idle': {
    handleLineColor: handleColor,
    cornerColor: handleColor,
    cornerSize: 10,
    cornerStrokeColor: 'black',
  },
  'active': {
    handleLineColor: handleColor,
    cornerColor: handleColor,
    cornerSize: 10,
    cornerStrokeColor: 'black'
  }
}
function getCurveHandleControl(pointIndex, pointValueIndex, useAnchorIndex, handleAttachIndex) {
  // Tell the control for the point that this handle is attached to that it has a child
  this.controls[`p${handleAttachIndex}`].deps.push([pointIndex, pointValueIndex])
  this.controls[`p${pointIndex}h${handleAttachIndex}`] = new fabric.Control({
    pointIndex,
    pointValueIndex,
    handleAttachIndex,
    positionHandler: pointPositionHandler,
    actionHandler: anchorWrapper(useAnchorIndex, simpleHandleActionHandler),
    render: function (ctx, left, top, styleOverride, fabricObject) {
      const isPointSelected = fabricObject.selectedPointIndexes[handleAttachIndex]
      if (!isPointSelected) return
      const styleObj = handleStyleOverrides['default']
      const handleAnchorPoint = fabricObject.oCoords[`p${handleAttachIndex}`]
      ctx.beginPath()
      ctx.moveTo(left, top)
      ctx.lineTo(handleAnchorPoint.x, handleAnchorPoint.y)
      ctx.closePath()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.strokeStyle = styleObj.handleLineColor
      ctx.lineWidth = 1
      ctx.stroke()
      fabric.controlsUtils.renderCircleControl.call(this, ctx, left, top, styleObj, fabricObject);
    },
    // mouseDownHandler: getMouseDownHandler(pointIndex, pointValueIndex),
    // mouseUpHandler: getPointMouseUpHandler(pointIndex, pointValueIndex)
  })
}

function getMouseDownHandler(pointIndex, pointValueIndex) {
  return function (eventData, transformData, x, y) {
    const o = transformData.target
    const pointAlreadySelected = o.selectedPointIndexes[pointIndex]
    const shift = eventData.shiftKey
    const isMulti = o.pointSelectionType === 'multi'
    if (shift) return o.handleToggleMultiSelectedStateOfPoint(pointIndex)
    if (isMulti && pointAlreadySelected) { // could be a move multi start so we shouldn't run selection changes yet
      o.activeUnHandledMouseDown = true
    }
    else o.handleSetNewPointSelected(pointIndex)
  }
}

function getPointMouseUpHandler(pointIndex, pointValueIndex) {
  return function (eventData, transformData, x, y) {
    const o = transformData.target
    if (o.isInPathEditAction) return o.afterManualPathUpdateComplete()
    // Mouse up after no action
    if (o.activeUnHandledMouseDown) {
      o.activeUnHandledMouseDown = false
      if (eventData.shiftKey) o.handleToggleMultiSelectedStateOfPoint(pointIndex)
      else o.handleSetNewPointSelected(pointIndex)
    }
  }
}

// Used by all points
function pointPositionHandler(dim, finalMatrix, fabricObject) {
  var x = (fabricObject.path[this.pointIndex][this.pointValueIndex] - fabricObject.pathOffset.x),
    y = (fabricObject.path[this.pointIndex][this.pointValueIndex + 1] - fabricObject.pathOffset.y);
  return fabric.util.transformPoint(
    { x: x, y: y },
    fabric.util.multiplyTransformMatrices(
      fabricObject.canvas.viewportTransform,
      fabricObject.calcTransformMatrix()
    )
  );
}

// Used by all points
function anchorWrapper(anchorIndex, fn) {
  return function (eventData, transform, x, y) {
    const o = transform.target
    const pointValueIndex = o.path[anchorIndex].length - 2
    const absolutePoint = fabric.util.transformPoint({
      x: (o.path[anchorIndex][pointValueIndex] - o.pathOffset.x),
      y: (o.path[anchorIndex][pointValueIndex + 1] - o.pathOffset.y),
    }, o.calcTransformMatrix())

    const actionPerformed = fn(eventData, transform, x, y),
      polygonBaseSize = getObjectSizeWithStroke(o),
      newX = (o.path[anchorIndex][pointValueIndex] - o.pathOffset.x) / polygonBaseSize.x,
      newY = (o.path[anchorIndex][pointValueIndex + 1] - o.pathOffset.y) / polygonBaseSize.y;

    o.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
    return actionPerformed;
  }
}

// Used by all points
function simplePointActionHandler(eventData, transform, x, y) {
  const o = transform.target
  const isMulti = o.pointSelectionType === 'multi'
  const cc = o.controls[o.__corner] // currentControl
  const local = getLocalPointFromTransform(transform, x, y)
  const vector = [o.path[cc.pointIndex][cc.pointValueIndex] - local.x, o.path[cc.pointIndex][cc.pointValueIndex + 1] - local.y]
  o._setInPathEditAction(false) // Tell the pathObject it's being updated

  if (isMulti) {
    Object.keys(o.selectedPointIndexes)
      .forEach(pi => o.controls[`p${pi}`].updateByVector(o, vector, true, true))
  } else if (eventData.altKey) {
    cc.updateByVector(o, vector, true, false)
  } else {
    cc.updateByVector(o, vector, true, true)
  }
  o.afterManualPathUpdate()
  return true;
}

function simpleHandleActionHandler(eventData, transform, x, y) {
  console.log('simpleHandleActionHandler')
  const o = transform.target
  const cc = o.controls[o.__corner] // currentControl
  const local = getLocalPointFromTransform(transform, x, y)
  // const vector = [o.path[cc.pointIndex][cc.pointValueIndex] - local.x, o.path[cc.pointIndex][cc.pointValueIndex + 1] - local.y]
  o.path[cc.pointIndex][cc.pointValueIndex] = local.x // Update the current point
  o.path[cc.pointIndex][cc.pointValueIndex + 1] = local.y // Update the current point
  o.afterManualPathUpdate()
  return true
}

function getLocalPointFromTransform(transform, x, y) {
  var o = transform.target,
    mouseLocalPosition = o.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
    polygonBaseSize = getObjectSizeWithStroke(o),
    size = o._getTransformedDimensions(0, 0);
  return {
    x: mouseLocalPosition.x * polygonBaseSize.x / size.x + o.pathOffset.x,
    y: mouseLocalPosition.y * polygonBaseSize.y / size.y + o.pathOffset.y
  }
}

function getObjectSizeWithStroke(object) {
  var stroke = new fabric.Point(
    object.strokeUniform ? 1 / object.scaleX : 1,
    object.strokeUniform ? 1 / object.scaleY : 1
  ).multiply(object.strokeWidth);
  return new fabric.Point(object.width + stroke.x, object.height + stroke.y);
}

export {
  EditablePath
}

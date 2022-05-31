import { CustomFabricObject } from "../../Types/CustomFabricTypes"
import { fabric } from 'fabric'

const stopControlSize = {
  sizeX: 18,
  sizeY: 18,
  touchSizeX: 18,
  touchSizeY: 18
}
const selectedStopColor = '#2389ff'

class CustomControl extends fabric.Control {
}

class LinearGradientControls {
  // fabricObject: CustomFabricObject
  /**
   * @param {CustomFabricObject} fabricObject 
  //  * @param {string} location 
   */
  constructor(
    fabricObject, /* : CustomFabricObject */
    // location
  ) {
    this.fabricObject = fabricObject
    // this.location = location
    this.fabricObject.linearGradientControls = this
    this.initControls()
  }
  /**
   * @this CustomFabricObject
   * @returns 
   */
  initControls(/*this : CustomFabricObject */) {
    this.fabricObject.isFillEditing = true
    this.fabricObject.activeStopIndex = this.fabricObject?.activeStopIndex ?? 0
    return this.createControlsFromScratch()
  }
  createControlsFromScratch() {
    const fabricObject = this.fabricObject
    fabricObject.controls = {}
    // First add controls which represent the gradient control
    // These just sit underneath the interactive controls
    fabricObject.controls['bg1'] = new fabric.Control({
      key: 'bg1',
      ...stopControlSize,
      render: renderGradLineHandle,
      positionHandler: getLinearEndPointPositionController(1)
    })
    fabricObject.controls['bg2'] = new fabric.Control({
      key: 'bg2',
      ...stopControlSize,
      render: renderGradLineHandle,
      positionHandler: getLinearEndPointPositionController(2)
    })

    // Create individual controls for each stop
    fabricObject.activeFillValue.colorStops
      .forEach((stopObject, stopIndex) => {
        fabricObject.controls[`stop:${stopIndex}`] = this.createControlForStop(stopObject, stopIndex)
      })

    // the invisible grab handles for moving the gradient
    // are added last so they remain above everything for target finding
    fabricObject.controls['grab1'] = new fabric.Control({
      key: 'grab1',
      ...stopControlSize,
      // render: renderGradLineHandle,
      render: () => null,
      positionHandler: getLinearEndPointPositionController(1),
      actionHandler: getLinearEndPointActionHandler(1),
      mouseDownHandler(eventData, transformData, x, y) {
        const fabricObject = transformData.target
        const { index: firstIndex } = fabricObject.activeFillValue.colorStops
          .reduce((acc, curr, i) => {
            if (curr.offset < acc.offset) return { offset: curr.offset, index: i }
            return acc
          }, { offset: 1, index: null })
        fabricObject.activeStopIndex = firstIndex
        fabricObject.canvas.requestRenderAll()
      }
    })
    fabricObject.controls['grab2'] = new fabric.Control({
      key: 'grab2',
      ...stopControlSize,
      // render: renderGradLineHandle,
      render: () => null,
      positionHandler: getLinearEndPointPositionController(2),
      actionHandler: getLinearEndPointActionHandler(2),
      mouseDownHandler(eventData, transformData, x, y) {
        const fabricObject = transformData.target
        const { index: lastIndex } = fabricObject.activeFillValue.colorStops
          .reduce((acc, curr, i) => {
            if (curr.offset > acc.offset) return { offset: curr.offset, index: i }
            return acc
          }, { offset: 0, index: null })
        fabricObject.activeStopIndex = lastIndex
        fabricObject.canvas.requestRenderAll()
        console.log('mouseDown on grab2', { lastIndex })
      }
    })
    fabricObject.canvas.requestRenderAll()
    return this
  }
  createControlForStop(stopObject, stopIndex) {
    return new fabric.Control({
      stopIndex,
      ...stopControlSize,
      positionHandler(dim, finalMatrix, fabricObject) {
        const c = fabricObject.activeFillValue.coords
        const xDist = c.x2 - c.x1
        const yDist = c.y2 - c.y1
        const stopOffset = fabricObject.activeFillValue.colorStops[this.stopIndex].offset
        const point = new fabric.Point(
          c.x1 + (xDist * stopOffset) - fabricObject.width / 2,
          c.y1 + (yDist * stopOffset) - fabricObject.height / 2
        )
        return fabric.util.transformPoint(point,
          fabric.util.multiplyTransformMatrices(
            fabricObject.canvas.viewportTransform,
            fabricObject.calcTransformMatrix()
          ))
      },
      render(ctx, left, top, styleOverride, fabricObject) {
        const stop = fabricObject.activeFillValue.colorStops[this.stopIndex]
        const stopColor = stop.color
        const isSelected = fabricObject.activeStopIndex === this.stopIndex
        // console.log({ stopColor })
        styleOverride = styleOverride || {};
        var xSize = this.sizeX || styleOverride.cornerSize || fabricObject.cornerSize,
          ySize = this.sizeY || styleOverride.cornerSize || fabricObject.cornerSize,
          transparentCorners = typeof styleOverride.transparentCorners !== 'undefined' ?
            styleOverride.transparentCorners : fabricObject.transparentCorners,
          methodName = transparentCorners ? 'stroke' : 'fill',
          stroke = !transparentCorners && (styleOverride.cornerStrokeColor || fabricObject.cornerStrokeColor),
          myLeft = left,
          myTop = top, size;
        ctx.save();
        ctx.fillStyle = stopColor || styleOverride.cornerColor || fabricObject.cornerColor;
        ctx.strokeStyle = isSelected ? selectedStopColor : (styleOverride.cornerStrokeColor || fabricObject.cornerStrokeColor);
        size = xSize;

        // Fill the stop color
        ctx.beginPath();
        ctx.arc(myLeft, myTop, size / 2, 0, 2 * Math.PI, false);
        ctx.fill();

        // Thick outter line
        ctx.lineWidth = 4;
        ctx.strokeStyle = isSelected ? selectedStopColor : 'black'
        ctx.stroke();

        // Thin inner line
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white'
        ctx.stroke();
        // if (stroke) {
        //   ctx.stroke();
        // }
        ctx.restore();
      },
      actionHandler(eventData, transform, x, y) {
        var o = transform.target,
          mouseLocalPosition = o.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
          polygonBaseSize = getObjectSizeWithStroke(o),
          size = o._getTransformedDimensions(0, 0);
        const newX = mouseLocalPosition.x * polygonBaseSize.x / size.x + (o.width / 2)
        const newY = mouseLocalPosition.y * polygonBaseSize.y / size.y + (o.height / 2)
        const localPoint = new fabric.Point(newX, newY)
        const c = o.activeFillValue.coords
        const nearestPoint = calcNearestPointOnLine(
          { x: c.x1, y: c.y1 },
          { x: c.x2, y: c.y2 },
          localPoint
        )
        const mappedToOffset = clamp(0, 1, mapRange(c.x1, c.x2, 0, 1, nearestPoint.x))
        o.activeFillValue.colorStops[stopIndex].offset = mappedToOffset
        o.dirty = true
        o.canvas.requestRenderAll()
      },
      mouseDownHandler: function (eventData, transformData, x, y) {
        const fabricObject = transformData.target
        fabricObject.activeStopIndex = stopIndex
        fabricObject.canvas.requestRenderAll()
        // console.log(`mouseDownHandler ${stopIndex}`)
      },
    })
  }
}

export {
  LinearGradientControls
}

function getLinearEndPointPositionController(pointIndex) {
  return function (dim, finalMatrix, fabricObject) {
    const x = (fabricObject.activeFillValue.coords[`x${pointIndex}`]) - fabricObject.width / 2
    const y = (fabricObject.activeFillValue.coords[`y${pointIndex}`]) - fabricObject.height / 2
    return fabric.util.transformPoint(
      { x: x, y: y },
      fabric.util.multiplyTransformMatrices(
        fabricObject.canvas.viewportTransform,
        fabricObject.calcTransformMatrix()
      )
    );
  }
}

/* function getLinearEndPointActionHandler(pointIndex) {
  return function (eventData, transform, x, y) {
    const localPoint = fabric.controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y)
    const fabricObject = transform.target
    fabricObject.activeFillValue.coords[`x${pointIndex}`] = localPoint.x
    fabricObject.activeFillValue.coords[`y${pointIndex}`] = localPoint.y
    fabricObject.dirty = true
    fabricObject.canvas?.requestRenderAll()
  }
} */
function getLinearEndPointActionHandler(pointIndex) {
  return function (eventData, transform, x, y) {
    var o = transform.target,
      mouseLocalPosition = o.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
      polygonBaseSize = getObjectSizeWithStroke(o),
      size = o._getTransformedDimensions(0, 0);
    const newX = mouseLocalPosition.x * polygonBaseSize.x / size.x + (o.width / 2)
    const newY = mouseLocalPosition.y * polygonBaseSize.y / size.y + (o.height / 2)
    o.activeFillValue.coords[`x${pointIndex}`] = newX
    o.activeFillValue.coords[`y${pointIndex}`] = newY
    o.dirty = true
    o.canvas?.requestRenderAll()
  }
}

function getObjectSizeWithStroke(object) {
  var stroke = new fabric.Point(
    object.strokeUniform ? 1 / object.scaleX : 1,
    object.strokeUniform ? 1 / object.scaleY : 1
  ).multiply(object.strokeWidth);
  return new fabric.Point(object.width + stroke.x, object.height + stroke.y);
}

function renderGradLineHandle(ctx, left, top, styleOverride, fabricObject) {
  var xSize = this.sizeX,
    ySize = this.sizeY,
    transparentCorners = typeof styleOverride.transparentCorners !== 'undefined' ?
      styleOverride.transparentCorners : fabricObject.transparentCorners,
    methodName = transparentCorners ? 'stroke' : 'fill',
    stroke = !transparentCorners && (styleOverride.cornerStrokeColor || fabricObject.cornerStrokeColor),
    myLeft = left,
    myTop = top, size = xSize;
  ctx.save();
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'black'
  // this is still wrong
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(myLeft, myTop, size / 2, 0, 2 * Math.PI, false);
  ctx[methodName]();
  if (stroke) {
    ctx.stroke();
  }
  ctx.restore();
}

function calcNearestPointOnLine(line1, line2, pnt) {
  var L2 = (((line2.x - line1.x) * (line2.x - line1.x)) + ((line2.y - line1.y) * (line2.y - line1.y)));
  if (L2 == 0) return false;
  var r = (((pnt.x - line1.x) * (line2.x - line1.x)) + ((pnt.y - line1.y) * (line2.y - line1.y))) / L2;

  return {
    x: line1.x + (r * (line2.x - line1.x)),
    y: line1.y + (r * (line2.y - line1.y))
  };
}

function mapRange(in_min, in_max, out_min, out_max, value) {
  let val = (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  if (val < out_min) val = out_min;
  else if (val > out_max) val = out_max;
  return val;
}

const clamp = (min, max, num) => Math.min(Math.max(num, min), max);

import gsap from "gsap/all"
import { createContext } from "react"
import { LinearGradientControls } from "../CustomControls/LinearGradient"

function CRect() {
  if (fabric.CRect) return
  fabric.CRect = fabric.util.createClass(fabric.Rect, {
    type: 'CRect',
    initialize(options) {
      this.callSuper('initialize', options)
      this.objectCaching = false
      this.noScaleCache = false
    },
    _findTargetCorner: function (pointer, forTouch) {
      if (!this.hasControls || (!this.canvas || this.canvas._activeObject !== this)) {
        return false;
      }
      var xPoints,
        lines, keys = Object.keys(this.oCoords),
        j = keys.length - 1, i;
      this.__corner = 0;
      let foundCornerKeys = []
      // cycle in reverse order so we pick first the one on top
      for (; j >= 0; j--) {
        i = keys[j];
        if (!this.isControlVisible(i)) {
          continue;
        }

        lines = this._getImageLines(forTouch ? this.oCoords[i].touchCorner : this.oCoords[i].corner);
        xPoints = this._findCrossPoints(pointer, lines);
        if (xPoints !== 0 && xPoints % 2 === 1) {
          foundCornerKeys.push(i)
          // console.log('foundCorder ', i)
          // this.__corner = i;
          // return i;
        }
      }
      console.log(foundCornerKeys)
      if (foundCornerKeys.length) {
        this.__corner = foundCornerKeys[0];
        return foundCornerKeys[0]
      }
      return false;
    },
    /**
     * Draws corners of an object's bounding box.
     * Requires public properties: width, height
     * Requires public options: cornerSize, padding
     * @param {CanvasRenderingContext2D} ctx Context t``o draw on
     * @param {Object} styleOverride object to override the object style
     * @return {fabric.Object} thisArg
     * @chainable
     */
    drawControls: function (ctx, styleOverride) {
      styleOverride = styleOverride || {};
      ctx.save();
      var retinaScaling = this.canvas.getRetinaScaling(), p;
      ctx.setTransform(retinaScaling, 0, 0, retinaScaling, 0, 0);
      ctx.strokeStyle = ctx.fillStyle = styleOverride.cornerColor || this.cornerColor;
      if (!this.transparentCorners) {
        ctx.strokeStyle = styleOverride.cornerStrokeColor || this.cornerStrokeColor;
      }
      this._setLineDash(ctx, styleOverride.cornerDashArray || this.cornerDashArray);
      this.setCoords();
      if (this.isFillEditing) {
        // Render a bg for the gradient editor line
        const gradStart = fabric.util.transformPoint(
          { x: this.fill.coords.x1 - (this.width * .5), y: this.fill.coords.y1 - (this.height * .5) },
          fabric.util.multiplyTransformMatrices(
            this.canvas.viewportTransform,
            this.calcTransformMatrix()
          )
        )
        const gradEnd = fabric.util.transformPoint(
          { x: this.fill.coords.x2 - (this.width * .5), y: this.fill.coords.y2 - (this.height * .5) },
          fabric.util.multiplyTransformMatrices(
            this.canvas.viewportTransform,
            this.calcTransformMatrix()
          )
        )
        ctx.moveTo(gradStart.x, gradStart.y)
        ctx.lineTo(gradEnd.x, gradEnd.y)
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 4
        ctx.stroke()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      this.forEachControl(function (control, key, fabricObject) {
        if (control.getVisibility(fabricObject, key)) {
          p = fabricObject.oCoords[key];
          control.render(ctx, p.x, p.y, styleOverride, fabricObject);
        }
      });
      ctx.restore();
      return this;
    },
    onDeselect: function (obj) {
      this.isFillEditing = false
      this.controls = fabric.Object.prototype.controls
    },
    enterGradientEdit() {
      new LinearGradientControls(this)
    },
  })

  fabric.CRect.fromObject = function (object, callback) {
    const obj = fabric.Object._fromObject('CRect', object, callback);
    return obj
  }
}



export {
  CRect
}
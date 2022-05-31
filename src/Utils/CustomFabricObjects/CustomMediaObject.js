import { faB } from '@fortawesome/free-solid-svg-icons'
import { fabric } from 'fabric'

function CustomMediaObject() {
  if (fabric.CustomMediaObject) return
  fabric.CustomMediaObject = fabric.util.createClass(fabric.Rect, {
    type: 'CustomMediaObject',
    objectCaching: false,
    initialize(element, options) {
      this._element = element
      this.callSuper('initialize', {
        ...options,
        fill: null
      })
      this.patternFill = new fabric.Pattern({
        source: element,
        patternTransform: this.getCenteredPatternTransform(),
        repeat: 'no-repeat',
      })
      this.set({ fill: this.patternFill })
    },
    getCenteredPatternTransform() {
      const widthScale = this.width / this._element.naturalWidth
      const heightScale = this.height / this._element.naturalHeight
      const scale = Math.max(widthScale, heightScale)
      const newScaledElWidth = this._element.naturalWidth * scale
      const newScaledElHeight = this._element.naturalHeight * scale
      const overFlowX = -(newScaledElWidth - this.width) / 2
      const overFlowY = -(newScaledElHeight - this.height) / 2
      return [scale, 0, 0, scale, overFlowX, overFlowY]
    },
    _render(ctx) {
      this.patternFill.patternTransform = this.getCenteredPatternTransform()
      this.callSuper('_render', ctx)
    },
    getSrc() {
      return this._element.src;
    },
    toObject: function (propertiesToInclude) {
      const objectRep = {
        ...this.callSuper('toObject', propertiesToInclude),
        src: this.getSrc(),
        crossOrigin: 'Anonymous'
      }
      return objectRep
    },
    controls: { ...fabric.Rect.prototype.controls },
    resetControls: function () {
      this.hasBorders = fabric.CustomMediaObject.prototype.hasBorders
      this.cornerColor = fabric.CustomMediaObject.prototype.cornerColor
      this.cornerSize = fabric.CustomMediaObject.prototype.cornerSize
      this.controls = fabric.CustomMediaObject.prototype.controls
      return this
    }
  })
  fabric.CustomMediaObject.async = true
  fabric.CustomMediaObject.fromObject = function (_object, callback) {
    var object = fabric.util.object.clone(_object)
    fabric.util.loadImage(object.src, function (img, isError) {
      if (isError) {
        callback && callback(null, true);
        return;
      }
      fabric.util.enlivenObjectEnlivables(object, object, function () {
        var image = new fabric.CustomMediaObject(img, object);
        callback(image, false);
      });
    }, null, object.crossOrigin);
  };

  fabric.CustomMediaObject.prototype.controls.mr = new fabric.Control({
    x: 0.5,
    y: 0,
    actionHandler: fabric.controlsUtils.wrapWithFireEvent('resizing', fabric.controlsUtils.wrapWithFixedAnchor(changeWidth)),
    cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
    actionName: 'resizing',
  })

  fabric.CustomMediaObject.prototype.controls.ml = new fabric.Control({
    x: -0.5,
    y: 0,
    actionHandler: fabric.controlsUtils.wrapWithFireEvent('resizing', fabric.controlsUtils.wrapWithFixedAnchor(changeWidth)),
    cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
    actionName: 'resizing',
  });

  function changeHeight(eventData, transform, x, y) {
    var target = transform.target, localPoint = fabric.controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y),
      strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleX : 1),
      multiplier = isTransformCentered(transform) ? 2 : 1,
      oldHeight = target.height,
      newHeight = Math.ceil(Math.abs(localPoint.y * multiplier / target.scaleY) - strokePadding);
    const useNewHeight = Math.max(newHeight, 0)

    const scaledGridHeight = target.canvas.gridHeight / target.scaleY
    const snap = Math.round(useNewHeight / scaledGridHeight) * scaledGridHeight

    target.set('height', snap);
    //  check against actual target width in case `newWidth` was rejected
    return oldHeight !== target.height;
  }

  function changeWidth(eventData, transform, x, y) {
    var target = transform.target, localPoint = fabric.controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y),
      strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleX : 1),
      multiplier = isTransformCentered(transform) ? 2 : 1,
      oldWidth = target.width,
      newWidth = Math.ceil(Math.abs(localPoint.x * multiplier / target.scaleX) - strokePadding);

    const useNewWidth = Math.max(newWidth, 0)

    const scaledGridWidth = target.canvas.gridWidth / target.scaleX
    const snap = Math.round(useNewWidth / scaledGridWidth) * scaledGridWidth

    target.set('width', snap);
    //  check against actual target width in case `newWidth` was rejected
    return oldWidth !== target.width;
  }

  fabric.CustomMediaObject.prototype.controls.mt = new fabric.Control({
    x: 0,
    y: -0.5,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.wrapWithFireEvent('resizing', fabric.controlsUtils.wrapWithFixedAnchor(changeHeight)),
    actionName: 'resizing',
  })

  fabric.CustomMediaObject.prototype.controls.mb = new fabric.Control({
    x: 0,
    y: 0.5,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.wrapWithFireEvent('resizing', fabric.controlsUtils.wrapWithFixedAnchor(changeHeight)),
    actionName: 'resizing',
  });
  function isTransformCentered(transform) {
    return transform.originX === 'center' && transform.originY === 'center'
  }
}

export {
  CustomMediaObject
}
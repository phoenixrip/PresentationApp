import { fabric } from 'fabric'

function CustomImageObject() {
  // fabric.Image.prototype.handleChildrenMode = 'default'
  // fabric.Image.prototype.canRecieveTypes = { 'LabelElement': true }

  // fabric.Image.prototype.controls.mr = new fabric.Control({
  //   x: 0.5,
  //   y: 0,
  //   actionHandler: fabric.controlsUtils.changeWidth,
  //   cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
  //   actionName: 'resizing',
  // })

  // fabric.Image.prototype.controls.ml = new fabric.Control({
  //   x: -0.5,
  //   y: 0,
  //   actionHandler: fabric.controlsUtils.changeWidth,
  //   cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
  //   actionName: 'resizing',
  // });

  // function changeHeight(eventData, transform, x, y) {
  //   console.log('changeHeight')
  //   var target = transform.target, localPoint = fabric.controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y),
  //     strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleX : 1),
  //     multiplier = isTransformCentered(transform) ? 2 : 1,
  //     oldHeight = target.height,
  //     newHeight = Math.ceil(Math.abs(localPoint.y * multiplier / target.scaleY) - strokePadding);
  //   target.set('height', Math.max(newHeight, 0));
  //   //  check against actual target width in case `newWidth` was rejected
  //   return oldHeight !== target.height;
  // }

  // fabric.Image.prototype.controls.mt = new fabric.Control({
  //   x: 0,
  //   y: -0.5,
  //   cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
  //   actionHandler: fabric.controlsUtils.wrapWithFireEvent('resizing', fabric.controlsUtils.wrapWithFixedAnchor(changeHeight)),
  //   actionName: 'resizing',
  // })

  // fabric.Image.prototype.controls.mb = new fabric.Control({
  //   x: 0,
  //   y: 0.5,
  //   cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
  //   actionHandler: fabric.controlsUtils.wrapWithFireEvent('resizing', fabric.controlsUtils.wrapWithFixedAnchor(changeHeight)),
  //   actionName: 'resizing',
  // });
  // function isTransformCentered(transform) {
  //   return transform.originX === 'center' && transform.originY === 'center'
  // }


  // fabric.Image.prototype.initialize = (function (originalFn) {
  //   return function (...args) {
  //     originalFn.call(this, ...args)
  //     // this.on('added', () => alert('image added'))
  //     this.on('resizing', function ({ e, pointer, transform }) {
  //       if (transform.action === "resizing") {
  //         const newScaleToCover = fabric.util.findScaleToCover(this._element, { width: this.width, height: this.height })
  //         const missingScale = 1 - newScaleToCover
  //         console.log({ newScaleToCover, missingScale })
  //         const cropToCenterX = (this._element.naturalWidth - this.width) / 2
  //         const cropToCenterY = (this._element.naturalHeight - this.height) / 2
  //         this.set({
  //           cropX: cropToCenterX,
  //           cropY: cropToCenterY,
  //         })
  //         // console.log({ newScaleToFit })
  //       }
  //       // console.log(e)
  //     })
  //     return this
  //   };
  // })(fabric.Image.prototype.initialize);
}

export {
  CustomImageObject
}
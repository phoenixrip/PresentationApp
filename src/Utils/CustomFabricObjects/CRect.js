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
    }
  })

  fabric.CRect.fromObject = function (object, callback) {
    const obj = fabric.Object._fromObject('CRect', object, callback);
    return obj
  }
}



export {
  CRect
}
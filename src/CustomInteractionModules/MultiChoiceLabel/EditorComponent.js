import { customAttributesToIncludeInFabricCanvasToObject } from "../../Utils/consts"
import { CustomFabricCanvas } from "../../Utils/CustomFabricCanvas"
import { EditorComponentClass } from "../EditorComponentClass"

class MultiChoiceLabelEditorComponent extends EditorComponentClass {
  static key = 'multichoicelabel'
  static displayName = 'Multiple choice label'
  static action
  /**
   * 
   * @param {CustomFabricCanvas} fabricCanvas 
   * @returns 
   */
  static checkIfSelectionInitable(fabricCanvas) {
    const fabricActiveSelectionArray = fabricCanvas.getActiveObjects()
    // Check we have a path or a poly
    let labelables = []
    fabricActiveSelectionArray.forEach(obj => {
      switch (obj.type) {
        case 'path':
        case 'polygon':
          labelables.push(obj)
          break;
        default:
          break;
      }
    })
    return labelables.length
  }
  /**
   * @this {Editor}
   * @param {import("../../EditorContext").EditorContextTypes} editorContext 
   */
  static async handleInit() {
    // This is the editor component
    const selectedObjects = this.fabricCanvas.getActiveObjects()

    this.fabricCanvas.discardActiveObject()
    this.fabricCanvas.renderAll()

    const selectedPathObjects = selectedObjects
      .filter(obj => obj.type === 'path' || obj.type === 'polygon')
    let paths = []

    const bgRect = new fabric.Rect({
      width: this.state.project.settings.dimensions.width,
      height: this.state.project.settings.dimensions.height,
      top: 0,
      left: 0,
      fill: 'rgba(0, 0, 0, 0.65)'
    })
    paths.push(bgRect)
    for (const obj of selectedPathObjects) {
      const newPathObject = await clone(obj)
      newPathObject.set({ fill: 'black', globalCompositeOperation: 'destination-out' })
      paths.push(newPathObject)
      const newPathOutline = await clone(obj)
      newPathOutline.set({ stroke: 'blue', strokeWidth: 2 })
      paths.push(newPathOutline)
    }
    const group = new fabric.ObjectLabelGroup(paths, {

    })
    this.props.handleAddObject(
      group,
      selectedPathObjects[0].parentID,
      'Target Overlay',
      selectedPathObjects[0].treeIndex + 1
    )
  }
}
export {
  MultiChoiceLabelEditorComponent
}

/**
 * 
 * @param {fabric.Object} object 
 * @returns 
 */
function clone(object) {
  return new Promise((resolve, reject) => {
    object.clone(newObject => resolve(newObject), customAttributesToIncludeInFabricCanvasToObject)
  })
}
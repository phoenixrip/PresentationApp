import { v4 as uuidv4 } from 'uuid';
import { customAttributesToIncludeInFabricCanvasToObject } from "../../Utils/consts"
import { CustomFabricCanvas } from "../../Utils/CustomFabricCanvas"
import { EditorComponentClass } from "../EditorComponentClass"

/**
 * @typedef {Object} ValidObjects
 * @property {Array[fabric.Object]} hasLabelObject - The label objects
 * @property {Array[fabric.Object]} hasTargetables - The target objects
 * @property {Array[fabric.Object]} hasImage - The image objects
 */

class MultiChoiceLabelEditorComponent extends EditorComponentClass {
  static key = 'multichoicelabel'
  static displayName = 'Multiple choice label'
  static action = 'Create '
  /**
   * 
   * @param {CustomFabricCanvas} fabricCanvas 
   * @returns 
   */
  static checkIfSelectionInitable(fabricCanvas) {
    const fabricActiveSelectionArray = fabricCanvas.getActiveObjects()
    // Check we have a path or a poly
    const valid = MultiChoiceLabelEditorComponent.getValidObjectsFromArray(fabricActiveSelectionArray)
    return (
      valid.hasLabelObject.length
      && valid.hasTargetables.length
      && valid.hasImage.length
    )
    // return labelables.length
  }
  /**
   * @param {Array[fabric.Object]} objectsArray 
   * @returns {ValidObjects}
   */
  static getValidObjectsFromArray(objectsArray) {
    let hasLabelObject = []
    let hasTargetables = []
    let hasImage = []
    objectsArray.forEach(obj => {
      switch (obj.type) {
        case 'path':
        case 'polygon':
          hasTargetables.push(obj)
          break;
        case 'image':
          hasImage.push(obj)
          break;
        case 'LabelElement':
          hasLabelObject.push(obj)
        default:
          break;
      }
    })
    return {
      hasLabelObject,
      hasTargetables,
      hasImage
    }
  }
  /** handleInit
   * @this {Editor}
   */
  static async handleInit() {
    // This is the editor component
    const selectedObjects = this.fabricCanvas.getActiveObjects()

    this.fabricCanvas.discardActiveObject()
    const valid = MultiChoiceLabelEditorComponent.getValidObjectsFromArray(selectedObjects)
    const parentGroupGUID = uuidv4()
    const newGroupObject = new fabric.LabelAndTargetsGroup({
      guid: parentGroupGUID,
    })
    this.props.addObject()
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
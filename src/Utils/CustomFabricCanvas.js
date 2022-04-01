// @ts-ignore file

import { fabric } from 'fabric'

class CustomFabricCanvas extends fabric.Canvas {
  liveObjectsDict = {}
  constructor(canvas, options) {
    super(canvas, options)
    console.log('custom fabric canvas constructor', this)
  }
  mapObjectsArrayToNestedStructure = () => {
    console.log(this._objects)
  }

  existingSelectionIsCustomCreated = false
  _onMouseDown(e) {
    console.log("onmousedown custom", e)
    const target = this.findTarget(e, false)

    if (target?.parentGUID) {
      const allObjectsInFamily = this.objectsInFamilyOfGUID(target.uniqueGlobalId)
      const newSelection = new fabric.ActiveSelection(allObjectsInFamily, { canvas: this })
      this.setActiveObject(newSelection)
      this.existingSelectionIsCustomCreated = true
      this.renderAll()
      
    }
    super._onMouseDown(e)
  }

  _onMouseUp(e) {
    super._onMouseUp(e)
    if (!this.existingSelectionIsCustomCreated) {
      const selection = this.getActiveObject()
      if (selection) { // if there's no selection this is null so don't run code below
        
        if (selection.type === "activeSelection") {
          let GUIDsToCheck = []
          for (const object of selection.getObjects()) {
            GUIDsToCheck.push(object.uniqueGlobalId)
          }
          const objectsInFamily = this.objectsInFamilyOfGUID(GUIDsToCheck)
          console.log({objectsInFamily})
          this.discardActiveObject()
          const newActiveSelection = new fabric.ActiveSelection(objectsInFamily, { canvas: this })
          this.setActiveObject(newActiveSelection)
          this.renderAll()
        }
      }
    }
    this.existingSelectionIsCustomCreated = false // reset to default 
  }
  


  objectsInFamilyOfGUID(GUIDOrGUIDs) {
    //If it's a single string normalise to an array of GUIDs, otherwise use user-supplied array of string
    let GUIDs
    if (typeof GUIDOrGUIDs === "string") GUIDs = [GUIDOrGUIDs]
    else GUIDs = GUIDOrGUIDs

    let allChildrenAndSelection = new Set()
    for (const GUID of GUIDs) {
      const selectedObject = this.liveObjectsDict[GUID]

      if (selectedObject?.parentGUID) {
        const tallestParent = this.recursivelyFindTallestParent(selectedObject)
        const recursivelyFindAllChildren = (parentObject) => {
          allChildrenAndSelection.add(parentObject)
          if (!parentObject?.members) return
          for (const childObjectGUID of parentObject.members) {
            const childObject = this.liveObjectsDict[childObjectGUID]
            recursivelyFindAllChildren(childObject)
          }
        }
        recursivelyFindAllChildren(tallestParent)
      } else {
        allChildrenAndSelection.add(selectedObject)
      }
    }
    const allChildrenAndSelectionArray = Array.from(allChildrenAndSelection)
    return allChildrenAndSelectionArray
  }
  recursivelyFindTallestParent(obj) {
    if (obj?.parentGUID) {
      const parentObject = this.liveObjectsDict[obj.parentGUID]
      return this.recursivelyFindTallestParent(parentObject)
    } else {
      return obj
    }
  }
}




export { CustomFabricCanvas }

// function checkClick(e: any, value: any) {
//   return e.button && (e.button === value - 1);
// }

const addListener = fabric.util.addListener
const removeListener = fabric.util.removeListener
//   RIGHT_CLICK = 3, MIDDLE_CLICK = 2, LEFT_CLICK = 1,
const addEventOptions = { passive: false };
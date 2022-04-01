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
      this.renderAll()
      this.existingSelectionIsCustomCreated = true
    }
    super._onMouseDown(e)
  }



  _onMouseUp(e) {
    this.existingSelectionIsCustomCreated = false // reset to default 
    super._onMouseUp(e)
    if (!this.existingSelectionIsCustomCreated) {
      const selection = this.getActiveObject()
      if (selection) { // if there's no selection this is null so don't run code below
        let GUIDsToCheck = []
        let objectsToSelect = []

        if (selection.type === "activeSelection") {
          const objectsInActiveSelection = selection.getObjects()
          for (const object of objectsInActiveSelection) {
            if (!object.parentGUID) {
              //If it's not in a family/group add it directly to objectsToSelect
              objectsToSelect.push(object)
            }
            else {
              //If it is in a family add it to array of GUIDs to give to function to find all family members
              GUIDsToCheck.push(object.uniqueGlobalId)
            }
          }
        } else {
          if (!selection.parentGUID) {
            //If it's not in a family/group add it directly to objectsToSelect
            objectsToSelect.push(object)
          }
          else {
            //If it is in a family add it to array of GUIDs to give to function to find all family members
            GUIDsToCheck.push(object.uniqueGlobalId)
          }
        }
        const objectsInFamily = this.objectsInFamilyOfGUID(GUIDsToCheck)
        objectsToSelect = [...objectsToSelect, ...objectsInFamily]
        this.discardActiveObject()
        const newActiveSelection = new fabric.ActiveSelection(objectsToSelect, { canvas: this })
        this.setActiveObject(newActiveSelection)
        this.renderAll()
      }
    }
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
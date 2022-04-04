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
    let target = this.findTarget(e, false)
    console.log(target)  

    // // When we have an active selection it's always on top and gets selected instead of the element 
    // // so we have to find the element in the active selection which is under the cursor
    // if (target && target.type === "activeSelection") {
    //   //Convert from absolute position of pointer to position relative to center of active selection
    //   const pointerPosition = this.getPointer(e)
    //   const pointerPositionRelativeToActiveSelectionCenter = {
    //     x: pointerPosition.x - (target.width / 2) - target.left,
    //     y: pointerPosition.y - (target.height / 2) - target.top
    //   }
    //   // Iterate through objects in active selection and find the one that contains the point the mouse clicked on
    //   for (const obj of target.getObjects()) {
    //     if (obj.type !== "FakeGroup" && obj.containsPoint(pointerPositionRelativeToActiveSelectionCenter)) {
    //       target = obj
    //       console.log("recast target as", target)
    //     }
    //   }
    // }


    // const currentSelection = this.getActiveObject()

    // // If the target has a parent and shift key is not pressed just select the whole family
    // if (target && target?.parentGUID && !e?.shiftKey) { // if its already in the active selection do nothing else do this:
    //   if (!(currentSelection.type === "activeSelection" && currentSelection.contains(target))) {
    //     const allObjectsInFamily = this.objectsInFamilyOfGUID(target.uniqueGlobalId)
    //     this._discardActiveObject()
    //     const newActiveSelection = new fabric.ActiveSelection(allObjectsInFamily, { canvas: this })
    //     this._setActiveObject(newActiveSelection)
    //     this.existingSelectionIsCustomCreated = true
    //     this.renderAll()
    //   }
    // }
    // // If the target has a parent and shift key is pressed we need to add it to selection if target is not in it already, and vice versa
    // else if (target && target?.parentGUID && e?.shiftKey) {
    //   console.log("2")
    //   let newSelectionObjects = []

    //   if (currentSelection.type === "activeSelection") {
    //     console.log("3")
    //     // if we shift click a target which is already in the currentSelection remove it and its family from selection
    //     if (currentSelection.contains(target)) {
    //       console.log("4")
    //       const allObjectsInFamily = this.objectsInFamilyOfGUID(target.uniqueGlobalId)
    //       //Build array of objects in active selection which are not in family of target
    //       newSelectionObjects = currentSelection.getObjects().filter(obj => { if (!allObjectsInFamily.includes(obj)) return obj })
    //       this._discardActiveObject()
    //       const newActiveSelection = new fabric.ActiveSelection(newSelectionObjects, { canvas: this })
    //       this._setActiveObject(newActiveSelection)
    //       this.existingSelectionIsCustomCreated = true
    //     } else { // if we shift click a target which is not in the currentSelection add it and its family from selection
    //       console.log("5")
    //       const allObjectsInFamily = this.objectsInFamilyOfGUID(target.uniqueGlobalId)
    //       newSelectionObjects = [...allObjectsInFamily, ...currentSelection.getObjects()]
    //       this._discardActiveObject()
    //       const newActiveSelection = new fabric.ActiveSelection(newSelectionObjects, { canvas: this })
    //       this._setActiveObject(newActiveSelection)
    //       this.existingSelectionIsCustomCreated = true
    //     }
    //   } else { // If only one other element is currently selected then we select family of target and current selection
    //     const allObjectsInFamily = this.objectsInFamilyOfGUID(target.uniqueGlobalId)
    //     newSelectionObjects = [...allObjectsInFamily, currentSelection]
    //     const newActiveSelection = new fabric.ActiveSelection(newSelectionObjects, { canvas: this })
    //     this._setActiveObject(newActiveSelection)
    //     // setting this.existingSelectionIsCustomCreated = true here -will make all but the target movable
    //   }

    //   this.renderAll()
    // }


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
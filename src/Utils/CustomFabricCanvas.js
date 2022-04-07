// @ts-ignore file
import { v4 as uuidv4 } from 'uuid';
import { fabric } from 'fabric'
import { FakeGroup } from './SetFabricDefaults'

const dl = (args, ...rest) => console.log(args, ...rest)
class CustomFabricCanvas extends fabric.Canvas {
  liveObjectsDict = {}
  constructor(canvas, options) {
    super(canvas, options)
    console.log('custom fabric canvas constructor', this._objects)
  }
  existingSelectionIsCustomCreated = false
  // _onMouseDown(e) {
  //   // console.log("onmousedown custom", e)
  //   const target = this.findTarget(e, false)
  //   if (target && target?.parentID) {
  //     // this.handleSelectParentGroupBeforeMouseDown(target)
  //     if (e?.shiftKey) {

  //     } else {

  //       if (target?.parentID) {
  //         const allObjectsInFamily = this.objectsInFamilyOfGUID(target.guid)
  //         const newSelection = new fabric.ActiveSelection(allObjectsInFamily, { canvas: this })
  //         this._setActiveObject(newSelection)
  //         this.existingSelectionIsCustomCreated = true
  //         this.renderAll()
  //       }
  //     }
  //   }
  //   super._onMouseDown(e)
  // }
  // _onMouseUp(e) {
  //   super._onMouseUp(e)
  //   if (!this.existingSelctionIsCustomCreated) {
  //     const selection = this.getActiveObject()
  //     if (selection) { // if there's no selection this is null so don't run code below

  //       if (selection.type === "activeSelection") {
  //         let GUIDsToCheck = []
  //         for (const object of selection.getObjects()) {
  //           GUIDsToCheck.push(object.guid)
  //         }
  //         const objectsInFamily = this.objectsInFamilyOfGUID(GUIDsToCheck)
  //         this._discardActiveObject()
  //         const newActiveSelection = new fabric.ActiveSelection(objectsInFamily, { canvas: this })
  //         this._setActiveObject(newActiveSelection)
  //         this.renderAll()
  //       }
  //     }
  //   }
  //   this.existingSelectionIsCustomCreated = false // reset to default 
  // }
  objectsInFamilyOfGUID(GUIDOrGUIDs) {
    //If it's a single string normalise to an array of GUIDs, otherwise use user-supplied array of string
    let GUIDs
    if (typeof GUIDOrGUIDs === "string") GUIDs = [GUIDOrGUIDs]
    else GUIDs = GUIDOrGUIDs

    let allChildrenAndSelection = new Set()
    for (const GUID of GUIDs) {
      const selectedObject = this.liveObjectsDict[GUID]

      if (selectedObject?.parentID) {
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
    if (obj?.parentID) {
      const parentObject = this.liveObjectsDict[obj.parentID]
      return this.recursivelyFindTallestParent(parentObject)
    } else {
      return obj
    }
  }
  updatePaths() {
    dl('updatePaths')
    let currentPath = new Set()
    let currentTopLevelIndex = 0
    this._objects.forEach(
      (obj, i) => {
        if (!obj.parentID) {
          currentPath.clear()
          currentTopLevelIndex = i
        } else {
          currentPath.add(obj.parentID)
        }
        const usePath = [...currentPath, obj.guid]
        obj.structurePath = usePath
        obj.depth = usePath.length
        obj.treeIndex = i
        obj.topLevelIndex = currentTopLevelIndex
      }
    )
  }
  logFlatVisual() {
    let string = ``
    this._objects.forEach(obj => {
      obj.structurePath.forEach(pathGUID => string += `${pathGUID} - `)
      // string += `${obj.guid}`
      string += '\n'
    })
    console.log(string)
  }
  groupSelectedByObjectIndexes(selectedIndexsArray, createdAtSceneIndex) {
    const insertAtIndex = selectedIndexsArray[0]
    let selectedIndexsObj = selectedIndexsArray.reduce((acc, curr) => {
      return { ...acc, [curr]: true }
    }, {})
    const newGroup = this.createNewGroupAtIndex(insertAtIndex, createdAtSceneIndex)
    let beforeInsertionIndex = []
    let atInsertionIndex = []
    let afterInserstionIndex = []
    let dealtWithIndex = -1
    this._objects.forEach((obj, i) => {
      if (dealtWithIndex >= i) return
      if (selectedIndexsObj[i]) {
        obj.parentID = newGroup.guid
        atInsertionIndex.push(obj)
        dealtWithIndex = i
        if (obj.type === 'FakeGroup') {
          const groupPath = obj.structurePath
          let currentIterationIndex = dealtWithIndex + 1
          while (this._objects[currentIterationIndex].structurePath.length > groupPath.length) {
            const aObj = this._objects[currentIterationIndex]
            atInsertionIndex.push(aObj)
            dealtWithIndex = currentIterationIndex
            currentIterationIndex++
          }
        }
      } else {
        if (i < insertAtIndex) beforeInsertionIndex.push(obj)
        else afterInserstionIndex.push(obj)
      }
    })
    this._objects = [...beforeInsertionIndex, ...atInsertionIndex, ...afterInserstionIndex]
    this.insertAt(newGroup, insertAtIndex)
    this.updatePaths()
    // this.fire('object:modified', { target: { type: 'layoutStructure' } })
    return this
  }
  createNewGroupAtIndex = (index = null, createdAtSceneIndex) => {
    const useIndex = index || this._objects.length - 1
    const objCurrentlyAtIndex = this._objects[useIndex] ?? {}
    const newGUID = uuidv4()
    const newGroup = new fabric.FakeGroup({
      guid: newGUID,
      parentID: objCurrentlyAtIndex?.parentID,
      structurePath: objCurrentlyAtIndex?.structurePath || [newGUID],
      userSetName: 'Group',
      firstOccurrenceIndex: createdAtSceneIndex
    })
    this.liveObjectsDict[newGUID] = newGroup
    return newGroup
  }
  handleRecieveNewFlatOrder = (sortedArray) => {
    sortedArray.forEach((obj, newTreeIndex) => {
      this.liveObjectsDict[obj.guid].treeIndex = newTreeIndex
      this.liveObjectsDict[obj.guid].parentID = obj.parentID
    })
    return this.handleReorderObjectArrayToObjectTreeIndexOrder()
  }
  handleReorderObjectArrayToObjectTreeIndexOrder = () => {
    this._objects = this._objects.sort((objA, objB) => objA.treeIndex - objB.treeIndex)
    this.updatePaths()
    return this
  }
  /**
   * @returns {Record<string, import('../Types/CustomFabricTypes').CustomFabricOptions>}
   */
  getSaveableSceneState = () => {
    console.log('getSaveableState')
    let newSceneState = {}
    this._objects.forEach(obj => {
      newSceneState[obj.guid] = obj.getAnimatableValues()
    })
    return newSceneState
  }
}

export { CustomFabricCanvas }
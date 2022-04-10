import { v4 as uuidv4 } from 'uuid';
import { fabric } from 'fabric'
import { FakeGroup } from './SetFabricDefaults'

const dl = (args, ...rest) => console.log(args, ...rest)
class CustomFabricCanvas extends fabric.Canvas {
  liveObjectsDict = {}
  projectSettings = {}
  constructor(canvas, options) {
    super(canvas, options)
    console.log('custom fabric canvas constructor', this._objects)
  }

  existingSelectionIsCustomCreated = false
  familyObjectsRemovedFromSelection = false
  _onMouseDown(e) {
    console.log("onmousedown custom", e)
    let target
    if(e?.shiftKey) { // On shift click we ignore active selections in findTarget so we get actual element clicked
      target = this.findTarget(e, true)
    } else {
      target = this.findTarget(e, false)
    }

    //When shift key isnt held we just select all objects in the family
    if (target && target.parentID && !e?.shiftKey) {
      const allObjectsInFamily = this.objectsInFamilyOfGUID(target.guid)
      const newSelectionObjects = [...allObjectsInFamily]
      this._discardActiveObject()
      const newActiveSelection = new fabric.ActiveSelection(newSelectionObjects, { canvas: this })
      this._setActiveObject(newActiveSelection)
      // setting this.existingSelectionIsCustomCreated = true here -will make all but the target movable
      this.renderAll()
    }
    else if (target && target.parentID && e?.shiftKey) {
        const currentSelection = this.getActiveObject()

        // if we have shift clicked and selected an object with a family that's not in our current selection add it
        if (currentSelection.type === "activeSelection" && !currentSelection.contains(target)) {
          const allObjectsInFamily = this.objectsInFamilyOfGUID(target.guid)
          const newSelectedObjects = [...currentSelection.getObjects(), ...allObjectsInFamily]
          this._discardActiveObject()
          const newActiveSelection = new fabric.ActiveSelection(newSelectedObjects, { canvas: this })
          this._setActiveObject(newActiveSelection)
          //this.existingSelectionIsCustomCreated = true
          this.renderAll()

          // if we have shift clicked and select an object with a family in our current selection filter it out of our selection
        } else if (currentSelection.type === "activeSelection" && currentSelection.contains(target)) {
          const allObjectsInFamily = this.objectsInFamilyOfGUID(target.guid)
          const newSelectedObjects = currentSelection.getObjects().filter(obj => !allObjectsInFamily.includes(obj))
          this._discardActiveObject()
          const newActiveSelection = new fabric.ActiveSelection(newSelectedObjects, { canvas: this })
          this._setActiveObject(newActiveSelection)
          this.existingSelectionIsCustomCreated = true
          this.familyObjectsRemovedFromSelection = true
          this.renderAll()
        }
    }
    super._onMouseDown(e)
  }

  _onMouseUp(e) {
    super._onMouseUp(e)
    if (!this.existingSelectionIsCustomCreated) {
      const selection = this.getActiveObject()
      if (selection && selection.type === "activeSelection") {
        let GUIDsToCheck = []
        for (const object of selection.getObjects()) {
          GUIDsToCheck.push(object.guid)
        }
        const objectsInFamily = this.objectsInFamilyOfGUID(GUIDsToCheck)
        this._discardActiveObject()
        const newActiveSelection = new fabric.ActiveSelection(objectsInFamily, { canvas: this })
        this._setActiveObject(newActiveSelection)
        this.renderAll()
      }
    }
    this.existingSelectionIsCustomCreated = false // reset to default 

    //Fabric re-adds selected object to selection on shift-click after we remove the whole family. Remove that single element again here
    if (this.familyObjectsRemovedFromSelection) {
      const target = this.findTarget(e, true)
      const currentSelection = this.getActiveObject()
      currentSelection.removeWithUpdate(target)
      this.familyObjectsRemovedFromSelection = false
    }
  }

  objectsInFamilyOfGUID(GUIDOrGUIDs) {
    //If it's a single string normalise to an array of GUIDs, otherwise use user-supplied array of string
    let GUIDs
    if (typeof GUIDOrGUIDs === "string") GUIDs = [GUIDOrGUIDs]
    else GUIDs = GUIDOrGUIDs

    let allChildrenAndSelection = new Set()
    for (const GUID of GUIDs) {
      const fabricObject = this.liveObjectsDict[GUID]
      if (fabricObject?.parentID) {
        const topLevelIndex = fabricObject.topLevelIndex
        const tallestParent = this._objects[topLevelIndex]

        for (let i = topLevelIndex + 1; i < this._objects.length; i++) {
          if (this._objects[i].structurePath.length <= tallestParent.structurePath.length) break
          if (this._objects[i].type !== "FakeGroup") {
            allChildrenAndSelection.add(this._objects[i])
          }
        }
      } else {
        allChildrenAndSelection.add(fabricObject)
      }
    }
    const allChildrenAndSelectionArray = Array.from(allChildrenAndSelection)
    return allChildrenAndSelectionArray
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
    this.tempDeselect()
    let newSceneState = {}
    this._objects.forEach(obj => {
      newSceneState[obj.guid] = obj.getAnimatableValues()
    })
    this.tempReselect()
    return newSceneState
  }
  tempDeselect() {
    this.cachedActiveObjectsArray = this.getActiveObjects()
    console.trace('tempDeselect: ', this.cachedActiveObjectsArray)
    this._discardActiveObject()
  }
  tempReselect() {
    console.trace('tempReselect', this.cachedActiveObjectsArray)
    if (!this.cachedActiveObjectsArray) return
    if (!this.cachedActiveObjectsArray.length) return
    if (this.cachedActiveObjectsArray.length === 1) {
      this._setActiveObject(this.cachedActiveObjectsArray[0])
      this.cachedActiveObjectsArray = null
      return
    }
    let newSelectionArray = []
    this.cachedActiveObjectsArray.forEach(obj => {
      if (obj.canvas === this) newSelectionArray.push(obj)
    })
    const replaceSelection = new fabric.ActiveSelection(newSelectionArray, { canvas: this })
    this._setActiveObject(replaceSelection)
    this.cachedActiveObjectsArray = null
  }
}

export { CustomFabricCanvas }
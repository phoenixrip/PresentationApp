import { v4 as uuidv4 } from 'uuid';
import { fabric } from 'fabric'
import { FakeGroup } from './SetFabricDefaults'
import { greatestCommonDenominator } from './greatestCommonDenominator';
import { ProjectParaStylesController } from './CustomControllerClasses/ProjectParaStylesController';

const dl = (args, ...rest) => console.log(args, ...rest)
class CustomFabricCanvas extends fabric.Canvas {
  liveObjectsDict = {}
  projectSettings = {}
  eyedropperActive = false
  gridWidth = 1
  gridHeight = 1
  constructor(canvas, options) {
    super(canvas, options)
  }
  existingSelectionIsCustomCreated = false
  familyObjectsRemovedFromSelection = false
  /**
   * @param {ProjectParaStylesController} projectParaStylesController 
   */
  initProjectParaStylesController(projectParaStylesController) {
    this.projectParaStylesController = projectParaStylesController
  }
  _onMouseDown(e) {
    if (this.eyedropperActive) {
      this.fire("mouse:down", e)
    } else {
      let target = this.findTarget(e, e?.shiftKey) // On shift click we ignore active selections in findTarget so we get actual element clicked

      let shouldRunCustomGrabGroup = true
      const alreadySelected = target === this._activeObject
      const metaKeyDown = e.metaKey

      if (alreadySelected) shouldRunCustomGrabGroup = false
      if (metaKeyDown) shouldRunCustomGrabGroup = false

      //When shift key isnt held we just select all objects in the family
      if (shouldRunCustomGrabGroup && target && target.parentID && !e?.shiftKey) {
        const allObjectsInFamily = this.objectsInFamilyOfGUID(target.guid)
        const newSelectionObjects = [...allObjectsInFamily]
        this._discardActiveObject()
        const newActiveSelection = new fabric.ActiveSelection(newSelectionObjects, { canvas: this })
        this._setActiveObject(newActiveSelection)
        // setting this.existingSelectionIsCustomCreated = true here -will make all but the target movable
        this.renderAll()
      }
      else if (shouldRunCustomGrabGroup && target && target.parentID && e?.shiftKey) {
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
  }
  _onMouseUp(e) {
    super._onMouseUp(e)
    if (!this.eyedropperActive) {
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
    // dl('updatePaths')
    // let currPath = []
    // let currentPath = new Set()
    // let currentTopLevelIndex = 0
    this._objects.forEach(
      (obj, i) => {
        if (!obj.parentID) {
          obj.structurePath = [obj.guid]
          obj.depth = 0
          obj.treeIndex = i
          obj.topLevelIndex = i
        } else {
          const liveParentObj = this.liveObjectsDict[obj.parentID]
          obj.structurePath = [...liveParentObj.structurePath, obj.guid]
          obj.depth = (obj.structurePath.length - 1)
          obj.treeIndex = i
          obj.parentIndex = liveParentObj.treeIndex
          obj.topLevelIndex = this.liveObjectsDict[obj.structurePath[0]].topLevelIndex
        }
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
        if (obj?.handleChildrenMode !== undefined) {
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
    // console.trace('tempDeselect: ', this.cachedActiveObjectsArray)
    this._discardActiveObject()
  }
  tempReselect() {
    // console.trace('tempReselect', this.cachedActiveObjectsArray)
    if (!this.cachedActiveObjectsArray) return this
    if (!this.cachedActiveObjectsArray.length) return this
    if (this.cachedActiveObjectsArray.length === 1) {
      this._setActiveObject(this.cachedActiveObjectsArray[0])
      this.cachedActiveObjectsArray = null
      return this
    }
    let newSelectionArray = []
    this.cachedActiveObjectsArray.forEach(obj => {
      if (obj.canvas === this) newSelectionArray.push(obj)
    })
    const replaceSelection = new fabric.ActiveSelection(newSelectionArray, { canvas: this })
    this._setActiveObject(replaceSelection)
    this.cachedActiveObjectsArray = null
    return this
  }
  initProjectSettings(projectSettings) {
    this.projectSettings = projectSettings
    const currentGridAspectGreatestCommonDenom = greatestCommonDenominator(projectSettings.dimensions.width, projectSettings.dimensions.height)
    this.gridWidth = projectSettings.dimensions.width / currentGridAspectGreatestCommonDenom
    this.gridHeight = projectSettings.dimensions.height / currentGridAspectGreatestCommonDenom
  }
}

function roundXToNearestDivisbleY(x, y, type = 'down') {
  if (type === 'down') {
    x -= 1
    return Math.floor(x / y) * y
  } else if (type === 'up') {
    x += 1
    return Math.ceil(x / y) * y
  }
  return 0
}

export { CustomFabricCanvas }
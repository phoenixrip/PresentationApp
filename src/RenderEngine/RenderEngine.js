import gsap from 'gsap'
import { diff } from '../Utils/diff'

class RenderEngine {
  liveObjectsDict = {}
  /**
   * @param {import("../Types/ProjectDataTypes").ProjectDataTypes} projectDataObject 
   * @param {fabric.StaticCanvas} c1 
   * @param {fabric.Canvas} c2 
   */
  constructor(projectDataObject, c1, c2) {
    this.projectDataObject = projectDataObject
    this.c1 = c1
    this.c2 = c2
    this.c2.renderOffScreen = true
    this.liveObjectsDict = {}
    this.mainTL = new gsap.timeline({ paused: true })
  }
  play = async () => {
    await this.initAllObjects()
    this.initAllSceneControllers()
    this.activeSceneIndex = 0
    this.sceneControllers[0].applyLayoutStructure(true)
    this.c2.renderAll()
    this.sceneControllers[1].applyLayoutStructure()
    this.sceneControllers
    this.mainTL
      .add(
        this.sceneControllers[1].getSceneInTimeline().play()
      )
      .call(this.onNewSceneIn, [1])
    this.mainTL.play()
    return this
  }
  initAllObjects = () => {
    return new Promise((resolve, reject) => {
      this.c2.loadFromJSON(
        { objects: Object.values(this.projectDataObject.globalObjects) },
        () => resolve(),
        (globalObjectOptions, liveFabricObject) => {
          liveFabricObject.guid = globalObjectOptions.guid
          this.liveObjectsDict[globalObjectOptions.guid] = liveFabricObject
        }
      )
    })
  }
  initAllSceneControllers = () => {
    this.sceneControllers = this.projectDataObject.scenes.map((sceneObject, sceneIndex) => {
      return new SceneController(this, sceneIndex, this.projectDataObject.scenes)
    })
  }
  handleAutoMoveToNextScreen = () => {
    const newScreenIndex = this.activeSceneIndex + 1
    if (!this.sceneControllers[newScreenIndex]) {
      return console.log('END OF PROJECT')
    }
    this.sceneControllers[newScreenIndex].applyLayoutStructure()
    this.mainTL
      .add(
        this.sceneControllers[newScreenIndex]
          .getSceneInTimeline()
          .play()
      )
      .call(this.onNewSceneIn, [newScreenIndex])
    this.mainTL.play()
  }
  onNewSceneIn = (newSceneIndex) => {
    this.activeSceneIndex = newSceneIndex
    this.sceneControllers[this.activeSceneIndex].handleSceneIn()
  }
}

class SceneController {
  /**
   * @param {RenderEngine} re 
   * @param {number} sceneIndex 
   * @param {Array<import('../Types/ProjectDataTypes').SceneType>} scenesArray 
   */
  constructor(re, sceneIndex, scenesArray) {
    this.re = re
    this.sceneIndex = sceneIndex
    this.scenesArray = scenesArray
  }
  get prevSceneObject() { return this.scenesArray[this.sceneIndex - 1] }
  get sceneObject() { return this.scenesArray[this.sceneIndex] }
  applyLayoutStructure = (preRenderSceneObjectSettings = false) => {
    console.log(`applyLayoutStructure Scene[${this.sceneIndex}]`)
    // Add and remove objects
    Object.entries(this.re.liveObjectsDict)
      .forEach(([guid, obj]) => {
        const isInScene = this.sceneObject.activeSceneObjects?.[guid] && this.sceneObject.activeSceneObjects?.[guid].visible
        const isInCanvasObjectsArray = obj?.canvas !== undefined
        if (isInScene && !isInCanvasObjectsArray) {
          // console.log('adding ', obj.type, obj.guid)
          this.re.c2.add(obj)
        } else if (!isInScene && isInCanvasObjectsArray) {
          // console.log('removing ', obj.type, obj.guid)
          this.re.c2.remove(obj)
        }
        if (isInScene) {
          obj.treeIndex = this.sceneObject.activeSceneObjects[guid].treeIndex
          if (preRenderSceneObjectSettings) {
            obj
              .set(isInScene)
              .setCoords()
          }
        }
      })
    // Order the newly update object array of the canvas
    this.re.c2._objects.sort((a, b) => a.treeIndex - b.treeIndex)
    return this
  }
  getSceneInTimeline = () => {
    console.log(`getSceneInTimeline scene[${this.sceneIndex}]`)
    const moveTL = new gsap.timeline({
      paused: true,
      onUpdate: this.re.c2.requestRenderAll.bind(this.re.c2),
      defaults: {
        ease: 'expo.inOut',
        duration: 1
      }
    })
    const addTL = new gsap.timeline({
      paused: true,
      onUpdate: this.re.c2.requestRenderAll.bind(this.re.c2),
      defaults: {
        ease: 'expo.inOut',
        duration: 1
      }
    })
    const diffFromPrevScene = diff(this.prevSceneObject.activeSceneObjects, this.sceneObject.activeSceneObjects)
    Object.entries(diffFromPrevScene)
      .forEach(([guid, diffObject]) => {
        const obj = this.re.liveObjectsDict[guid]
        const wasInPreviousScene = this.prevSceneObject.activeSceneObjects?.[guid] !== undefined
          && this.prevSceneObject.activeSceneObjects?.[guid].visible
        if (!wasInPreviousScene) {
          // This is an object enter animation
          obj.set(diffObject)
          // Check if the object has a custom in timeline we can use
          const objHasCustomInTL = obj?.getObjectInTimeline?.()
          if (objHasCustomInTL) {
            addTL.add(
              objHasCustomInTL.play(),
              'add'
            )
          } else {
            // Otherwise default to fading the opacity up
            addTL.from(obj, {
              opacity: 0
            }, 'add')
          }
        } else {
          // This is an object change animation
          moveTL.to(obj, {
            ...diffObject,
          }, 'move')
        }
      })
    const sceneInTL = new gsap.timeline({
      paused: true,
      onUpdate: this.re.c2.requestRenderAll.bind(this.re.c2),
      defaults: {
        ease: 'expo.inOut',
        duration: 1
      }
    })
      .add(moveTL.play())
      .add(addTL.play())
    return sceneInTL
  }
  handleSceneIn = () => {
    console.log('handleSceneIn')
    // By default wait a few seconds then tell the re to continue
    gsap.delayedCall(0.1, this.re.handleAutoMoveToNextScreen)
  }
}

export {
  RenderEngine
}
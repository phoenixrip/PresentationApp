import { fabric } from 'fabric'
import { ICollection } from 'fabric/fabric-impl'
import { CustomFabricGroup, CustomFabricObject } from '../Types/CustomFabricTypes'
import { ProjectDataTypes } from '../Types/ProjectDataTypes'

function flatMapFabricSceneState(newFabricState: any) {
  const fabricObjectsArray = (newFabricState.objects as Array<CustomFabricObject>)
    .filter(obj => obj?.uniqueGlobalId !== 'viewBoxRect')

  let newFlatMap: { [key: string]: CustomFabricObject } = {}
  recurseForFlatMap(fabricObjectsArray, false)
  return newFlatMap

  function recurseForFlatMap(objectsArray: Array<CustomFabricObject>, parentID: string | false) {
    objectsArray.forEach((obj, i) => {
      obj.objectIndex = i
      if (parentID) obj.parentID = parentID
      if (obj?.type !== 'group') return newFlatMap[obj.uniqueGlobalId] = obj
      const groupMembers = obj?.objects?.map(obj => obj.uniqueGlobalId) || []
      obj.members = groupMembers
      recurseForFlatMap(obj?.objects || [], obj.uniqueGlobalId)
      obj.objects = []
      newFlatMap[obj.uniqueGlobalId] = obj
    })
  }
}

function normalizeAllObjectCoords(target: fabric.ActiveSelection | fabric.Object, action: string) {
  const isSelection = target.type === "activeSelection"

  // ------------------------------------------------------------------------
  // Scale width/height/radius according to scale and reset scale to 1
  // Reset top and left according to rescaled position without active selection
  // ------------------------------------------------------------------------
  switch (action) {
    case "scaleX":
    case "scaleY":
    case "scale":
      const newScaleX = target?.scaleX || 1;
      const newScaleY = target?.scaleY || 1;

      if (isSelection) {
        target.set({
          width: Math.round((target?.width || 0) * newScaleX) || 1,
          height: Math.round((target?.height || 0) * newScaleY) || 1,
          scaleX: 1,
          scaleY: 1,
        });
      }

      // Get objects from activeSelection or take selected object in array so we can iterate
      let objects: Array<CustomFabricObject> = target instanceof fabric.ActiveSelection
        ? target.getObjects() as Array<CustomFabricObject>
        : [target] as Array<CustomFabricObject>


      // TODO: Odne learn typescript so this fucking shit can get to fuck
      // Find a way of not having to conditionally access every property everysingle time
      // even when we know the fucking object is fucking there you piece of shit
      objects.forEach((obj: CustomFabricObject) => {
        if (obj !== undefined) {
          const left = Math.round((obj?.left || 0) * newScaleX)
          const top = Math.round((obj?.top || 0) * newScaleY)
          let newSettings = {} as fabric.IObjectOptions

          switch (obj.type) {
            case "rect":
              newSettings = {
                width: Math.round((obj?.width || 1) * newScaleX) || 1,
                height: Math.round((obj?.height || 1) * newScaleY) || 1,
                scaleX: 1,
                scaleY: 1,
              }
              if (isSelection) newSettings = { ...newSettings, top: top, left: left } //only set top and left on activeSelection:
              obj.set(newSettings);
              break;
            case "circle":
              newSettings = {
                radius: Math.round((obj?.radius || 1) * newScaleX) || 1,
                scaleX: 1,
                scaleY: 1
              } as fabric.ICircleOptions
              if (isSelection) newSettings = { ...newSettings, top: top, left: left } //only set top and left on activeSelection:
              obj.set(newSettings);
              break;
            default:
              break;
          }
        }
      })
      break
    default:
      break
  }
}

function saturateFabricCanvasFromFlatMapSceneState(fabricCanvas: fabric.Canvas, flatMap: ProjectDataTypes['globalObjects']) {

}



export {
  flatMapFabricSceneState,
  normalizeAllObjectCoords
}
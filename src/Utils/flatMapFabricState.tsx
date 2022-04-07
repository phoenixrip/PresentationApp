import { fabric } from 'fabric'
import { ICollection } from 'fabric/fabric-impl'
import { CustomFabricGroup, CustomFabricObject } from '../Types/CustomFabricTypes'
import { ProjectDataTypes } from '../Types/ProjectDataTypes'

function flatMapFabricSceneState(newFabricState: any) {
  const fabricObjectsArray = (newFabricState.objects as Array<CustomFabricObject>)

  let newFlatMap: { [key: string]: CustomFabricObject } = {}
  recurseForFlatMap(fabricObjectsArray, false)
  return newFlatMap

  function recurseForFlatMap(objectsArray: Array<CustomFabricObject>, parentIDs: string | false) {
    objectsArray.forEach((obj, i) => {
      obj.objectIndex = i
      //if (parentIDs) obj.parentIDs = parentIDs
      if (obj?.type !== 'group') return newFlatMap[obj.guid] = obj
      //const groupMembers = obj?.objects?.map(obj => obj.guid) || []
      //obj.members = groupMembers
      //recurseForFlatMap(obj?.objects || [], obj.guid)
      // obj.objects = []
      // newFlatMap[obj.guid] = obj
    })
  }
}

function normalizeAllObjectCoords(target: fabric.ActiveSelection | fabric.Object, action: string) {
  console.log('normalizeAllObjectCoords')
  const isSelection = target?.type === "activeSelection"
  if (isSelection) return
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
            case "CRect":
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
  console.log(target.width)
}

function saturateFabricCanvasFromFlatMapSceneState(fabricCanvas: fabric.Canvas, flatMap: ProjectDataTypes['globalObjects']) {

}



export {
  flatMapFabricSceneState,
  normalizeAllObjectCoords
}
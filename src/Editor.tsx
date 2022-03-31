import { fabric } from "fabric";
import React, { Component } from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import { ScenesPane } from "./ScenesPane/ScenesPane";
import CanvasPane from "./CanvasPane/CanvasPane";
import { InspectorContainer } from "./InspectorPane/InspectorContainer";

import "./styles.css";
import "react-reflex/styles.css";
import "./dark.css";
import { LayersPaneContainer } from "./LayersPane/LayersPaneContainer";
// import { debounce } from "./Utils/debounce";
import { throttle } from "./Utils/throttle";
import { ToolbarContainer } from "./Toolbar/ToolbarContainer";

import { SizeType } from "antd/lib/config-provider/SizeContext";
// import { SceneType } from "./Types/sceneType";
import { setFabricDefaults } from "./Utils/SetFabricDefaults";
import { ProjectDataTypes, SceneType, UndoHistoryEntry } from "./Types/ProjectDataTypes";
import {
  CustomFabricCircle,
  CustomFabricGroup,
  CustomFabricObject,
} from "./Types/CustomFabricTypes";
// import { ProjectDataStateTypes } from "./AppController";

import { diff } from "./Utils/diff";
import { ActiveSelection, IEvent } from "fabric/fabric-impl";
import { Modal } from "antd";
import { v4 as uuidv4 } from 'uuid';
import { flatMapFabricSceneState, normalizeAllObjectCoords } from "./Utils/flatMapFabricState";
import { editorContext, EditorContextTypes, EditorStateTypes } from "./EditorContext";
import { rgbaFromColor } from "./Utils/rgbaFromColor";
import { tsIntrinsicKeyword } from "@babel/types";

setFabricDefaults();

interface EditorPropsTypes {
  project: ProjectDataTypes;
}



class Editor extends Component<EditorPropsTypes, EditorStateTypes> {
  fabricCanvas: fabric.Canvas | null;
  throttledSetNewCanvasPaneDimensions: Function;
  liveObjectsDict: { [key: string]: fabric.Object };

  constructor(props: EditorPropsTypes) {
    super(props);
    this.fabricCanvas = null;
    this.liveObjectsDict = {};
    this.throttledSetNewCanvasPaneDimensions = throttle(
      this.setNewCanvasPanelDimensions,
      300
    );
    this.state = {
      tick: true,
      isInitted: false,
      project: props.project,
      activeSceneIndex: 0,
      antdSize: "small" as SizeType,
      gridCoords: {
        width: 16,
        height: 9,
        left: -16,
        top: -9
      }
    };
  }

  setActiveSceneIndex = (newSceneIndex: number) => {
    //not unselecting active object can create issues when a group is selected and scene changed
    if (this.fabricCanvas?.getActiveObject()?.type === "activeSelection") this.fabricCanvas!.discardActiveObject();
    this.renderActiveScene(newSceneIndex);
    this.fabricCanvas?.requestRenderAll();
    return this.setState({ activeSceneIndex: newSceneIndex });
  };

  renderActiveScene = (renderScreenIndex: number) => {
    //Get current scene
    const currentSceneObject = this.state.project.scenes[renderScreenIndex];
    // For each object in active scene
    for (const [uniqueGlobalId, sceneObjectOptions] of Object.entries(
      currentSceneObject.activeSceneObjects
    )) {
      const currentObject = this.liveObjectsDict[uniqueGlobalId];
      const globalObjectSettings: {} =
        this.state.project.globalObjects[uniqueGlobalId];

      currentObject
        .set(globalObjectSettings) //Reset to global settings
        .set(sceneObjectOptions) // Set specific scene options
        .setCoords();
    }
  };

  objectsToSelectFromGUIDs = (GUIDs: string | Array<string>) => {
    if (typeof (GUIDs) === "string") {
      const GUID = GUIDs
      const selectedObject = this.liveObjectsDict[GUID] as CustomFabricObject

      let allChildrenAndSelection = new Set<CustomFabricObject>()
      if (selectedObject?.parentGUID) {
        const tallestParent = this.recursivelyFindTallestParent(selectedObject)
        const recursivelyFindAllChildren = (parentObject: CustomFabricObject) => {
          allChildrenAndSelection.add(parentObject)
          if (!parentObject?.members) return
          for (const childObjectGUID of parentObject.members) {
            const childObject = this.liveObjectsDict[childObjectGUID] as CustomFabricObject
            recursivelyFindAllChildren(childObject)
          }
        }
        recursivelyFindAllChildren(tallestParent)
      }

      const allChildrenAndSelectionArray = Array.from(allChildrenAndSelection)
      return allChildrenAndSelectionArray
    } else {

    }

  }

  initFabricCanvas = (
    domCanvas: HTMLCanvasElement,
    canvasPaneDimensions: { width: number; height: number },
    attatchLocalEvents: Function
  ) => {
    const projectDimensions = this.state.project.settings.dimensions;
    const c = (this.fabricCanvas = new fabric.Canvas(domCanvas, {
      // backgroundColor: "#141414",
      width: canvasPaneDimensions.width,
      height: canvasPaneDimensions.height,
      preserveObjectStacking: true
    }));
    // Center the project viewport withing the full-Pane-Sized fabricCanvas
    const widthMove = (canvasPaneDimensions.width - projectDimensions.width) / 2;
    const heightMove = (canvasPaneDimensions.height - projectDimensions.height) / 2;
    const vpt = c?.viewportTransform || [];
    vpt[4] = widthMove;
    vpt[5] = heightMove;
    c.setViewportTransform(vpt);

    this.fabricCanvas.on("after:render", throttle(this.updateTick, 100));

    // Attach events local to the canvas pane like zoom and drag
    // so that dom updates on those nodes can be very surgical
    attatchLocalEvents(this.fabricCanvas)
    // CANVAS EVENT HOOKS
    // React state tick on render

    this.fabricCanvas.on("object:modified", (e: any) => {
      console.log("object:modfied", e);
      normalizeAllObjectCoords(e.target, e.action)
      return this.normalizeNewSceneState(`object:modified: action: ${e.action}, name: ${e.target?.userSetName || e.target.type}`)
    });

    this.fabricCanvas.on("selection:cleared", (e) => {
      console.log("selection:cleared", e)
    })

    this.fabricCanvas.on("mouse:down:before", (e: any) => {
      console.log("mouse:down:before", e)
      if (e?.target?.parentGUID) {
        e.target.selectable = false
        const selectedObject = e.target
        const selectedObjectFamily = this.objectsToSelectFromGUIDs(selectedObject.uniqueGlobalId) as Array<CustomFabricObject>
        const newActiveSelection = new fabric.ActiveSelection(selectedObjectFamily, { canvas: this.fabricCanvas as fabric.Canvas })
        this.fabricCanvas
          ?.setActiveObject(newActiveSelection)
          .renderAll()
      }
    })

    // if (e?.target) {
    //   const selectedObject = e.target
    //   let allChildrenAndSelection = new Set<CustomFabricObject>()
    //   if (selectedObject?.parentGUID) {
    //     const tallestParent = this.recursivelyFindTallestParent(selectedObject)
    //     const recursivelyFindAllChildren = (parentObject: CustomFabricObject) => {
    //       allChildrenAndSelection.add(parentObject)
    //       if (!parentObject?.members) return
    //       for (const childObjectGUID of parentObject.members) {
    //         const childObject = this.liveObjectsDict[childObjectGUID] as CustomFabricObject
    //         recursivelyFindAllChildren(childObject)
    //       }
    //     }
    //     recursivelyFindAllChildren(tallestParent)
    //   }

    //   const allChildrenAndSelectionArray = Array.from(allChildrenAndSelection)
    //   if (allChildrenAndSelectionArray.length > 1) {
    //     this.fabricCanvas
    //       ?.setActiveObject(e.target)
    //       .renderAll()
    //   } else {
    //     console.log({ allChildrenAndSelectionArray })
    //     const newActiveSelection = new fabric.ActiveSelection(allChildrenAndSelectionArray, { canvas: this.fabricCanvas as fabric.Canvas })

    //     this.activeSelectionStore = newActiveSelection
    //     // this.fabricCanvas
    //     //   ?.setActiveObject(newActiveSelection)
    //     //   .renderAll()
    //   }


    //   //this.fabricCanvas?.setActiveObject(e.target)

    //   // this.fabricCanvas
    //   //   ?.setActiveObject(e.target)
    //   //   .requestRenderAll()
    //   //   // .fire("selection:created", {e:e, selected: [e.target]})
    // }


    this.fabricCanvas.on("selection:updated", (e: any) => {
      console.log("selection:updated", e)
    })
    this.fabricCanvas.on("selection:created", (e: any) => {
      console.log("selection:created", e)
      // // //TODO: FIX CODE DUPLICATION
      // const currentActiveSelection = this.fabricCanvas?.getActiveObject()! as fabric.ActiveSelection | CustomFabricObject

      // // If it's an active selection
      // if (currentActiveSelection instanceof fabric.ActiveSelection) {
      //   const currentActiveSelectionObjects = currentActiveSelection.getObjects() as Array<CustomFabricObject>
      //   // Finds the top parent and recursively goes down and adds all its children and children's children
      //   // TODO: This can be optimised by setting a flag once the top parent has been found and children added
      //   // This is because the top parent has all children underneath it so if you find it once you find all children
      //   // If the object has no parents it needs to be added to the group since it's part of the selection
      //   let allChildrenAndSelection = new Set<CustomFabricObject>()
      //   for (const selectedObject of currentActiveSelectionObjects) {
      //     if (selectedObject?.parentGUID) {
      //       const tallestParent = this.recursivelyFindTallestParent(selectedObject)
      //       const recursivelyFindAllChildren = (parentObject: CustomFabricObject) => {
      //         allChildrenAndSelection.add(parentObject)
      //         if (!parentObject?.members) return
      //         for (const childObjectGUID of parentObject.members) {
      //           const childObject = this.liveObjectsDict[childObjectGUID] as CustomFabricObject
      //           recursivelyFindAllChildren(childObject)
      //         }
      //       }
      //       recursivelyFindAllChildren(tallestParent)
      //     } else {
      //       allChildrenAndSelection.add(selectedObject)
      //     }
      //   }

      //   const allChildrenAndSelectionArray = Array.from(allChildrenAndSelection)
      //   const objectGUIDsInActiveSelection = currentActiveSelectionObjects.map(e => e.uniqueGlobalId)

      //   for (const obj of allChildrenAndSelectionArray) {
      //     //make sure we're not adding elements that are already in the selection
      //     if (!objectGUIDsInActiveSelection.includes(obj.uniqueGlobalId)) {
      //       currentActiveSelection.addWithUpdate(obj)
      //     }
      //   }
      //   //If it's a selection of a single object
      // } else {
      //   const selectedObject = currentActiveSelection
      //   let allChildrenAndSelection = new Set<CustomFabricObject>()
      //   if (selectedObject?.parentGUID) {
      //     const tallestParent = this.recursivelyFindTallestParent(selectedObject)
      //     const recursivelyFindAllChildren = (parentObject: CustomFabricObject) => {
      //       allChildrenAndSelection.add(parentObject)
      //       if (!parentObject?.members) return
      //       for (const childObjectGUID of parentObject.members) {
      //         const childObject = this.liveObjectsDict[childObjectGUID] as CustomFabricObject
      //         recursivelyFindAllChildren(childObject)
      //       }
      //     }
      //     recursivelyFindAllChildren(tallestParent)
      //   } else {
      //     allChildrenAndSelection.add(selectedObject)
      //   }

      //   //only change selection if the total selection is more than 1 (otherwise we stay with the same obj selected)
      //   const allChildrenAndSelectionArray = Array.from(allChildrenAndSelection)
      //   if (allChildrenAndSelectionArray.length > 1) {
      //     const newActiveSelection = new fabric.ActiveSelection(allChildrenAndSelectionArray, { canvas: this.fabricCanvas as fabric.Canvas })
      //     this.fabricCanvas?.setActiveObject(newActiveSelection)
      //   }

      // }
      // this.fabricCanvas?.renderAll()
    })


    // Init complete editor state
    const json: any = {
      objects: Object.values(this.state.project.globalObjects),
    };
    this.fabricCanvas.loadFromJSON(
      json,
      () => {
        // this.initViewportRect();
        this.renderActiveScene(this.state.activeSceneIndex);
        this.fabricCanvas?.requestRenderAll();
      },
      (options: any, object: any, a: any) => {
        this.liveObjectsDict[options.uniqueGlobalId] = object;
      }
    );

    return this.setState({ isInitted: true });
  };

  // initViewportRect = () => {
  //   const viewportRect = new fabric.Rect({
  //     width: this.state.project.settings.dimensions.width,
  //     height: this.state.project.settings.dimensions.height,
  //     fill: undefined,
  //     stroke: "blue",
  //     strokeWidth: 1,
  //     strokeDashArray: [11, 8],
  //     selectable: false,
  //     evented: false,
  //     objectCaching: false
  //   }) as CustomFabricObject
  //   viewportRect.set({ uniqueGlobalId: 'viewBoxRect' })

  //   if (this.fabricCanvas) {
  //     this.fabricCanvas.add(viewportRect).sendToBack(viewportRect);
  //   }
  // };

  updateCanvasPaneDimensions = (newDimensions: fabric.ICanvasDimensions) => {
    return this.throttledSetNewCanvasPaneDimensions(newDimensions);
  };

  setNewCanvasPanelDimensions = (newDimensions: fabric.ICanvasDimensions) => {
    this.fabricCanvas?.setDimensions(newDimensions);
  };

  updateTick = () => this.setState({ tick: !this.state.tick });

  handleAddRect = () => {
    this.fabricCanvas?.add(
      new fabric.Rect({
        width: 150,
        height: 20,
        fill: "purple",
      })
    );
  };
  setOnGlobalObject = (obj: CustomFabricObject, settings: {}) => {
    if (obj) {
      // get active scene and options for object in active scene then add/modify corresponding setting to value
      const activeScene = this.state.project.scenes[this.state.activeSceneIndex];
      let currentOptions = activeScene.activeSceneObjects[obj.uniqueGlobalId];
      let newSettings = { ...currentOptions, ...settings };

      const newSceneActiveObjectsObject = {
        ...activeScene.activeSceneObjects,
        [obj.uniqueGlobalId]: newSettings,
      };

      return this.setState({
        project: {
          ...this.state.project,
          scenes: this.state.project.scenes.map(
            (currSceneObject: SceneType, currScreenIndex: number) => {
              if (currScreenIndex !== this.state.activeSceneIndex)
                return currSceneObject;
              return {
                ...currSceneObject,
                activeSceneObjects: newSceneActiveObjectsObject,
              };
            }
          ),
        },
      });
    }
  };

  setOnFabricObject = (obj: CustomFabricObject, settings: {}) => {
    if (obj) {
      this.setOnGlobalObject(obj, settings);
      obj.set(settings);
      obj.setCoords();
      obj?.canvas?.renderAll();
    }
  };

  //Recursively move up to each parent until there are no more parents and return that GUID
  recursivelyFindTallestParent = (obj: CustomFabricObject): CustomFabricObject => {
    if (obj?.parentGUID) {
      const parentObject = this.liveObjectsDict[obj.parentGUID] as CustomFabricObject
      return this.recursivelyFindTallestParent(parentObject)
    } else {
      return obj
    }
  }

  handleGroupObjects = () => {
    const selection: fabric.Object | fabric.ActiveSelection | undefined = this.fabricCanvas?.getActiveObject()
    if (selection?.type !== 'activeSelection') return Modal.warn({ content: 'GIVE ME A GROUPABLE' })

    if (selection instanceof fabric.ActiveSelection) {
      const newGroupGUID = uuidv4() //GUID of new group
      const selectionObjects = selection.getObjects() as Array<CustomFabricObject> // Currently selected objects
      let objectGUIDsToAssignParent = new Set<string>() // All the GUIDs which will have this new group as parent

      for (let obj of selectionObjects) {

        // Add tallest parent to collection of GUIDs to assign new group as parent to
        const tallestParent = this.recursivelyFindTallestParent(obj)
        const tallestparentGUID = tallestParent.uniqueGlobalId as string
        objectGUIDsToAssignParent.add(tallestparentGUID)
      }

      //Convert to array for iteration
      const objectGUIDsToAssignParentArray = Array.from(objectGUIDsToAssignParent)

      // Assign new group as parent to each top-level child
      for (const objectGUID of objectGUIDsToAssignParentArray) {
        const obj = this.liveObjectsDict[objectGUID] as CustomFabricObject
        obj.parentGUID = newGroupGUID
      }

      // Create new rect to signify group
      const groupRect = new fabric.Rect({
        width: selection.width,
        height: selection.height,
        top: selection.top,
        left: selection.left,
        selectable: false,
        evented: false,
        fill: "rgba(255, 0, 0, 0.5)"
      })
      const activeGroupRect = groupRect as CustomFabricObject
      activeGroupRect.set({
        uniqueGlobalId: newGroupGUID,
        members: objectGUIDsToAssignParentArray //List of objects to assignt this as parent to is same as list of children
      })

      this.liveObjectsDict[newGroupGUID] = activeGroupRect

      this.fabricCanvas
        ?.add(groupRect)
        .renderAll()
        .fire("object:modified", {
          action: "group",
          target: {
            type: "group"
          }
        })
    }
  }

  normalizeNewSceneState = (reasonForUpdate?: string) => {
    const { activeSceneIndex } = this.state
    const activeObject = this.fabricCanvas?.getActiveObject() as CustomFabricObject | fabric.ActiveSelection | undefined
    let selectedGUIDs = []

    //Tracking selection state of canvas along with canvas state
    if (activeObject && !(activeObject instanceof fabric.ActiveSelection)) {
      selectedGUIDs.push(activeObject?.uniqueGlobalId)
    } else {
      const allSelectedObjects = activeObject?.getObjects() as Array<CustomFabricObject>
      allSelectedObjects?.forEach(obj => selectedGUIDs.push(obj.uniqueGlobalId))
    }
    // console.log(`normalizeNewSceneState: reasonForUpdate: ${reasonForUpdate || 'No reason given'}`)
    console.log(`SETTING SELECTED GUIDs: `, selectedGUIDs)
    const newFabricState = this.fabricCanvas?.toObject(['uniqueGlobalId', 'userSetName', 'firstOccurrenceIndex', 'objectIndex', 'members', 'parentGUID'])
    const newFlatMappedFabricState = flatMapFabricSceneState(newFabricState)
    console.log({ newFlatMappedFabricState })
    const newUndoEntryObject: UndoHistoryEntry = {
      selectedGUIDs,
      objectStates: newFlatMappedFabricState
    }

    const newSceneObj = {
      ...this.activeSceneObject,
      undoHistory: this.activeSceneObject.undoHistory.concat(newUndoEntryObject)
    }
    const newScenesArray = this.state.project.scenes.map(
      (sceneObj, sceneIndex) => sceneIndex !== activeSceneIndex
        ? sceneObj
        : newSceneObj
    )

    return this.setState({
      project: {
        ...this.state.project,
        scenes: newScenesArray
      }
    })
  }

  /**
   * THE CONVENTION OF OUR DATA STATE
   * Currenttly a flat mapped copy of the CURRENT scene state is always the LAST entry in the undoHistory array
   * on the scene object.
   * This allows us to implemenet undo by looking for a state 2 from the end, and pushing the last undo state (our current before the undo action)
   * to the redo array, ready be re-set as current by any redo request
   */
  handleUndo = () => {
    this.fabricCanvas?.discardActiveObject()
    this.fabricCanvas?.renderAll()
    const { activeSceneIndex } = this.state
    const stateToAddToRedo: UndoHistoryEntry = this.activeSceneObject.undoHistory[this.activeSceneObject.undoHistory.length - 1]
    const stateToUndoTo: UndoHistoryEntry = this.activeSceneObject.undoHistory[this.activeSceneObject.undoHistory.length - 2]
    if (!stateToAddToRedo) return Modal.warn({ content: `You've got nothing to undo!` })

    let newUndoHistoryArray = [...this.activeSceneObject.undoHistory]
    let newRedoHistoryArray = [...this.activeSceneObject.redoHistory]
    let useStateToSaturate: UndoHistoryEntry['objectStates']
    if (stateToUndoTo === undefined) {
      // Also pop current state to redo
      newRedoHistoryArray.push(stateToAddToRedo)
      newUndoHistoryArray.pop()
      useStateToSaturate = this.activeSceneObject.activeSceneObjects as UndoHistoryEntry['objectStates']
    } else {
      // Here we will push the new states to redo as well as pop of the undo state to current
      newRedoHistoryArray.push(stateToAddToRedo)
      newUndoHistoryArray.pop()
      useStateToSaturate = stateToUndoTo.objectStates
    }

    // console.log('handleUndo: ', { useStateToSaturate, newRedoHistoryArray, newUndoHistoryArray })

    // Saturate fabric in memory state and commit changes to acrtivescene object to react state
    // console.log(`🥶 SATURATION`)
    const selectedGUIDsArray = stateToAddToRedo?.selectedGUIDs || []
    const fabricObjects = this.fabricCanvas?.getObjects() as Array<CustomFabricObject>
    let selectedObjects: Array<CustomFabricObject> = []
    fabricObjects.forEach(obj => {
      const settingsToSetTo = useStateToSaturate[obj.uniqueGlobalId]
      console.log({ settingsToSetTo })
      obj.set(settingsToSetTo).setCoords()
      if (selectedGUIDsArray.includes(obj.uniqueGlobalId)) {
        selectedObjects.push(obj)
      }
    })


    if (selectedObjects?.length) {
      if (selectedGUIDsArray.length === 1) {
        this.fabricCanvas?.setActiveObject(selectedObjects[0])
      } else {
        let newSelection = new fabric.ActiveSelection(selectedObjects, { canvas: this.fabricCanvas as fabric.Canvas })
        this.fabricCanvas?.setActiveObject(newSelection)
      }
    }
    this.fabricCanvas?.requestRenderAll()

    // Update the react state
    const newSceneObject = {
      ...this.activeSceneObject,
      undoHistory: newUndoHistoryArray,
      redoHistory: newRedoHistoryArray
    }
    return this.setState({
      project: {
        ...this.state.project,
        scenes: this.state.project.scenes.map((sceneObj, currSceneIndex) => (
          currSceneIndex !== activeSceneIndex ? sceneObj : newSceneObject
        ))
      }
    })
  }

  handleRedo = () => {
    this.fabricCanvas?.discardActiveObject()
    this.fabricCanvas?.renderAll()
    const { activeSceneIndex } = this.state
    if (!this.activeSceneObject.redoHistory.length) return Modal.warn({ content: 'You have nothing to redo' })
    const stateToAddToUndo: UndoHistoryEntry = this.activeSceneObject.redoHistory[this.activeSceneObject.redoHistory.length - 1]
    let newUndoHistoryArray = [...this.activeSceneObject.undoHistory]
    let newRedoHistoryArray = [...this.activeSceneObject.redoHistory]
    const stateToRedoTo = newRedoHistoryArray.pop()

    let useStateToSaturate: UndoHistoryEntry['objectStates']
    if (stateToRedoTo === undefined) {
      // Also pop current state to redo
      newUndoHistoryArray.push(stateToAddToUndo)
      useStateToSaturate = this.activeSceneObject.activeSceneObjects as UndoHistoryEntry['objectStates']
    } else {
      // Here we will push the new states to redo as well as pop of the undo state to current
      newUndoHistoryArray.push(stateToAddToUndo)
      useStateToSaturate = stateToRedoTo.objectStates
    }

    // Saturate fabric in memory state and commit changes to acrtivescene object to react state
    // console.log(`🥶 SATURATION`)
    const selectedGUIDsArray = stateToAddToUndo?.selectedGUIDs || []
    const fabricObjects = this.fabricCanvas?.getObjects() as Array<CustomFabricObject>
    let selectedObjects: Array<CustomFabricObject> = []
    fabricObjects.forEach(obj => {
      const settingsToSetTo = useStateToSaturate[obj.uniqueGlobalId]
      obj.set(settingsToSetTo).setCoords()
      if (selectedGUIDsArray.includes(obj.uniqueGlobalId)) {
        selectedObjects.push(obj)
      }
    })

    if (selectedObjects?.length) {
      if (selectedGUIDsArray.length === 1) {
        this.fabricCanvas?.setActiveObject(selectedObjects[0])
      } else {
        let newSelection = new fabric.ActiveSelection(selectedObjects, { canvas: this.fabricCanvas as fabric.Canvas })
        this.fabricCanvas?.setActiveObject(newSelection)
      }
    }
    this.fabricCanvas?.requestRenderAll()

    // Update the react state
    const newSceneObject = {
      ...this.activeSceneObject,
      undoHistory: newUndoHistoryArray,
      redoHistory: newRedoHistoryArray
    }
    return this.setState({
      project: {
        ...this.state.project,
        scenes: this.state.project.scenes.map((sceneObj, currSceneIndex) => (
          currSceneIndex !== activeSceneIndex ? sceneObj : newSceneObject
        ))
      }
    })
  }

  get activeSceneObject() {
    return this.state.project.scenes[this.state.activeSceneIndex]
  }

  render() {
    const contextValue: EditorContextTypes = {
      fabricCanvas: this.fabricCanvas,
      state: this.state,
      handleAddRect: this.handleAddRect,
      setOnFabricObject: this.setOnFabricObject,
      setOnGlobalObject: this.setOnGlobalObject,
      setActiveSceneIndex: this.setActiveSceneIndex,
      handleGroupObjects: this.handleGroupObjects,
      handleUndo: this.handleUndo,
      handleRedo: this.handleRedo
    };
    return (
      <div>
        <editorContext.Provider value={contextValue}>
          <ReflexContainer
            orientation="vertical"
            style={{ width: "100vw", height: "100vh" }}
          >
            <ReflexElement minSize={100} maxSize={250} size={180}>
              <ScenesPane />
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
              <ReflexContainer orientation="horizontal">
                <ReflexElement size={50}>
                  <ToolbarContainer />
                </ReflexElement>
                <ReflexElement>
                  <ReflexContainer orientation="vertical">
                    <ReflexElement size={200} minSize={200} maxSize={400}>
                      <LayersPaneContainer />
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement
                      propagateDimensions={true}
                      propagateDimensionsRate={1}
                    >
                      <CanvasPane
                        initFabricCanvas={this.initFabricCanvas}
                        updateCanvasPaneDimensions={
                          this.updateCanvasPaneDimensions
                        }
                        dimensions={{ width: 100, height: 100 }}
                      />
                    </ReflexElement>
                    <ReflexElement size={300}>
                      <InspectorContainer />
                    </ReflexElement>
                  </ReflexContainer>
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
          </ReflexContainer>
        </editorContext.Provider>
      </div>
    );
  }
}

export { Editor, editorContext };
export type { EditorContextTypes };

/*
// ------------------------------------------------------------------------
      // Calculate modifications, push to scene objects and undo history
      // ------------------------------------------------------------------------

      //Unselect on canvas if ActiveSelection to get get Absolute position
      if (isSelection) this.fabricCanvas!.discardActiveObject()

      // Old Scene State is global state of objects in scene + current state in scene (activeSceneObjects)
      let oldSceneState = { ...this.state.project.scenes[this.state.activeSceneIndex].activeSceneObjects }
      for (const uniqueGlobalId in oldSceneState) {
        oldSceneState[uniqueGlobalId] = { // Combine:
          ...this.state.project.globalObjects[uniqueGlobalId], // Global settings +
          ...oldSceneState[uniqueGlobalId] // Scene settings
        }
      }

      // Grab current objects and then run toObject on them while keeping custom attributes
      const currentObjects = this.fabricCanvas!.getObjects() as Array<CustomFabricObject>;
      const currentObjectsJson = currentObjects.map((obj) => {
        obj.includeDefaultValues = false; // TODO: this will go somewhere as a global setting on all fabric objects but keeping it here for testing
        return obj.toObject([
          "uniqueGlobalId",
          "userSetName",
          "firstOccurrenceIndex",
        ]);
      });
      // create newSceneState out of current objects array by putting it in key-value pairs of {uniqueGlobalId: {settings}}
      let newSceneState = {} as { [key: string]: fabric.IObjectOptions };
      for (const obj of currentObjectsJson) {
        if (obj.uniqueGlobalId) newSceneState[obj.uniqueGlobalId] = obj;
      }

      // Diffing oldSceneState with newSceneState
      const deltaSettings = diff(oldSceneState, newSceneState)
      console.log("diff", deltaSettings)

      // reselect on canvas if activeSelection
      if (isSelection) {
        const reselection = new fabric.ActiveSelection(e.target.getObjects(), {
          canvas: this.fabricCanvas as fabric.Canvas,
        });
        this.fabricCanvas?.setActiveObject(reselection);
        this.fabricCanvas?.requestRenderAll();
      }

      // Set to Scene objects
      // TODO: Rename setonglobalobject to setonobjectinactivescene?
      for (const [uniqueGlobalId, settings] of Object.entries(deltaSettings)) {
        this.setOnGlobalObject(
          this.state.project.globalObjects[uniqueGlobalId] as CustomFabricObject,
          settings as {}
        )
      }

      //TODO: PUSH deltaSettings straight to undo history with e.action as name/type of action */
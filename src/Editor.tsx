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
import { customAttributesToIncludeInFabricCanvasToObject } from './Utils/consts'
import { ToolbarContainer } from "./Toolbar/ToolbarContainer";

import { SizeType } from "antd/lib/config-provider/SizeContext";
// import { SceneType } from "./Types/sceneType";
import { setFabricDefaults } from "./Utils/SetFabricDefaults";
import { ProjectDataTypes, SceneType, UndoHistoryEntry } from "./Types/ProjectDataTypes";
import {
  CustomFabricCircle,
  CustomFabricGroup,
  CustomFabricObject,
  CustomFabricOptions,
  SimpleSpread,
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
import { CustomFabricCanvas } from "./Utils/CustomFabricCanvas";
import { IProjectControllerState, ProjectController } from "./ProjectController";
import { MultiChoiceLabelEditorComponent } from "./CustomInteractionModules/MultiChoiceLabel/EditorComponent";
import { EditorComponentClass } from "./CustomInteractionModules/EditorComponentClass";

setFabricDefaults();

interface EditorPropsTypes {
  project: IProjectControllerState['project'];
  activeSceneIndexs: IProjectControllerState['activeSceneIndexs'],
  setActiveSceneIndex: ProjectController['setActiveSceneIndex'],
  handleFabricMountConfirmed: ProjectController['handleFabricMountConfirmed'],
  liveObjectsDict: ProjectController['liveObjectsDict']
  liveObjectScenesReferences: ProjectController['liveObjectScenesReferences']
  handleRequestDeleteObject: Function,
  handleGroupObjects: ProjectController['handleGroupObjects'],
  handleAddObject: ProjectController['handleAddObject'],
  handleDuplicateScene: ProjectController['handleDuplicateScene'],
  handleOpenProjectPreview: ProjectController['handleOpenProjectPreview'],
}

const availiableCustomInteractionModules = {
  'multichoicelabel': MultiChoiceLabelEditorComponent
}

class Editor extends Component<EditorPropsTypes, EditorStateTypes> {
  fabricCanvas: CustomFabricCanvas | null;
  throttledSetNewCanvasPaneDimensions: Function;
  orderedSelectionGUIDs: Set<string>
  constructor(props: EditorPropsTypes) {
    super(props);
    this.fabricCanvas = null;
    this.throttledSetNewCanvasPaneDimensions = throttle(
      this.setNewCanvasPanelDimensions,
      300
    );
    this.orderedSelectionGUIDs = new Set()
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
      },
      selectedGUIDsDict: {}
    };
  }

  get liveObjectsDict() {
    return this.props.liveObjectsDict
  }

  componentDidMount() {
    window.addEventListener('drop', this.handleWindowImageDrop, false)
  }

  sanitizeEquations = (obj: CustomFabricObject, action: string) => {
    switch (action) {
      case "scale":
        obj.widthEquation = undefined
        obj.heightEquation = undefined
        break
      case "scaleX":
        obj.widthEquation = undefined
        break
      case "scaleY":
        obj.heightEquation = undefined
        break
      default:
        break
    }
  }

  initFabricCanvas = (
    domCanvas: HTMLCanvasElement,
    canvasPaneDimensions: { width: number; height: number },
    attatchLocalEvents: Function
  ) => {
    const projectDimensions = this.state.project.settings.dimensions;
    this.fabricCanvas = new CustomFabricCanvas(domCanvas, {
      ...canvasPaneDimensions,
      preserveObjectStacking: true
    })
    // this.fabricCanvas.renderOnAddRemove = false
    // Give the fabricCanvas a reference to our inMemoryObjectDict
    this.fabricCanvas.liveObjectsDict = this.liveObjectsDict
    this.fabricCanvas.projectSettings = this.props.project.settings
    // Center the project viewport withing the full-Pane-Sized fabricCanvas
    const widthMove = (canvasPaneDimensions.width - projectDimensions.width) / 2;
    const heightMove = (canvasPaneDimensions.height - projectDimensions.height) / 2;
    const vpt = this.fabricCanvas?.viewportTransform || [];
    vpt[4] = widthMove;
    vpt[5] = heightMove;
    this.fabricCanvas.setViewportTransform(vpt);

    // Tick the react state throttled on every render
    this.fabricCanvas.on("after:render", throttle(this.updateTick, 100));
    // Attach events local to the canvas pane like zoom and drag
    // so that dom updates on those nodes can be very surgical
    attatchLocalEvents(this.fabricCanvas)

    // CANVAS EVENT HOOKS
    this.fabricCanvas.on("object:modified", (e: any) => {
      console.log("object:modified", e)
      normalizeAllObjectCoords(e.target, e.action)
      // if (!e?.customFire) this.sanitizeEquations(e.target, e.action)
      // return this.normalizeNewSceneState(`object:modified: action: ${e.action}, name: ${e.target?.userSetName || e.target.type}`)
    });

    this.fabricCanvas.on("custom:object:modify", (e: any) => {
      this.setOnFabricObject(e.target, e.settings, e.action)
    });

    //Update gradient angle controls on selection
    this.fabricCanvas.on("selection:created", (e:any) => {
      if(e.selected.length === 1) {
        const selection = e.selected[0]
        if(selection?.linearGradientMode || selection?.radialGradientMode ) selection.refreshGradientAngleControls()
      }
    })
      this.fabricCanvas.on("selection:updated", (e:any) => {
        if(e.selected.length === 1) {
          const selection = e.selected[0]
          if(selection?.linearGradientMode || selection?.radialGradientMode ) selection.refreshGradientAngleControls()
        }
      })

    this.fabricCanvas.on("selection:created", this.selectionCreated)
    this.fabricCanvas.on("selection:updated", this.selectionUpdated)
    this.fabricCanvas.on("selection:cleared", this.selectionCleared)

    // Init complete editor state
    this.props.handleFabricMountConfirmed()

    // return this.setState({ isInitted: false });
  }

  updateCanvasPaneDimensions = (newDimensions: fabric.ICanvasDimensions) => {
    return this.throttledSetNewCanvasPaneDimensions(newDimensions);
  }

  setNewCanvasPanelDimensions = (newDimensions: fabric.ICanvasDimensions) => {
    this.fabricCanvas?.setDimensions(newDimensions);
  }

  updateTick = () => this.setState({ tick: !this.state.tick });

  // SELECTION ORDER TRACKING
  selectionCreated = (e: any) => {
    let newSelectedGUIDsDict: { [key: string]: boolean } = {}
    const selected: Array<CustomFabricObject> = e.selected
    selected.forEach(obj => {
      this.orderedSelectionGUIDs.add(obj.guid)
      newSelectedGUIDsDict[obj.guid] = true
    })
    return this.setState(prev => ({ selectedGUIDsDict: newSelectedGUIDsDict }))
  }
  selectionUpdated = (e: any) => {
    let newSelectedGUIDsDict = { ...this.state.selectedGUIDsDict }
    const selected: Array<CustomFabricObject> = e.selected
    selected.forEach(obj => {
      this.orderedSelectionGUIDs.add(obj.guid)
      newSelectedGUIDsDict[obj.guid] = true
    })
    const deselected: Array<CustomFabricObject> = e.deselected
    deselected.forEach(obj => {
      this.orderedSelectionGUIDs.delete(obj.guid)
      newSelectedGUIDsDict[obj.guid] = false
    })
    return this.setState(prev => ({ selectedGUIDsDict: newSelectedGUIDsDict }))
  }
  selectionCleared = (e: any) => {
    this.orderedSelectionGUIDs.clear()
    return this.setState(prev => ({ selectedGUIDsDict: {} }))
  }

  setOnGlobalObject = (obj: CustomFabricObject, settings: {}) => {
    if (obj) {
      // get active scene and options for object in active scene then add/modify corresponding setting to value
      const activeScene = this.state.project.scenes[this.state.activeSceneIndex];
      let currentOptions = activeScene.activeSceneObjects[obj.guid];
      let newSettings = { ...currentOptions, ...settings };

      const newSceneActiveObjectsObject = {
        ...activeScene.activeSceneObjects,
        [obj.guid]: newSettings,
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

  setOnFabricObject = (obj: CustomFabricObject, settings: {}, action: string) => {
    this.setOnGlobalObject(obj, settings);
    obj.set(settings);
    obj.setCoords();
    this.fabricCanvas?.requestRenderAll();
    this.fabricCanvas?.fire("object:modified", {
      action: action,
      target: obj,
      customFire: true
    })
  };

  //Recursively move up to each parent until there are no more parents and return that GUID
  recursivelyFindTallestParent = (obj: CustomFabricObject): CustomFabricObject => {
    if (obj?.parentID) {
      const parentObject = this.liveObjectsDict[obj.parentID] as CustomFabricObject
      return this.recursivelyFindTallestParent(parentObject)
    } else {
      return obj
    }
  }

  // normalizeNewSceneState = (reasonForUpdate?: string) => {
  //   const { activeSceneIndex } = this.state
  //   const activeObject = this.fabricCanvas?.getActiveObject() as CustomFabricObject | fabric.ActiveSelection | undefined

  //   //Tracking selection state of canvas along with canvas state
  //   let selectedGUIDs = []
  //   if (activeObject && !(activeObject instanceof fabric.ActiveSelection)) {
  //     selectedGUIDs.push(activeObject?.guid)
  //   } else {
  //     const allSelectedObjects = activeObject?.getObjects() as Array<CustomFabricObject>
  //     allSelectedObjects?.forEach(obj => selectedGUIDs.push(obj.guid))
  //   }
  //   const newFabricState = this.fabricCanvas?.toObject(customAttributesToIncludeInFabricCanvasToObject)
  //   const newFlatMappedFabricState = flatMapFabricSceneState(newFabricState)

  //   const newUndoEntryObject: UndoHistoryEntry = {
  //     selectedGUIDs,
  //     objectStates: newFlatMappedFabricState
  //   }

  //   const newSceneObj = {
  //     ...this.activeSceneObject,
  //     undoHistory: this.activeSceneObject.undoHistory.concat(newUndoEntryObject)
  //   }
  //   const newScenesArray = this.state.project.scenes.map(
  //     (sceneObj, sceneIndex) => sceneIndex !== activeSceneIndex
  //       ? sceneObj
  //       : newSceneObj
  //   )

  //   return this.setState({
  //     project: {
  //       ...this.state.project,
  //       scenes: newScenesArray
  //     }
  //   })
  // }

  /**
   * THE CONVENTION OF OUR DATA STATE
   * Currenttly a flat mapped copy of the CURRENT scene state is always the LAST entry in the undoHistory array
   * on the scene object.
   * This allows us to implemenet undo by looking for a state 2 from the end, and pushing the last undo state (our current before the undo action)
   * to the redo array, ready be re-set as current by any redo request
   */
  handleUndo = () => {
    //   this.fabricCanvas?.discardActiveObject()
    //   this.fabricCanvas?.renderAll()
    //   const { activeSceneIndex } = this.state
    //   const stateToAddToRedo: UndoHistoryEntry = this.activeSceneObject.undoHistory[this.activeSceneObject.undoHistory.length - 1]
    //   const stateToUndoTo: UndoHistoryEntry = this.activeSceneObject.undoHistory[this.activeSceneObject.undoHistory.length - 2]
    //   if (!stateToAddToRedo) return Modal.warn({ content: `You've got nothing to undo!` })

    //   let newUndoHistoryArray = [...this.activeSceneObject.undoHistory]
    //   let newRedoHistoryArray = [...this.activeSceneObject.redoHistory]
    //   let useStateToSaturate: UndoHistoryEntry['objectStates']
    //   if (stateToUndoTo === undefined) {
    //     // Also pop current state to redo
    //     newRedoHistoryArray.push(stateToAddToRedo)
    //     newUndoHistoryArray.pop()
    //     useStateToSaturate = this.activeSceneObject.activeSceneObjects as UndoHistoryEntry['objectStates']
    //   } else {
    //     // Here we will push the new states to redo as well as pop of the undo state to current
    //     newRedoHistoryArray.push(stateToAddToRedo)
    //     newUndoHistoryArray.pop()
    //     useStateToSaturate = stateToUndoTo.objectStates
    //   }

    //   // console.log('handleUndo: ', { useStateToSaturate, newRedoHistoryArray, newUndoHistoryArray })

    //   // Saturate fabric in memory state and commit changes to acrtivescene object to react state
    //   // console.log(`🥶 SATURATION`)
    //   const selectedGUIDsArray = stateToAddToRedo?.selectedGUIDs || []
    //   const fabricObjects = this.fabricCanvas?.getObjects() as Array<CustomFabricObject>
    //   let selectedObjects: Array<CustomFabricObject> = []
    //   fabricObjects.forEach(obj => {
    //     const settingsToSetTo = useStateToSaturate[obj.guid]
    //     console.log({ settingsToSetTo })
    //     obj.set(settingsToSetTo).setCoords()
    //     if (selectedGUIDsArray.includes(obj.guid)) {
    //       selectedObjects.push(obj)
    //     }
    //   })


    //   if (selectedObjects?.length) {
    //     if (selectedGUIDsArray.length === 1) {
    //       this.fabricCanvas?.setActiveObject(selectedObjects[0])
    //     } else {
    //       let newSelection = new fabric.ActiveSelection(selectedObjects, { canvas: this.fabricCanvas as fabric.Canvas })
    //       this.fabricCanvas?.setActiveObject(newSelection)
    //     }
    //   }
    //   this.fabricCanvas?.requestRenderAll()

    //   // Update the react state
    //   const newSceneObject = {
    //     ...this.activeSceneObject,
    //     undoHistory: newUndoHistoryArray,
    //     redoHistory: newRedoHistoryArray
    //   }
    //   return this.setState({
    //     project: {
    //       ...this.state.project,
    //       scenes: this.state.project.scenes.map((sceneObj, currSceneIndex) => (
    //         currSceneIndex !== activeSceneIndex ? sceneObj : newSceneObject
    //       ))
    //     }
    //   })
  }

  handleRedo = () => {
    //   this.fabricCanvas?.discardActiveObject()
    //   this.fabricCanvas?.renderAll()
    //   const { activeSceneIndex } = this.state
    //   if (!this.activeSceneObject.redoHistory.length) return Modal.warn({ content: 'You have nothing to redo' })
    //   const stateToAddToUndo: UndoHistoryEntry = this.activeSceneObject.redoHistory[this.activeSceneObject.redoHistory.length - 1]
    //   let newUndoHistoryArray = [...this.activeSceneObject.undoHistory]
    //   let newRedoHistoryArray = [...this.activeSceneObject.redoHistory]
    //   const stateToRedoTo = newRedoHistoryArray.pop()

    //   let useStateToSaturate: UndoHistoryEntry['objectStates']
    //   if (stateToRedoTo === undefined) {
    //     // Also pop current state to redo
    //     newUndoHistoryArray.push(stateToAddToUndo)
    //     useStateToSaturate = this.activeSceneObject.activeSceneObjects as UndoHistoryEntry['objectStates']
    //   } else {
    //     // Here we will push the new states to redo as well as pop of the undo state to current
    //     newUndoHistoryArray.push(stateToAddToUndo)
    //     useStateToSaturate = stateToRedoTo.objectStates
    //   }

    //   // Saturate fabric in memory state and commit changes to acrtivescene object to react state
    //   // console.log(`🥶 SATURATION`)
    //   const selectedGUIDsArray = stateToAddToUndo?.selectedGUIDs || []
    //   const fabricObjects = this.fabricCanvas?.getObjects() as Array<CustomFabricObject>
    //   let selectedObjects: Array<CustomFabricObject> = []
    //   fabricObjects.forEach(obj => {
    //     const settingsToSetTo = useStateToSaturate[obj.guid]
    //     obj.set(settingsToSetTo).setCoords()
    //     if (selectedGUIDsArray.includes(obj.guid)) {
    //       selectedObjects.push(obj)
    //     }
    //   })

    //   if (selectedObjects?.length) {
    //     if (selectedGUIDsArray.length === 1) {
    //       this.fabricCanvas?.setActiveObject(selectedObjects[0])
    //     } else {
    //       let newSelection = new fabric.ActiveSelection(selectedObjects, { canvas: this.fabricCanvas as fabric.Canvas })
    //       this.fabricCanvas?.setActiveObject(newSelection)
    //     }
    //   }
    //   this.fabricCanvas?.requestRenderAll()

    //   // Update the react state
    //   const newSceneObject = {
    //     ...this.activeSceneObject,
    //     undoHistory: newUndoHistoryArray,
    //     redoHistory: newRedoHistoryArray
    //   }
    //   return this.setState({
    //     project: {
    //       ...this.state.project,
    //       scenes: this.state.project.scenes.map((sceneObj, currSceneIndex) => (
    //         currSceneIndex !== activeSceneIndex ? sceneObj : newSceneObject
    //       ))
    //     }
    //   })
  }

  get activeSceneObject() {
    return this.state.project.scenes[this.state.activeSceneIndex]
  }

  handleSelectElementByGUID = (selectGUID: string) => {
    const liveObject = this.liveObjectsDict[selectGUID]
    if (!liveObject) return Modal.warn({ content: 'That element no longer exists in the scene' })
    if (liveObject.type === 'FakeGroup') return this.handleSelectGroup(liveObject)
    // Handle select single object
    this.fabricCanvas!
      .discardActiveObject()
      .setActiveObject((liveObject as fabric.Object))
      .requestRenderAll()
  }

  handleSelectGroup = (liveGroupObject: CustomFabricObject) => {
    this.fabricCanvas!
      .discardActiveObject()
      .renderAll()
    const { treeDataArray, nodes } = buildTreeState((this?.fabricCanvas?.getObjects() as Array<CustomFabricObject>))
    console.log({ treeDataArray, nodes })
    const selectedGroupInfo = nodes[liveGroupObject.guid]
    let newSelectedObjects: Array<CustomFabricObject> = []
    const recursiveAdd = (array: TreeItems) => {
      array.forEach(childObjDetails => {
        const obj = this.liveObjectsDict[childObjDetails.guid]
        newSelectedObjects.push(obj)
        if (childObjDetails.children) recursiveAdd(childObjDetails.children)
      })
    }
    recursiveAdd(selectedGroupInfo.children)
    const sel = new fabric.ActiveSelection([], { canvas: (this.fabricCanvas! as fabric.Canvas) })
    newSelectedObjects.forEach(obj => sel.addWithUpdate((obj as fabric.Object)))
    sel.setCoords()
    this.fabricCanvas!
      .setActiveObject(sel)
      .requestRenderAll()
  }

  addText = () => {
    if (!this.fabricCanvas) return
    console.log('addText')
    const systemFontStack = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`
    // @ts-ignore
    const newTextBox = new fabric.CTextBox('New text', {
      fontFamily: 'Arial',
      textAlign: 'center',
      fontSize: 39,
      stroke: 'black',
      strokeWidth: 2,
      fill: {
        type: 'linear',
        colorStops: [
          { offset: 0, color: '#6ED4EF' },
          { offset: 1, color: '#2F65F4' },
        ],
        gradientUnits: 'percentage',
        coords: { x1: 0, y1: 0, x2: 0, y2: 1 }
      },
      width: this.state.project.settings.dimensions.width * 0.96,
      top: 0,
      left: this.state.project.settings.dimensions.width * 0.02
    })
    this.props.handleAddObject(newTextBox)
  }

  addRect = () => {
    //@ts-ignore
    const newRect = new fabric.CRect({
      width: this.state.project.settings.dimensions.width * 0.1,
      height: this.state.project.settings.dimensions.height * 0.1,
      fill: 'rgba(0, 0, 0, 0.5)',
      top: 0,
      left: 0
    })
    return this.props.handleAddObject(newRect)
  }

  addSVG = () => {
    const svgString = prompt('Enter svg string')
    if (!svgString) return Modal.warn({ content: 'No svg string provided' })
    try {
      fabric.loadSVGFromString(svgString, (results, options) => {
        const groupObject = this.fabricCanvas!.createNewGroupAtIndex()
        groupObject.userSetName = 'SVG Group'
        this.props.handleAddObject(groupObject)
        results.forEach((obj) => {
          this.props.handleAddObject((obj as CustomFabricObject), groupObject.guid)
        })
      })
    } catch (e: any) {
      return Modal.warn({ content: `Error loading svg: ${e.message}` })
    }
  }

  addLabel = () => {
    // @ts-ignore
    const label = new fabric.LabelElement('Liver', {
      width: 200,
      userSetName: 'Label',
      fontSize: 39,
      bgRectOptions: {
        stroke: 'blue',
        strokeWidth: 2,
        fill: 'black'
      }
    })
    this.props.handleAddObject(label)
  }

  addImageFromURL = () => {
    const url = prompt('Enter image url')
    if (!url) return Modal.warn({ content: 'No image url provided' })
    try {
      fabric.Image.fromURL(url, (imageObject) => {
        imageObject.scaleToHeight(this.state.project.settings.dimensions.height)
        if (imageObject.getScaledWidth() > this.state.project.settings.dimensions.width) {
          imageObject.scaleToWidth(this.state.project.settings.dimensions.width)
        }
        this.props.handleAddObject(imageObject)
      }, { crossOrigin: 'Anonymous' })
    } catch (error) {
      return Modal.warn({ content: 'Loading image failed' })
    }
  }

  handleWindowImageDrop = (e: DragEvent) => {
    console.log('handleWindowImageDrop', { e })
    e.preventDefault()
    e.stopPropagation()
    const dt = e.dataTransfer
    const files = dt?.files
    if (files) {
      const filesArray = Array.from(files)
      filesArray.forEach(file => {
        let reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => {
          let img = document.createElement('img')
          //@ts-ignore
          img.src = reader.result
          img.onload = () => {
            const image = new fabric.Image(img, {
              top: 0,
              left: 0,// @ts-ignore
              guid: uuidv4(),// @ts-ignore,
              parentID: null,// @ts-ignore
              userSetName: 'Image',
              width: img.naturalWidth,
              height: img.naturalHeight
            })
            this.props.handleAddObject(image)
          }
        }
      })
    }
  }

  deleteObject = () => {

  }

  handleInitCustomInteractionComponent = (customComponentClass: typeof EditorComponentClass) => {
    customComponentClass.handleInit.call(this)
  }

  render() {
    const contextValue: EditorContextTypes = {
      fabricCanvas: this.fabricCanvas,
      state: this.state,
      project: this.props.project,
      activeSceneIndexs: this.props.activeSceneIndexs,
      setActiveSceneIndex: this.props.setActiveSceneIndex,
      setOnFabricObject: this.setOnFabricObject,
      setOnGlobalObject: this.setOnGlobalObject,
      handleGroupObjects: this.props.handleGroupObjects,
      handleUndo: this.handleUndo,
      handleRedo: this.handleRedo,
      liveObjectsDict: this.liveObjectsDict,
      liveObjectScenesReferences: this.props.liveObjectScenesReferences,
      handleSelectElementByGUID: this.handleSelectElementByGUID,
      addText: this.addText,
      addSVG: this.addSVG,
      addRect: this.addRect,
      addLabel: this.addLabel,
      addImageFromURL: this.addImageFromURL,
      handleOpenProjectPreview: this.props.handleOpenProjectPreview,
      handleInitCustomInteractionComponent: this.handleInitCustomInteractionComponent
    };
    return (
      <div>
        <editorContext.Provider value={contextValue}>
          <ReflexContainer
            orientation="vertical"
            style={{ width: "100vw", height: "100vh" }}
          >
            <ReflexElement minSize={100} maxSize={250} size={180}>
              <ScenesPane
                handleDuplicateScene={this.props.handleDuplicateScene}
              />
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
              <ReflexContainer orientation="horizontal">
                <ReflexElement size={50}>
                  <ToolbarContainer
                  />
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
                      <InspectorContainer
                        availiableCustomInteractionModules={availiableCustomInteractionModules}
                      />
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

export interface TreeItem {
  guid: string;
  parentID?: string;
  children: TreeItem[];
  structurePath: Array<string>;
  collapsed?: boolean;
  zIndex: Number
}
export type TreeItems = TreeItem[];

function buildTreeState(objectsArray: Array<CustomFabricObject>) {
  const root: TreeItem = { guid: 'root', children: [], structurePath: [], zIndex: 0, parentID: '' };
  const nodes: Record<string, TreeItem> = { [root.guid]: root };
  const items = objectsArray.map((item, zIndex) => ({ ...item, children: [], structurePath: [item.guid], zIndex }));
  items.forEach((item, zIndex) => {
    const { guid, children } = item;
    const parentID = item?.parentID ?? root.guid;
    const parent = nodes[parentID] ?? findItem(items, parentID);
    const structurePath = [...parent.structurePath, guid]
    nodes[guid] = { guid, children, structurePath, zIndex, parentID };
    parent.children.push({ guid, children, structurePath, zIndex, parentID });
  })
  return { treeDataArray: root.children, nodes };
}

export function findItem(items: TreeItem[], itemId: string) {
  return items.find(({ guid }) => guid === itemId);
}

 // console.log("selection:created", e)

      // //TODO: FIX CODE DUPLICATION

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
      //     if (selectedObject?.parentID) {
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
      //   const objectGUIDsInActiveSelection = currentActiveSelectionObjects.map(e => e.guid)
      //   for (const obj of allChildrenAndSelectionArray) {
      //     if (!objectGUIDsInActiveSelection.includes(obj.guid)) {
      //       currentActiveSelection.addWithUpdate(obj)
      //     }
      //   }
      //   //If it's a selection of a single object
      // } else {
      //   const selectedObject = currentActiveSelection
      //   let allChildrenAndSelection = new Set<CustomFabricObject>()
      //   if (selectedObject?.parentID) {
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
      //   const allChildrenAndSelectionArray = Array.from(allChildrenAndSelection)
      //   const newActiveSelection = new fabric.ActiveSelection(allChildrenAndSelectionArray, { canvas: this.fabricCanvas as fabric.Canvas })
      //   this.fabricCanvas?.setActiveObject(newActiveSelection)
      // }
      // this.fabricCanvas?.renderAll()


      // objectsToSelectFromGUIDs = (GUIDs: string | Array<string>) => {
      //   if (typeof (GUIDs) === "string") {
      //     const GUID = GUIDs
      //     const selectedObject = this.liveObjectsDict[GUID] as CustomFabricObject

      //     let allChildrenAndSelection = new Set<CustomFabricObject>()
      //     if (selectedObject?.parentID) {
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
      //     }

      //     const allChildrenAndSelectionArray = Array.from(allChildrenAndSelection)
      //     return allChildrenAndSelectionArray
      //   } else {

      //   }

      // }


    // So that the group is created at the highest child zIndex
    // and all the children are moved ABOVE that new group groupIndex in order
    // if (!this?.fabricCanvas) return
    // const selection: fabric.Object | fabric.ActiveSelection | undefined = this.fabricCanvas?.getActiveObject()
    // if (selection?.type !== 'activeSelection') return Modal.warn({ content: 'GIVE ME A GROUPABLE' })

    // if (selection instanceof fabric.ActiveSelection) {
    //   const newGroupGUID = uuidv4() //GUID of new group
    //   const selectionObjects = selection.getObjects() as Array<CustomFabricObject> // Currently selected objects
    //   let objectGUIDsToAssignParent = new Set<string>() // All the GUIDs which will have this new group as parent

    //   for (let obj of selectionObjects) {

    //     // Add tallest parent to collection of GUIDs to assign new group as parent to
    //     const tallestParent = this.recursivelyFindTallestParent(obj)
    //     const tallestparentID = tallestParent.guid as string
    //     objectGUIDsToAssignParent.add(tallestparentID)
    //   }

    //   //Convert to array for iteration
    //   const objectGUIDsToAssignParentArray = Array.from(objectGUIDsToAssignParent)

    //   // Assign new group as parent to each top-level child
    //   for (const objectGUID of objectGUIDsToAssignParentArray) {
    //     const obj = this.liveObjectsDict[objectGUID] as CustomFabricObject
    //     obj.parentID = newGroupGUID
    //   }

    //   // Create new rect to signify group
    //   const groupRect = new FakeGroup({
    //     width: selection.width,
    //     height: selection.height,
    //     top: selection.top,
    //     left: selection.left,
    //   }) as fabric.Object
    //   const activeGroupRect = groupRect as CustomFabricObject
    //   activeGroupRect.set({
    //     userSetName: 'Group',
    //     guid: newGroupGUID,
    //     members: objectGUIDsToAssignParentArray //List of objects to assignt this as parent to is same as list of children
    //   })

    //   this.liveObjectsDict[newGroupGUID] = activeGroupRect

    //   this.fabricCanvas
    //     .add(groupRect)
    //     .renderAll()
    //     .fire("object:modified", {
    //       action: "group",
    //       target: {
    //         type: "group"
    //       }
    //     })
    // }

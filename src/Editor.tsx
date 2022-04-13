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
      normalizeAllObjectCoords(e.target, e.action)
      // if (!e?.customFire) this.sanitizeEquations(e.target, e.action)
      // return this.normalizeNewSceneState(`object:modified: action: ${e.action}, name: ${e.target?.userSetName || e.target.type}`)
    });

    // This is used to hook changes in fabric.object.prototype gradientcontrols into our react workflow.
    this.fabricCanvas.on("custom:object:modify", (e: any) => {
      this.setOnFabricObject(e.target, e.settings, e.action)
    });

    //Update gradient angle controls on selection
    this.fabricCanvas.on("selection:created", (e:any) => {
      if(e.selected.length === 1) {
        const selection = e.selected[0]
        if(selection.fill?.type === "linear" || selection.fill?.type === "radial" ) selection.refreshGradientAngleControls()
      }
    })
      this.fabricCanvas.on("selection:updated", (e:any) => {
        if(e.selected.length === 1) {
          const selection = e.selected[0]
          if(selection.fill?.type === "linear" || selection.fill?.type === "radial" ) selection.refreshGradientAngleControls()
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
    // const svgString = prompt('Enter svg string')
    const svgString = `<svg viewBox="0 0.001 896 504" width="896" height="504px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <radialGradient gradientUnits="userSpaceOnUse" cx="214.754" cy="-20.462" r="448" id="gradient-1" gradientTransform="matrix(0.552966, 0.454818, -0.635237, 0.772319, 124.249504, 26.129553)">
        <stop offset="0" style="stop-color: rgb(32, 52, 124);"></stop>
        <stop offset="1" style="stop-color: rgb(4, 10, 42);"></stop>
      </radialGradient>
    </defs>
    <g style="">
      <image width="978.337" height="629.173" y="-125.171" style="" x="-53.858" xlink:href="data:image/jpeg;base64,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"></image>
      <polygon style="fill: none;" points="418.003 203.811 423.107 208.866 429.69 214.232 439.776 218.494 449.722 221.498 459.957 221.93 474.579 220.424 490.816 215.926 505.084 210.383 521.883 199.803 532.646 185.557 539.136 170.374 542.486 156.737 543.43 140.154 542.592 127.461 538.975 112.918 534.549 102.229 531.706 97.986 520.139 105.039 507.527 112.94 491.19 129.76 479.908 143.349 471.404 151.424 462.323 155.396 460.646 160.99 454.3 168.388 446.674 173.257 440.805 174.936 434.584 174.657 422.558 173.04 415.383 172.325 405.172 173.875 400.429 174.607 385.412 179.297 380.716 184.209 378.997 191.249 380.049 197.684 381.513 201.892 383.361 205.834 387.087 208.61 390.808 209.531 400.812 206.21 411.351 203.863">
        <title>Stomach</title>
      </polygon>
      <polygon style="fill: none;" points="468.958 427.335 464.972 438.569 461.18 452.544 460.416 466.207 463.534 470.025 470.895 473.628 480.472 473.482 491.19 471.961 495.969 468.495 502.836 468.818 511.38 464.498 517.488 459.036 519.26 454.54 523.392 454.364 529.333 447.481 533.501 440.095 533.066 434.851 536.741 433.839 540.858 427.249 543.639 420.387 543.242 415.219 546.638 411.113 549.137 404.55 549.688 399.201 548.624 394.368 546.598 392.763 550.594 390.894 552.55 386.349 554.145 379.523 554.288 373.601 551.856 369.405 553.664 367.303 554.408 360.596 554.244 353.807 553.537 347.91 550.632 343.473 552.477 340.886 553.314 336.559 553.283 329.191 552.51 323.629 549.349 319.875 552.285 316.886 551.642 304.991 549.851 296.847 546.608 293.278 549.763 285.907 548.368 274.322 545.309 271.813 548.297 265.734 547.274 258.038 544.666 255.588 548.081 249.404 545.944 223.135 538.244 214.114 528.876 209.997 513.636 209.639 507.457 211.066 504.226 211.869 496.029 213.68 491.211 219.195 482.49 221.828 475.786 226.083 473.852 230.066 467.453 230.575 456.98 235.958 449.569 241.491 443.18 244.315 438.146 248.024 436.288 251.331 430.418 250.022 424.235 251.701 421.516 254.184 413.917 251.761 407.475 251.82 403.396 254.337 398.306 250.139 391.421 246.902 385.24 245.996 380.185 246.429 369.556 241.059 363.875 242.66 354.998 247.401 346.123 250.61 339.091 249.444 332.782 256.926 329.548 261.722 321.667 268.301 316.52 282.56 316.506 298.476 312.68 304.226 311.808 318.58 313.915 336.959 305.726 349.099 307.751 372.298 314.658 382.326 306.346 397.791 306.403 417.917 312.468 437.542 324.906 451.764 345.543 458.232 360.31 451.795 378.784 446.752 388.32 427.259 389.11 411.827 385.367 402.625 371.62 390.935 361.594 376.904 366.951 365.486 366.761 344.161 360.758 336.176 363.437 322.727 359.216 310.015 364.998 303.058 364.586 293.542 370.844 293.99 393.628 298.503 414.619 303.547 427.188 300.718 447.081 298.143 452.696 292.772 471.458 285.634 474.094 277.94 485.749 276.362 492.763 271.217 497.46 267.018 508.253 263.135 512.091 260.383 513.691 275.59 508.935 283.814 504.498 288.712 504.364 294.49 507.22 298.935 504.626 304.932 506.312 316.427 508.881 320.869 506.66 327.153 506.773 338.119 509.724 346.373 507.987 354.463 513.36 366.52 513.737 371.727 511.809 378.164 509.561 386.085 509.036 388.839 507.167 397.002 504.742 400.822 502.431 404.2 495.829 413.173 486.662 421.066 477.236 424.443">
        <title>Large Intestine</title>
      </polygon>
      <polyline style="fill: none;" points="362.777 292.268 363.185 298.967 362.194 305.646 358.432 309.523 361.573 316.8 363.041 324.778 362.654 331.139 360.129 335.564 364.926 340.868 366.061 348.449 365.463 356.682 365.383 365.69 363.446 373.695 362.066 377.299 369.511 383.332 375.256 391.687 378.926 398.894 383.557 404.456 387.98 403.154 390.034 405.117 390.034 413.084 393.283 423.66 398.652 430.078 405.387 433.173 417.683 430.919 424.54 425.974 428.972 418.983 431.564 414.456 436.193 418.627 439.637 418.017 448.22 418.273 454.884 418.213 459.499 421.229 465.476 426.028 477.486 425.231 483.906 424.388 490.163 421.776 494.318 416.018 498.421 412.771 500.532 407.596 503.914 403.457 504.752 397.515 507.7 391.119 509.691 385.216 511.123 379.078 513.488 373.56 514.488 369.953 512.869 366.677 512.838 362.094 510.956 358.002 508.408 355.285 501.956 355.775 503.173 349.979 505 339.343 505.177 327.539 505.141 317.596 503.487 311.943 499.88 305.628 494.293 301.92 489.486 300.197 485.729 300.139 485.297 303.237 483.625 296.858 493.117 296.809 496.534 293.178 501.206 290.658 508.352 283.777 513.22 276.068 512.057 259.565 506.173 264.143 496.31 266.288 491.545 272.39 488.789 275.256 481.268 279.349 474.963 279.449 469.202 285.717 461.417 290.462 453.879 291.312 449.2 294.501 437.41 298.837 426.174 299.015 414.924 301.255 404.392 300.11 395.296 296.737 390.48 298.537 379.322 296.808 371.432 292.941 367.625 292.461">
        <title>Small Intestine</title>
      </polyline>
      <polygon style="fill: none;" points="369.68 171.12 367.176 173.672 366.739 178.346 367.564 181.654 369.527 184.315 378.978 180.417 391.239 176.575 402.331 173.548 409.464 172.394 412.904 171.019 415.492 169.846 421.559 170.13 426.386 171.765 427.965 173.85 434.545 174.591 428.726 169.965 422.763 167.035 416.652 166.622 413.233 166.661 410.474 164.262 408.066 162.628 404.254 162.25 399.307 162.4 389.161 164.077 382.342 165.333 375.994 167.62">
        <title>Gall blader</title>
      </polygon>
      <polygon style="fill: none;" points="485.694 216.991 472.886 220.098 460.204 221.994 447.555 221.746 438.623 217.954 426.911 212.575 421.291 207.948 416.452 203.716 412.078 203.336 400.503 206.569 384.659 211.388 375.06 215.85 369.182 219.099 366.764 224.095 366.096 228.558 366.53 233.05 368.142 237.249 369.589 239.995 373.7 241.921 377.871 243.698 379.465 246.252 384.741 245.383 390.906 246.715 395.897 248.849 399.811 252.527 401.502 255.293 405.721 251.764 407.617 249.257 414.004 244.292 422.249 239.103 426.405 237.322 434.272 237.28 438.378 237.628 442.525 234.757 448.299 232.36 453.216 230.473 458.015 230.425 463.919 230.186 467.436 231.199 473.399 230.316 475.587 227.691 480.191 222.952">
        <title>Pancreas</title>
      </polygon>
    </g>
    <path d="M 361.631 266.809 L 356.653 267.009 L 353.092 266.351 L 350.603 263.51 L 349.34 260.32 L 348.977 251.692 L 349.004 238.995 L 349.531 224.96 L 350.598 210.278 L 353.502 198.221 L 358.375 188.369 L 367.406 176.824 L 378.168 169.525 L 388.207 165.645 L 398.126 164.381 L 407.242 164.033 L 419.866 164.335 L 431.304 165.603 L 436.487 166.291 L 437.815 168.585 L 442.46 165.317 L 449.375 163.96 L 462.852 163.878 L 484.341 164.138 L 503.005 164.22 L 512.621 165.848 L 516.141 169.348 L 516.803 173.155 L 515.898 176.498 L 508.286 181.459 L 494.521 190.054 L 490.442 193.923 L 484.812 200.465 L 478.606 208.018 L 472.689 214.763 L 465.246 221.452 L 457.525 224.156 L 449.853 223.923 L 442.823 228.913 L 438.678 230.955 L 436.819 238.151 L 422.462 236.225 L 410.163 238.131 L 382.607 247.578 L 371.453 254.486 L 366.664 259.521 L 361.631 266.809 Z" style="fill: none; stroke-width: 1.59408px; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 2px;" transform="matrix(1.254646, 0, 0, 1.254646, -114.08123, -125.170692)">
      <title>Liver</title>
    </path>
  </svg>`
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
      width: 150,
      userSetName: 'Label',
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

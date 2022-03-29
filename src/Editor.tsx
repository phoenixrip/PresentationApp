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
import { ProjectDataTypes, SceneType } from "./Types/ProjectDataTypes";
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
    console.log('EDITOR LOADED')
    this.state = {
      tick: true,
      isInitted: false,
      project: props.project,
      activeSceneIndex: 0,
      antdSize: "small" as SizeType,
      gridCoords: {
        width: 10,
        height: 10,
        top: -20,
        left: -20
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

    // Init complete editor state
    const json: any = {
      objects: Object.values(this.state.project.globalObjects),
    };
    this.fabricCanvas.loadFromJSON(
      json,
      () => {
        this.initViewportRect();
        this.renderActiveScene(this.state.activeSceneIndex);
        this.fabricCanvas?.requestRenderAll();
      },
      (options: any, object: any, a: any) => {
        this.liveObjectsDict[options.uniqueGlobalId] = object;
      }
    );

    return this.setState({ isInitted: true });
  };

  initViewportRect = () => {
    const viewportRect = new fabric.Rect({
      width: this.state.project.settings.dimensions.width,
      height: this.state.project.settings.dimensions.height,
      fill: undefined,
      stroke: "blue",
      strokeDashArray: [11, 8],
      selectable: false,
      evented: false,
      objectCaching: false
    }) as CustomFabricObject
    viewportRect.set({ uniqueGlobalId: 'viewBoxRect' })

    if (this.fabricCanvas) {
      this.fabricCanvas.add(viewportRect).sendToBack(viewportRect);
    }
  };

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

  handleGroupObjects = () => {
    const selection: fabric.Object | undefined = this.fabricCanvas?.getActiveObject()
    if (selection?.type !== 'activeSelection') return Modal.warn({ content: 'GIVE ME A GROUPABLE' })
    if (selection?.type === 'activeSelection') {
      const useGroupable = selection as fabric.ActiveSelection
      const newGroupUUID = uuidv4()
      let newGroupObject = useGroupable.toGroup() as CustomFabricGroup
      newGroupObject.set({
        uniqueGlobalId: newGroupUUID,
        userSetName: '',
        firstOccurrenceIndex: this.state.activeSceneIndex
      })
      // Grab the names of the grouped object to display in the undo/redo UI
      const groupedObjects = newGroupObject.getObjects() as Array<CustomFabricObject>
      const groupedObjectNames = groupedObjects.map(obj => obj?.userSetName ? obj.userSetName : obj.type)
      return this.normalizeNewSceneState(`Grouped objects ${groupedObjectNames}`)
    }
  }

  normalizeNewSceneState = (reasonForUpdate?: string) => {
    const { activeSceneIndex } = this.state
    console.log(`normalizeNewSceneState: reasonForUpdate: ${reasonForUpdate || 'No reason given'}`)
    const newFabricState = this.fabricCanvas?.toObject(['uniqueGlobalId', 'userSetName', 'firstOccurrenceIndex', 'objectIndex'])
    const newFlatMappedFabricState = flatMapFabricSceneState(newFabricState)
    console.log({ newFlatMappedFabricState })
    const newSceneObj = {
      ...this.activeSceneObject,
      undoHistory: this.activeSceneObject.undoHistory.concat(newFlatMappedFabricState)
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

  handleUndo = () => {
    const stateToAddToRedo = this.activeSceneObject.undoHistory[this.activeSceneObject.undoHistory.length - 1]
    const stateToUndoTo = this.activeSceneObject.undoHistory[this.activeSceneObject.undoHistory.length - 2]
    console.log('handleUndo: ', { stateToUndoTo, stateToAddToRedo })
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
      handleUndo: this.handleUndo
    };
    console.log({ contextValue })
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
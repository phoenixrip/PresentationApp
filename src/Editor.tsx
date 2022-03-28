import { fabric } from "fabric";
import React, { Component } from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import { ScenesPane } from "./ScenesPane/ScenesPane";
import CanvasPane from "./FabricCanvasContainer";
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
  CustomFabricObject,
} from "./Types/CustomFabricTypes";
// import { ProjectDataStateTypes } from "./AppController";

import { diff } from "./Utils/diff";
import { ActiveSelection } from "fabric/fabric-impl";

setFabricDefaults();

interface EditorPropsTypes {
  project: ProjectDataTypes;
}

interface EditorStateTypes {
  tick: Boolean;
  isInitted: Boolean;
  project: ProjectDataTypes;
  activeSceneIndex: number;
  antdSize: SizeType;
}

interface EditorContextTypes {
  fabricCanvas: fabric.Canvas | null;
  state: EditorStateTypes;
  handleAddRect: Function;
  setOnFabricObject: Function;
  setOnGlobalObject: Function;
  setActiveSceneIndex: Function;
}

const editorContext = React.createContext<EditorContextTypes>(
  {} as EditorContextTypes
);

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
    };
  }

  setActiveSceneIndex = (newSceneIndex: number) => {
    //not unselecting active object can create issues when a group is selected and scene changed
    if(this.fabricCanvas?.getActiveObject()?.type === "activeSelection") this.fabricCanvas!.discardActiveObject();
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
      const activeObject = this.liveObjectsDict[uniqueGlobalId];
      const globalObjectSettings: {} =
        this.state.project.globalObjects[uniqueGlobalId];

      activeObject
        .set(globalObjectSettings) //Reset to global settings
        .set(sceneObjectOptions) // Set specific scene options
        .setCoords();
    }
  };

  initFabricCanvas = (
    domCanvas: HTMLCanvasElement,
    canvasPaneDimensions: { width: number; height: number }
  ) => {
    const projectDimensions = this.state.project.settings.dimensions;
    const c = (this.fabricCanvas = new fabric.Canvas(domCanvas, {
      backgroundColor: "#141414",
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

    // CANVAS EVENT HOOKS
    // React state tick on render
    this.fabricCanvas.on("after:render", throttle(this.updateTick, 100));

    // Mouse wheel zoom
    this.fabricCanvas.on("mouse:wheel", function (opt) {
      var delta = opt.e.deltaY;
      var zoom = c?.getZoom() || 1;
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      c.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      var vpt = c?.viewportTransform || [];
      // if (zoom < 400 / 1000) {
      //   vpt[4] = 200 - 1000 * zoom / 2;
      //   vpt[5] = 200 - 1000 * zoom / 2;
      // } else {
      //   if (vpt[4] >= 0) {
      //     vpt[4] = 0;
      //   } else if (vpt[4] < c.getWidth() - 1000 * zoom) {
      //     vpt[4] = c.getWidth() - 1000 * zoom;
      //   }
      //   if (vpt[5] >= 0) {
      //     vpt[5] = 0;
      //   } else if (vpt[5] < c.getHeight() - 1000 * zoom) {
      //     vpt[5] = c.getHeight() - 1000 * zoom;
      //   }
      // }
    });

    //Hook into Fabrics events
    this.fabricCanvas.on("object:modified", (e: any) => {
      console.log("object:modfied", e);
      const isSelection = e.target.type === "activeSelection"

      // ------------------------------------------------------------------------
      // Scale width/height/radius according to scale and reset scale to
      // Reset top and left according to rescaled position without active selection
      // ------------------------------------------------------------------------
      switch (e.action) {
        case "scale":
          const newScaleX = e.target.scaleX;
          const newScaleY = e.target.scaleY;

          if (isSelection) {
            e.target.set({
              width: Math.round(e.target.width * newScaleX) || 1,
              height: Math.round(e.target.height * newScaleY) || 1,
              scaleX: 1,
              scaleY: 1,
            });
          }

          // get objects from activeSelection or take selected object in array so we can iterate
          const objects = isSelection ? e.target.getObjects() : [e.target]

          // Iterate through objects in group and rescale and recalculate left and top relative to newScaleX/Y
          for (const obj of objects) {
            const left = Math.round(obj.left * newScaleX);
            const top = Math.round(obj.top * newScaleY);
            let newSettings = {} as fabric.IObjectOptions

            switch (obj.type) {
              case "rect":
                newSettings = {
                  width: Math.round(obj.width * newScaleX) || 1,
                  height: Math.round(obj.height * newScaleY) || 1,
                  scaleX: 1,
                  scaleY: 1,
                }
                //only set top and left on activeSelection:
                if (isSelection) newSettings = { ...newSettings, top: top, left: left }
                obj.set(newSettings);
                break;
              case "circle":
                newSettings = {
                  radius: Math.round(obj.radius * newScaleX) || 1,
                  scaleX: 1,
                  scaleY: 1
                } as fabric.ICircleOptions
                //only set top and left on activeSelection:
                if (isSelection) newSettings = { ...newSettings, top: top, left: left }
                obj.set(newSettings);
                break;
              default:
                break;
            }
          }
          break
        default:
          break
      }

      // ------------------------------------------------------------------------
      // Calculate modifications, push to scene objects and undo history
      // ------------------------------------------------------------------------

      //Unselect on canvas if ActiveSelection to get get Absolute position
      if (isSelection) this.fabricCanvas!.discardActiveObject();

      // Initial state is global state + current state in scene (activeSceneObjects)
      const oldSceneState = {...this.state.project.scenes[this.state.activeSceneIndex].activeSceneObjects}
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
      if (isSelection) this.fabricCanvas!.setActiveObject(e.target);

      // Set to Scene objects
      // TODO: Rename setonglobalobject to setonobjectinactivescene?
      for (const [uniqueGlobalId, settings] of Object.entries(deltaSettings)) {
        this.setOnGlobalObject(this.state.project.globalObjects[uniqueGlobalId] as CustomFabricObject, settings as {})
      }

      //TODO: PUSH deltaSettings straight to undo history
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
    });

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

  render() {
    const contextValue: any = {
      fabricCanvas: this.fabricCanvas,
      state: this.state,
      handleAddRect: this.handleAddRect,
      setOnFabricObject: this.setOnFabricObject,
      setActiveSceneIndex: this.setActiveSceneIndex,
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

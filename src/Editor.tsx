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


import { SizeType } from 'antd/lib/config-provider/SizeContext'
// import { SceneType } from "./Types/sceneType";
import { setFabricDefaults } from "./Utils/SetFabricDefaults";
import { ProjectDataTypes, SceneType } from "./Types/ProjectDataTypes";
import { CustomFabricObject } from "./Types/CustomFabricTypes";
// import { ProjectDataStateTypes } from "./AppController";

setFabricDefaults()

interface EditorPropsTypes {
  project: ProjectDataTypes
}

interface EditorStateTypes {
  tick: Boolean,
  isInitted: Boolean,
  project: ProjectDataTypes,
  activeSceneIndex: number,
  antdSize: SizeType
}

interface EditorContextTypes {
  fabricCanvas: fabric.Canvas | null;
  state: EditorStateTypes,
  handleAddRect: Function,
  setOnFabricObject: Function,
  setActiveSceneIndex: Function
}

const editorContext = React.createContext<EditorContextTypes>({} as EditorContextTypes);

class Editor extends Component<EditorPropsTypes, EditorStateTypes> {
  fabricCanvas: fabric.Canvas | null;
  throttledSetNewCanvasPaneDimensions: Function
  liveObjectsDict: { [key: string]: fabric.Object }

  constructor(props: EditorPropsTypes) {
    super(props);
    this.fabricCanvas = null;
    this.liveObjectsDict = {}
    this.throttledSetNewCanvasPaneDimensions = throttle(this.setNewCanvasPanelDimensions, 300)
    this.state = {
      tick: true,
      isInitted: false,
      project: props.project,
      activeSceneIndex: 0,
      antdSize: "small" as SizeType
    }
  }

  setActiveSceneIndex = (newSceneIndex: number) => {
    this.renderActiveScene(newSceneIndex)
    this.fabricCanvas?.requestRenderAll()
    return this.setState({ activeSceneIndex: newSceneIndex })
  }

  renderActiveScene = (renderScreenIndex: number) => {
    const currentSceneObject = this.state.project.scenes[renderScreenIndex]

    for (const [uniqueGlobalId, sceneObjectOptions] of Object.entries(currentSceneObject.activeSceneObjects)) {
      const activeObject = this.liveObjectsDict[uniqueGlobalId]
      const globalObjects = this.state.project.globalObjects // used to type uniqueGlobalId as keyof globalObjects
      const globalObjectSettings: {} = this.state.project.globalObjects[uniqueGlobalId as keyof typeof globalObjects]

      activeObject
        .set(globalObjectSettings) //Reset to global settings
        .set(sceneObjectOptions) // Set specific scene options
        .setCoords()
    }
  }

  initFabricCanvas = (domCanvas: HTMLCanvasElement, canvasPaneDimensions: { width: number, height: number }) => {
    const projectDimensions = this.state.project.settings.dimensions
    const c = this.fabricCanvas = new fabric.Canvas(domCanvas, {
      backgroundColor: '#141414',
      width: canvasPaneDimensions.width,
      height: canvasPaneDimensions.height
    });
    // Center the project viewport withing the full-Pane-Sized fabricCanvas
    const widthMove = (canvasPaneDimensions.width - projectDimensions.width) / 2
    const heightMove = (canvasPaneDimensions.height - projectDimensions.height) / 2
    const vpt = c?.viewportTransform || []
    vpt[4] = widthMove
    vpt[5] = heightMove
    c.setViewportTransform(vpt)

    // CANVAS EVENT HOOKS
    // React state tick on render
    this.fabricCanvas.on("after:render", throttle(this.updateTick, 100))

    // Mouse wheel zoom
    this.fabricCanvas.on('mouse:wheel', function (opt) {
      var delta = opt.e.deltaY;
      var zoom = c?.getZoom() || 1
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
    })

    // Add event listener on rescale to set width/height to width/height * scaleX/scaleY and scaleX/scaleY to 1
    // TODO: We may want to implemenet a specific function for other objects here
    //eg. Circles need to update their radius instead of their width + height
    this.fabricCanvas.on("object:scaling", function (e: any) {
      const target = e.target
      if (target && target.type === 'rect') {
        const width = Math.round(target.width * target.scaleX) || 1
        const height = Math.round(target.height * target.scaleY) || 1
        target.set({ width, height, scaleX: 1, scaleY: 1 })
      }
    });

    // Init complete editor state
    const json: any = { objects: Object.values(this.state.project.globalObjects) }
    this.fabricCanvas.loadFromJSON(json, () => {
      this.initViewportRect()
      this.renderActiveScene(this.state.activeSceneIndex)
      this.fabricCanvas?.requestRenderAll()
    }, (options: any, object: any, a: any) => {
      this.liveObjectsDict[options.uniqueGlobalId] = object
    })

    return this.setState({ isInitted: true });
  }

  initViewportRect = () => {
    const viewportRect = new fabric.Rect({
      width: this.state.project.settings.dimensions.width,
      height: this.state.project.settings.dimensions.height,
      fill: undefined,
      stroke: 'blue',
      strokeDashArray: [11, 8],
      selectable: false,
      evented: false
    })

    if (this.fabricCanvas) {
      this.fabricCanvas
        .add(viewportRect)
        .sendToBack(viewportRect)
    }
  }

  updateCanvasPaneDimensions = (newDimensions: fabric.ICanvasDimensions) => {
    return this.throttledSetNewCanvasPaneDimensions(newDimensions)
  }

  setNewCanvasPanelDimensions = (newDimensions: fabric.ICanvasDimensions) => {
    this.fabricCanvas?.setDimensions(newDimensions)
  }

  updateTick = () => this.setState({ tick: !this.state.tick })

  handleAddRect = () => {
    this.fabricCanvas?.add(
      new fabric.Rect({
        width: 150,
        height: 20,
        fill: 'purple'
      })
    )
  }

  //TODO: Temporarily set obj to any instead of fabric.Object since we reference attribute .uniqueGlobalId which is monkeypatched on
  setOnFabricObject = (obj: CustomFabricObject, setting: string, val: any) => {
    if (obj) {
      // get active scene and options for object in active scene then add/modify corresponding setting to value


      const activeScene = this.state.project.scenes[this.state.activeSceneIndex]
      let currentOptions = activeScene.activeSceneObjects[obj?.uniqueGlobalId]
      let newSettings = { ...currentOptions, [setting]: val }
      const newSceneActiveObjectsObject = {
        ...activeScene.activeSceneObjects,
        [obj?.uniqueGlobalId]: newSettings
      }

      obj.set({ [setting]: val })
      obj.setCoords();
      obj?.canvas?.renderAll()

      return this.setState({
        project: {
          ...this.state.project,
          scenes: this.state.project.scenes.map((currSceneObject: SceneType, currScreenIndex: number) => {
            if (currScreenIndex !== this.state.activeSceneIndex) return currSceneObject
            const newSceneObject = {
              ...currSceneObject,
              activeSceneObjects: newSceneActiveObjectsObject
            }
            return newSceneObject
          })
        }
      })
    }
  }

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
                        updateCanvasPaneDimensions={this.updateCanvasPaneDimensions}
                        dimensions={{ width: 100, height: 100 }}
                      />
                    </ReflexElement>
                    <ReflexElement
                      size={300}
                    >
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

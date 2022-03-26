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
import { SceneType } from "./Types/sceneType";

fabric.Object.prototype.set({
  cornerStyle: 'circle',
  transparentCorners: false,
  cornerColor: '#4AB9D1',
  cornerStrokeColor: '#fff',
  borderColor: '#70ABFF',
  lockScalingFlip: true,
  paintFirst: "stroke"
})

const testState = {
  fabricCanvas: null,
  state: {
    tick: true,
    isInitted: false,
    userSettings: {
      name: "Inspector Payne"
    },
    project: {
      settings: {
        theme: "dark",
        dimensions: {
          width: 896,
          height: 504
        }
      },
      globalObjects: {
        "2131-eww2w-2312-dadaa": {
          uniqueGlobalId: "2131-eww2w-2312-dadaa",
          angle: 0,
          clipTo: null,
          fill: "#29477F",
          flipX: false,
          flipY: false,
          height: 150,
          left: 300,
          opacity: 1,
          overlayFill: null,
          rx: 0,
          ry: 0,
          scaleX: 1,
          scaleY: 1,
          shadow: {
            blur: 5,
            color: "rgba(94, 128, 191, 0.5)",
            offsetX: 10,
            offsetY: 10
          },
          stroke: null,
          strokeDashArray: null,
          strokeLineCap: "butt",
          strokeLineJoin: "miter",
          strokeMiterLimit: 10,
          strokeWidth: 1,
          top: 150,
          type: "rect",
          visible: true,
          width: 150,
          x: 0,
          y: 0
        },
        "wda1-ew21-dhftft-2313": {
          uniqueGlobalId: "wda1-ew21-dhftft-2313",
          angle: 0,
          clipTo: null,
          fill: "rgb(166,111,213)",
          flipX: false,
          flipY: false,
          height: 200,
          left: 300,
          opacity: 1,
          overlayFill: null,
          radius: 100,
          scaleX: 1,
          scaleY: 1,
          shadow: {
            blur: 20,
            color: "#5b238A",
            offsetX: -20,
            offsetY: -10
          },
          stroke: null,
          strokeDashArray: null,
          strokeLineCap: "butt",
          strokeLineJoin: "miter",
          strokeMiterLimit: 10,
          strokeWidth: 1,
          top: 400,
          type: "circle",
          visible: true,
          width: 200
        },
      },
      scenes: [
        {
          sceneSettings: {},
          activeSceneObjects: {
            "2131-eww2w-2312-dadaa": { top: 0, left: 0 } as fabric.IObjectOptions,
            "wda1-ew21-dhftft-2313": { top: 100, left: 100 } as fabric.IObjectOptions
          },
          undoHistory: [],
          redoHistory: []
        },
        {
          sceneSettings: {},
          activeSceneObjects: {
            "2131-eww2w-2312-dadaa": { top: 400, left: 400 } as fabric.IObjectOptions,
            "wda1-ew21-dhftft-2313": { top: 500, left: 500 } as fabric.IObjectOptions
          },
          undoHistory: [],
          redoHistory: []
        }
      ]
    },
    editorState: {
      activeSceneIndex: 0,
      antdSize: "small" as SizeType
    }
  }
}

interface globalAppStateType {
  tick: Boolean,
  isInitted: Boolean,
  project: {
    settings: {
      theme: String,
      dimensions: {
        width: number,
        height: number,
      }
    },
    globalObjects: Object,
    scenes: Array<SceneType>
  },
  editorState: {
    activeSceneIndex: number
    antdSize: SizeType
  },
  userSettings: {
    name: String
  }
}

interface globalContextType {
  fabricCanvas: fabric.Canvas | null;
  state: globalAppStateType,
  handleAddRect: Function,
  setOnFabricObject: Function,
  setActiveSceneIndex: Function
}

const globalContext = React.createContext<globalContextType>({} as globalContextType);

class App extends Component<{}, globalAppStateType> {
  fabricCanvas: fabric.Canvas | null;
  throttledSetNewCanvasPaneDimensions: Function
  liveObjectsDict: { [key: string]: fabric.Object }

  constructor(props: Object) {
    super(props);
    this.fabricCanvas = null;
    this.liveObjectsDict = {}
    this.throttledSetNewCanvasPaneDimensions = throttle(this.setNewCanvasPanelDimensions, 300)
    this.state = testState.state
  }

  setActiveSceneIndex = (newSceneIndex: number) => {
    this.renderActiveScene(newSceneIndex)
    this.fabricCanvas?.requestRenderAll()
    return this.setState({
      editorState: {
        ...this.state.editorState,
        activeSceneIndex: newSceneIndex
      }
    })
  }

  renderActiveScene = (renderScreenIndex: number) => {
    const currentSceneObject = this.state.project.scenes[renderScreenIndex]

    for (const [uniqueGlobalId, sceneObjectOptions] of Object.entries(currentSceneObject.activeSceneObjects)) {
      const activeObject = this.liveObjectsDict[uniqueGlobalId]
      const globalObjects = this.state.project.globalObjects
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
    // We may want to implemenet a specific function for other objects here
    //  eg. Circles need to update their radius instead of their width + height
    this.fabricCanvas.on("object:scaling", function (e: any) {
      const target = e.target
      if (target && target.type === 'rect') {
        console.log('rect scaling')
        const width = Math.round(target.width * target.scaleX) || 1
        const height = Math.round(target.height * target.scaleY) || 1
        target.set({ width, height, scaleX: 1, scaleY: 1 })
      }
    });

    // Init complete editor state
    const json: any = { objects: Object.values(this.state.project.globalObjects) }
    this.fabricCanvas.loadFromJSON(json, () => {
      this.initViewportRect()
      this.renderActiveScene(this.state.editorState.activeSceneIndex)
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
  setOnFabricObject = (obj: any, setting: string, val: any) => {
    if (obj) {
      // get active scene and options for object in active scene then add/modify corresponding setting to value
      const activeScene = this.state.project.scenes[this.state.editorState.activeSceneIndex]
      let currentOptions = activeScene.activeSceneObjects[obj?.uniqueGlobalId]
      activeScene.activeSceneObjects[obj?.uniqueGlobalId] = { ...currentOptions, [setting]: val }

      obj.set({ [setting]: val })
      obj.setCoords();
      obj?.canvas?.renderAll()
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
        <globalContext.Provider value={contextValue}>
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
        </globalContext.Provider>
      </div>
    );
  }
}

export { App, globalContext };
export type { globalContextType };

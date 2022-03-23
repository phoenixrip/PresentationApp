import { fabric } from "fabric";
import React, { Component } from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import { ScenesPane } from "./ScenesPane/ScenesPane";
import FabricCanvasContainer from "./FabricCanvasContainer";
import { InspectorContainer } from "./InspectorPane/InspectorContainer";

import "./styles.css";
import "react-reflex/styles.css";
import "./dark.css";
import { LayersPaneContainer } from "./LayersPane/LayersPaneContainer";

fabric.Object.prototype.set({
  hoverCursor: 'default',
  originX: 'center',
  originY: 'center',
  cornerStyle: 'circle',
  transparentCorners: false,
  cornerColor: '#4AB9D1',
  cornerStrokeColor: '#fff',
  borderColor: '#70ABFF'
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
          type: 'rect',
          fill: 'orange',
        },
        "wda1-ew21-dhftft-2313": {
          type: 'circle',
          radius: 20
        },
      },
      scenes: [
        {
          sceneSettings: {},
          activeSceneObjects: {
            "2131-eww2w-2312-dadaa": {
              left: 0,
              top: 0
            }
          }
        },
        {
          sceneSettings: {},
          activeSceneObjects: {
            "2131-eww2w-2312-dadaa": {
              left: 50,
              top: 0
            }
          }
        }
      ]
    },
    editorState: {
      activeSceneIndex: 0
    }
  }
}

interface globalAppStateType {
    tick: Boolean,
    isInitted: Boolean,
    project: {
      settings: Object,
      globalObjects: Object,
      scenes: Array<Object>
    },
    editorState: {
      activeSceneIndex: Number
    },
    userSettings: {
      name: String
    }
}

interface globalContextType {
  fabricCanvas: fabric.Canvas | null;
  state: globalAppStateType
}

const globalContext = React.createContext<globalContextType>({
  fabricCanvas: null,
  state: testState.state
});

class App extends Component<{}, globalAppStateType> {
  fabricCanvas: fabric.Canvas | null;
  constructor(props: Object) {
    super(props);
    this.fabricCanvas = null;
    this.state = testState.state
  }

  initFabricCanvas = (domCanvas: HTMLCanvasElement) => {
    this.fabricCanvas = new fabric.Canvas(domCanvas);
    this.fabricCanvas.on("after:render", this.updateTick)
    
    const exampleRect: fabric.Rect = new fabric.Rect({
      width: 200,
      height: 200,
      fill: "orange"
    })
    this.fabricCanvas.add(exampleRect)
    return this.setState({ isInitted: true });
  };

  updateTick = () => { console.log(this.state.tick); return this.setState({tick: !this.state.tick})} 

  render() {
    const contextValue: any = {
      fabricCanvas: this.fabricCanvas,
      state: this.state
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
                  <div style={{ height: "100%", backgroundColor: "#29252F" }}>
                    Toolbar
                  </div>
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
                      <FabricCanvasContainer
                        initFabricCanvas={this.initFabricCanvas}
                        dimensions={{ width: 100, height: 100 }}
                      />
                    </ReflexElement>
                    <ReflexElement
                      size={300}
                      style={{ backgroundColor: "green" }}
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

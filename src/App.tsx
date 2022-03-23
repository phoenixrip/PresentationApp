import { fabric } from "fabric";
import React, { Component } from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import { ScenesPane } from "./ScenesPane/ScenesPane";
import FabricCanvasContainer from "./FabricCanvasContainer";
import { InspectorContainer } from "./InspectorPane/InspectorContainer";

import "./styles.css";
import "react-reflex/styles.css";
import "./dark.css";

const testState = {
  fabricCanvas: null,
  state:	{
    userSettings: {
      name: "Inspector Payne"
    },
    
    project: { 
      settings: {
        theme: "dark"
      },
      globalObjects: { "2131-eww2w-2312-dadaa": {},
              "wda1-ew21-dhftft-2313": {},
      },
      scenes: [ {"2131-eww2w-2312-dadaa": {left: 0, top: 0}},
          {"2131-eww2w-2312-dadaa": {left: 50, top: 0}}
      ]
    }
  }
}

interface globalContextType {
  fabricCanvas: fabric.Canvas | null;
  state: any
}
const globalContext = React.createContext<globalContextType>({
  fabricCanvas: null,
  state: null
});

class App extends Component {
  fabricCanvas: fabric.Canvas | null;
  constructor(props: Object) {
    super(props);
    this.fabricCanvas = null;
    this.state = {
      isInitted: false,
      userSettings: {},
      documentSettings: {}
    };
    this.state = testState.state
  }
  initFabricCanvas = (domCanvas: HTMLCanvasElement) => {
    this.fabricCanvas = new fabric.Canvas(domCanvas);
    this.fabricCanvas.add(
      new fabric.Rect({
        width: 200,
        height: 200,
        fill: "orange"
      })
    );
    return this.setState({ isInitted: true });
  };

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
            <ReflexElement minSize={100} maxSize={250}>
              <ScenesPane />
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
              <ReflexContainer orientation="horizontal">
                <ReflexElement size={78}>
                  <div style={{ height: "100%", backgroundColor: "purple" }}>
                    Toolbar
                  </div>
                </ReflexElement>
                <ReflexElement>
                  <ReflexContainer orientation="vertical">
                    <ReflexElement size={200} minSize={200}>
                      Layers
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
                      size={200}
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

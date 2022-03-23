import { fabric } from "fabric";
import React, { Component } from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import { ScenesPane } from "./ScenesPane/ScenesPane";
import FabricCanvasContainer from "./FabricCanvasContainer";
import { InspectorContainer } from "./InspectorPane/InspectorContainer";

import "./styles.css";
import "react-reflex/styles.css";
import "./dark.css";

interface globalContextType {
  fabricCanvas: fabric.Canvas | null;
  userSettings: Object;
  documentSettings: Object;
}
const globalContext = React.createContext<globalContextType>({
  fabricCanvas: null,
  userSettings: {},
  documentSettings: {}
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
    return (
      <div>
        <globalContext.Provider
          value={{
            fabricCanvas: this.fabricCanvas,
            state: this.state
          }}
        >
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

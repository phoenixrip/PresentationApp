import { fabric } from "fabric";
import React, { Component } from "react";
import "./styles.css";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import "react-reflex/styles.css";
import { ScenesPane } from "./ScenesPane/ScenesPane";
import FabricCanvasContainer from "./FabricCanvasContainer";

class App extends Component {
  render() {
    return (
      <div>
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
                    <FabricCanvasContainer dimensions={{}} />
                  </ReflexElement>
                  <ReflexElement
                    size={200}
                    style={{ backgroundColor: "green" }}
                  >
                    Inspector
                  </ReflexElement>
                </ReflexContainer>
              </ReflexElement>
            </ReflexContainer>
          </ReflexElement>
        </ReflexContainer>
      </div>
    );
  }
}

export default App;

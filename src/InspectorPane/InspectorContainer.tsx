import React, { useContext } from "react";
import { globalContext } from "../App";
import { globalContextType } from "../App";
import { InputNumber, Collapse } from 'antd';
const { Panel } = Collapse;
import { tsConstructorType } from "@babel/types";

const InspectorContainer = (props: Object) => {
  const context: globalContextType = useContext(globalContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()

  return (
    <>
      {!selection &&
        <p>no element selected</p>
      }

      {selection &&
        <>
          <Collapse defaultActiveKey={["1", "2"]}>
            <Panel header="Dimensions" key="1">

              <InputNumber addonBefore="Width:"
                min={0}
                max={1000}
                precision={0}
                value={selection.width}
                onChange={e => {
                  selection.set("width", e);
                  selection.setCoords();
                  selection.canvas.renderAll()
                }} />
              <InputNumber addonBefore="Height:"
                min={0}
                max={1000}
                precision={0}
                value={selection.height}
                onChange={e => {
                  selection.set("height", e);
                  selection.setCoords();
                  selection.canvas.renderAll()
                }} />
              <InputNumber addonBefore="Angle:"
                min={-360}
                max={360}
                precision={0}
                value={selection.angle}
                onChange={e => {
                  selection.set("angle", e);
                  selection.setCoords();
                  selection.canvas.renderAll()
                }} />
            </Panel>
            <Panel header ="Colour" key="2">
              <InputNumber addonBefore="Red:"
              min={0}
              max={255}
              precision={0}
              />
                <InputNumber addonBefore="Green:"
              min={0}
              max={255}
              precision={0}
              />
              <InputNumber addonBefore="Blue:"
              min={0}
              max={255}
              precision={0}
              />
            </Panel>
          </Collapse>

          <pre>{selection && JSON.stringify(selection, null, 4)}</pre>
        </>
      }
    </>
  );
};

export { InspectorContainer };

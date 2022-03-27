import React, { useContext } from "react";
import { editorContext, EditorContextTypes } from "../Editor";
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';
const { Panel } = Collapse;
import { CirclePicker } from 'react-color';
import { fabric } from "fabric";
import { Canvas } from "fabric/fabric-impl";
import { PositionControlPanel } from "./ControlPanels/PositionControlPanel";
import { DimensionsControlPanel } from "./ControlPanels/DimensionsControlPanel";
import { FillControlPanel } from "./ControlPanels/FillControlPanel";
import { BorderControlPanel } from "./ControlPanels/BorderControlPanel";
import { ShadowControlPanel } from "./ControlPanels/ShadowControlPanel";

const InspectorContainer = (props: Object) => {
  const context: EditorContextTypes = useContext(editorContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()
  const setOnFabricObject: Function = context.setOnFabricObject

  if (selection) console.log("strokedash", !selection?.strokeDashArray)
  return (
    <>
      {!selection &&
        <p>no element selected</p>
      }
      {selection &&
        <>
          <Collapse defaultActiveKey={["1", "2", "3", "4", "5"]}>
            <Panel header="Dimensions" key="1">
              <DimensionsControlPanel />
            </Panel>
            <Panel header="Position" key="2">
              <PositionControlPanel />
            </Panel>
            <Panel header="Fill" key="3">
              <FillControlPanel />
            </Panel>
            <Panel header="Border" key="4">
              <BorderControlPanel />
            </Panel>
            <Panel header="Shadow" key="5">
              <ShadowControlPanel />
            </Panel>
          </Collapse>

          <pre>{selection && JSON.stringify(selection, null, 4)}</pre>
        </>
      }
    </>
  );
};

export { InspectorContainer };

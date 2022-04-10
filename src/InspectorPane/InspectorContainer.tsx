//@ts-nocheck
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
<<<<<<< HEAD
import { GradientControlPanel } from "./ControlPanels/GradientControlPanel"
=======
import { EditorComponentClass } from "../CustomInteractionModules/EditorComponentClass";
import { MultiChoiceLabelEditorComponent } from "../CustomInteractionModules/MultiChoiceLabel/EditorComponent";
>>>>>>> 85d01acdccb131b1a5796924ace39459c68bbd2a

interface Props {
  availiableCustomInteractionModules: {
    [key: string]: MultiChoiceLabelEditorComponent
  }
}
const InspectorContainer = (props: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()
  const setOnFabricObject: Function = context.setOnFabricObject

  // if (selection) console.log("strokedash", !selection?.strokeDashArray)
  return (
    <>
      {!selection &&
        <p>no element selected</p>
      }
      {
        selection?.type === 'activeSelection' &&
        <Button onClick={(e) => context.handleGroupObjects()}>GROUP OBJECTS</Button>
      }
      {
        selection?.type === 'activeSelection' &&
        Object.entries(props.availiableCustomInteractionModules)
          .map(([customComponentKey, customInteractionEditorClass]) => {
            const thisClass = props.availiableCustomInteractionModules[customComponentKey]
            const isAddable = thisClass.checkIfSelectionInitable(context.fabricCanvas)
            if (isAddable) {
              return (
                <Button
                  onClick={() => context.handleInitCustomInteractionComponent(customInteractionEditorClass)}
                  key={thisClass.displayName}>
                  Addable: {thisClass.displayName}
                </Button>
              )
            } else {
              return null
            }
            console.log({ isAddable })
          })
      }
      {selection &&
        <>
          <Collapse defaultActiveKey={[]}>
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
            <Panel header="Gradient" key="6">
              <GradientControlPanel />
            </Panel>
            {
              selection.type === 'image' &&
              <Panel header="Image" key="7">
                Image settings
                <Button onClick={e => {
                  //@ts-ignore
                  var filter = new fabric.Image.filters.Blur({
                    blur: 0.5
                  });
                  selection.filters.push(filter)
                  selection.applyFilters()
                  // var filter = new fabric.Image.filters.Convolute({
                  //   matrix: [1 / 9, 1 / 9, 1 / 9,
                  //   1 / 9, 1 / 9, 1 / 9,
                  //   1 / 9, 1 / 9, 1 / 9]
                  // });
                  // selection.filters.push(filter)
                  // selection.applyFilters()
                  context.fabricCanvas?.requestRenderAll()
                }}>
                  BLUR
                </Button>
              </Panel>
            }
          </Collapse>

          {/* <pre>{selection && JSON.stringify(selection, null, 4)}</pre> */}
        </>
      }
    </>
  );
};

export { InspectorContainer };

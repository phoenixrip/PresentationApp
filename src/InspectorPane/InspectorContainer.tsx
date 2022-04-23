//@ts-nocheck
import React, { useContext } from "react";
import { editorContext, EditorContextTypes } from "../Editor";
import { Button, Collapse } from 'antd';
const { Panel } = Collapse;
import { fabric } from "fabric";
import { DimensionsControlPanel } from "./ControlPanels/DimensionsControlPanel";
import { FillControlPanel } from "./ControlPanels/FillControlPanel";
import { BorderControlPanel } from "./ControlPanels/BorderControlPanel";
import { ShadowControlPanel } from "./ControlPanels/ShadowControlPanel";
import { MultiChoiceLabelEditorComponent } from "../CustomInteractionModules/MultiChoiceLabel/EditorComponent";
import { TextControlPanel } from "./ControlPanels/TextControlPanel"

interface Props {
  availiableCustomInteractionModules: {
    [key: string]: MultiChoiceLabelEditorComponent
  },
}
const InspectorContainer = ({ availiableCustomInteractionModules }: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()

  return (
    <>
      {!selection &&
        <p>Project inspector pane</p>
      }
      {
        selection?.type === 'activeSelection' &&
        <Button onClick={(e) => context.handleGroupObjects()}>GROUP OBJECTS</Button>
      }
      {
        selection?.type === 'activeSelection' &&
        Object.entries(availiableCustomInteractionModules)
          .map(([customComponentKey, customInteractionEditorClass]) => {
            const thisClass = availiableCustomInteractionModules[customComponentKey]
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
              <DimensionsControlPanel selection={selection} />
            </Panel>
            {(selection.type !== "CTextBox" || selection.type !== "TextBox") &&
              < Panel header="Fill" key="2">
                <FillControlPanel selection={selection} />
              </Panel>
            }
            <Panel header="Border" key="3">
              <BorderControlPanel selection={selection} />
            </Panel>
            <Panel header="Shadow" key="4">
              <ShadowControlPanel selection={selection} />
            </Panel>
            {selection.type === "FillableTextBox" &&
              <Panel header="Text" key="5">
                <TextControlPanel selection={selection} />
              </Panel>
            }
            {
              selection.type === 'image' &&
              <Panel header="Image" key="6">
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
        </>
      }
    </>
  );
};

export { InspectorContainer };

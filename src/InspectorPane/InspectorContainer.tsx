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
import { ProjectParaStylesController } from "../Utils/CustomControllerClasses/ProjectParaStylesController";
import c from './InspectorContainer.module.scss'
import { UseFaIcon } from "../Utils/UseFaIcon";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { ArrangeControls } from "./ArrangeControls";
import { PathCommandsContainer } from "./ControlPanels/PathCommands/PathCommandsContainer";

interface Props {
  availiableCustomInteractionModules: {
    [key: string]: MultiChoiceLabelEditorComponent
  },
  projectParaStylesController: ProjectParaStylesController
}
const InspectorContainer = ({ availiableCustomInteractionModules, projectParaStylesController }: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()

  function handleInspectorPaneMouseDown(e: MouseEvent) {
    if (selection && selection.editingType === 'fill') {
      selection.exitFillEditingMode()
    }
    console.log('handleInspectorPaneMouseDown', e)
  }
  return (
    <div className={c.container} onMouseDown={handleInspectorPaneMouseDown}>
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
      {
        selection &&
        <ArrangeControls
          selection={selection}
        />
      }
      {selection &&
        <>
          <Collapse
            destroyInactivePanel={true}
            expandIcon={({ isActive }) => isActive ? <UseFaIcon icon={faMinus} /> : <UseFaIcon icon={faPlus} />}
            defaultActiveKey={['5', '2']}
            className={c.customCollapse}>
            <Panel header="Dimensions" key="1">
              <DimensionsControlPanel selection={selection} />
            </Panel>
            {selection.type !== 'BodyTextbox' &&
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
            {selection.type === "BodyTextbox" &&
              <Panel header="Text" key="5">
                <TextControlPanel
                  selection={selection}
                  projectParaStylesController={projectParaStylesController}
                />
              </Panel>
            }
            {
              selection.type === 'image' &&
              <Panel header="Image" key="6">
                Image settings
                <Button onClick={e => {
                  //@ts-ignore
                  var filter = new fabric.Image.filters.Blur({ blur: 0.5 })
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
            {
              selection.type === 'path' &&
              <Panel header='Path commands' key='pathCommands' className={c.pathCommandsPanel}>
                <PathCommandsContainer
                  selection={selection as fabric.Path}
                />
              </Panel>
            }
          </Collapse>
        </>
      }
    </div>
  );
};

export { InspectorContainer };

import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, InputNumber } from "antd"
import { EquationInput } from "../EquationInput";

interface Props {
	selection: any | undefined
  }


const PositionControlPanel = ({selection}: Props) => {
  const context: EditorContextTypes = useContext(editorContext);

  const setOnFabricObject: Function = context.setOnFabricObject

  return (
    <>
      <EquationInput
        addonBefore="X:"
        addonAfter="px"
        min={-1000}
        max={1000}
        precision={0}
        value={selection.left}
        onChange={(e: any) => { setOnFabricObject(selection, { left: e.value }) }} />
      <EquationInput
        addonBefore="Y:"
        addonAfter="px"
        min={-1000}
        max={1000}
        precision={0}
        value={selection.top}
        onChange={(e: any) => { setOnFabricObject(selection, { top: e.value }) }} />
      <Button onClick={() => setOnFabricObject(selection, { flipX: !selection.flipX })}> Flip Horizontal</Button>
      <Button onClick={() => setOnFabricObject(selection, { flipY: !selection.flipY })}> Flip Vertical</Button>
      <Button onClick={() => setOnFabricObject(selection, { angle: selection.angle + 90 })}>Rotate</Button>
      <Button onClick={() => setOnFabricObject(selection, { angle: selection.angle - 90 })}>Rotate other way</Button>

    </>
  )

}

export { PositionControlPanel }
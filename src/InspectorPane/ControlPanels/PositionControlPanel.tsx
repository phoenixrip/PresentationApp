import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, InputNumber } from "antd"

function PositionControlPanel() {
  const context: EditorContextTypes = useContext(editorContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()
  const setOnFabricObject: Function = context.setOnFabricObject

  return (
    <>
      <InputNumber addonBefore="X:"
        addonAfter="px"
        min={-1000}
        max={1000}
        precision={0}
        value={selection.left}
        onChange={(e) => { setOnFabricObject(selection, "left", e) }} />
      <InputNumber addonBefore="Y:"
        addonAfter="px"
        min={-1000}
        max={1000}
        precision={0}
        value={selection.top}
        onChange={(e) => { setOnFabricObject(selection, "top", e) }} />
      <Button onClick={() => setOnFabricObject(selection, "flipX", !selection.flipX)}> Flip Horizontal</Button>
      <Button onClick={() => setOnFabricObject(selection, "flipY", !selection.flipY)}> Flip Vertical</Button>
      <Button onClick={() => setOnFabricObject(selection, "angle", selection.angle + 90)}>Rotate</Button>
      <Button onClick={() => setOnFabricObject(selection, "angle", selection.angle - 90)}>Rotate other way</Button>

    </>
  )

}

export { PositionControlPanel }
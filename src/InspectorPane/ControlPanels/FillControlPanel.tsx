import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { CirclePicker } from 'react-color';

function FillControlPanel() {
  const context: EditorContextTypes = useContext(editorContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()
  const setOnFabricObject: Function = context.setOnFabricObject

  return (
    <>
      <CirclePicker
        color={selection.fill}
        onChange={e => {
          setOnFabricObject(selection, "fill", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)
        }} />
      {/* <ChromePicker
                color={selection.fill}
                onChange={e => {
                  setOnFabricObject(selection, "fill", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)
                }} /> */}
    </>
  )

}

export { FillControlPanel }
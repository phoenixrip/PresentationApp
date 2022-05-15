import { RgbaStringColorPicker } from "react-colorful"
import { CustomFabricObject } from "../Types/CustomFabricTypes"

interface ISolidFillEditorProps {
  fillValue: string,
  liveObject: CustomFabricObject,
  onChange(color: string): void
}

function SolidFillEditor(props: ISolidFillEditorProps) {
  return (
    <div >
      <RgbaStringColorPicker
        color={props.fillValue}
        onChange={props.onChange} />
    </div>
  )
}

export {
  SolidFillEditor
}
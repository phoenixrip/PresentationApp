import { useContext, useState } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';
import { EquationInput } from "../EquationInput";
import { Colorpicker } from "../../Colorpickers/Colorpicker";

interface Props {
  selection: any | undefined
}

const strokeDashToString: { [key: string]: string } = {
  "[5,5]": "dotted",
  "[10,10]": "dashed",
  "[15,15]": "largeDashed",
  "undefined": "solid",
  "[]": "solid"
}

const stringToStrokeDash: { [key: string]: [] | [number, number] } = {
  "solid": [],
  "dotted": [5, 5],
  "dashed": [10, 10],
  "largeDashed": [15, 15]
}

const BorderControlPanel = ({ selection }: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const setOnFabricObject: Function = context.setOnFabricObject
  const [strokeDashState, setStrokeDashState] = useState(strokeDashToString[selection.strokeDashArray])

  const handleStrokeDashSelect = (e: any) => {
    const newStrokeDashArray = stringToStrokeDash[e.target.value]
    setOnFabricObject(selection, { strokeDashArray: newStrokeDashArray })
    setStrokeDashState(strokeDashToString[JSON.stringify(newStrokeDashArray)])
  }

  return (
    <>

      <EquationInput
        size={context.state.antdSize}
        addonAfter="px"
        min={0}
        max={1000}
        value={selection.strokeWidth || 0}
        style={{ width: "30%" }}
        onChange={(e: any) => {
          setOnFabricObject(selection, { strokeWidth: e.value })
        }} />

      <Radio.Group value={strokeDashState} size="small" style={{marginLeft: "30px" }}>
        <Radio.Button value="solid" onClick={handleStrokeDashSelect}>-</Radio.Button>
        <Radio.Button value="dotted" onClick={handleStrokeDashSelect}>...</Radio.Button>
        <Radio.Button value="dashed" onClick={handleStrokeDashSelect}>---</Radio.Button>
        <Radio.Button value="largeDashed" onClick={handleStrokeDashSelect}>- -</Radio.Button>
      </Radio.Group>

      <Colorpicker
        color={selection.stroke || "rgba(0,0,0,1)"}
        onChange={(e: any) => {
          setOnFabricObject(selection, { stroke: `rgba(${e.r},${e.g},${e.b},${e.a})` })
        }} />

    </>
  )
}

export { BorderControlPanel }
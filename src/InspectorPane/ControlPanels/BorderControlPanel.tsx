import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';
import { EquationInput } from "../EquationInput";
import { Colorpicker } from "./Colorpicker";

interface Props {
	selection: any | undefined
  }


const BorderControlPanel = ({selection}: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const setOnFabricObject: Function = context.setOnFabricObject

  const getStrokeDashState = () => {
    switch(selection.strokeDashArray) {
      case [5, 5]:
        return "dotted"
      case [10, 10]:
        return "dashed"
      case [15, 15]:
        return "large-dashed"
      default:
        return "solid"
    }
  }

  const handleStrokeDashSelect = (e: any) => {
    let newStrokeDashArray: [number, number] | []
    switch(e.target.value) {
      case "dotted":
        newStrokeDashArray = [5, 5]
        break
      case "dashed":
        newStrokeDashArray = [10, 10]
        break
      case "large-dashed":
        newStrokeDashArray = [15, 15]
        break
      default:
        newStrokeDashArray = []
        break
    }
    setOnFabricObject(selection, {strokeDashArray: newStrokeDashArray})
  }

  return (
    <>
      <Radio.Group value={getStrokeDashState()} size="small" style={{ marginTop: 16 }}>
        <Radio.Button value="solid" onClick={handleStrokeDashSelect}>-</Radio.Button>
        <Radio.Button value="dotted" onClick={handleStrokeDashSelect}>...</Radio.Button>
        <Radio.Button value="dashed" onClick={handleStrokeDashSelect}>---</Radio.Button>
        <Radio.Button value="large-dashed" onClick={handleStrokeDashSelect}>- -</Radio.Button>
      </Radio.Group>

      <EquationInput
        addonBefore="Thickness"
        addonAfter="px"
        min={0}
        max={1000}
        value={selection.strokeWidth || 0}
        onChange={(e: any) => {
          setOnFabricObject(selection, {strokeWidth: e.value})
        }} />

      <Colorpicker
        color={selection.stroke || "rgba(0,0,0,1)"}
        onChange={(e: any) => {
          setOnFabricObject(selection, {stroke: `rgba(${e.r},${e.g},${e.b},${e.a})`})
        }} />


    </>
  )
}

export { BorderControlPanel }
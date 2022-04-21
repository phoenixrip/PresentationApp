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
    return "lol"
  }

  return (
    <>
      <Radio.Group value={getStrokeDashState()} size="small" style={{ marginTop: 16 }}>
        <Radio.Button value="solid" onClick={() => { }}>-</Radio.Button>
        <Radio.Button value="dotted" onClick={() => { }}>...</Radio.Button>
        <Radio.Button value="dashed" onClick={() => { }}>---</Radio.Button>
        <Radio.Button value="large-dashed" onClick={() => { }}>- -</Radio.Button>
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
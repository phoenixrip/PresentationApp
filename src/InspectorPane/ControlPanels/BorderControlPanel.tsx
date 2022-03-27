import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';

function BorderControlPanel() {
  const context: EditorContextTypes = useContext(editorContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()
  const setOnFabricObject: Function = context.setOnFabricObject

  const getStrokeDashState = () => {
    return "lol"
  }

  return (
    <>
      <CirclePicker
        color={selection.stroke || "rgba(0,0,0,1)"}
        onChange={e => {
          setOnFabricObject(selection, {stroke: `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`})
        }} />
      <InputNumber
        addonBefore="Thickness"
        addonAfter="px"
        min={0}
        max={1000}
        value={selection.strokeWidth || 0}
        onChange={e => {
          setOnFabricObject(selection, {strokeWidth: e})
        }} />

      <Radio.Group value={getStrokeDashState()} size="small" style={{ marginTop: 16 }}>
        <Radio.Button value="solid" onClick={() => { }}>-</Radio.Button>
        <Radio.Button value="dotted" onClick={() => { }}>...</Radio.Button>
        <Radio.Button value="dashed" onClick={() => { }}>---</Radio.Button>
        <Radio.Button value="large-dashed" onClick={() => { }}>- -</Radio.Button>
      </Radio.Group>
    </>
  )
}

export { BorderControlPanel }
import { useContext, useState } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, InputNumber, Collapse, Switch, Radio, Row, Input, Select } from 'antd';
import { EquationInput } from "../EquationInput";
import { FillPicker } from "../../FillPicker/FillPicker";
import { SkinnyNumberInput } from "../SkinnyNumberInput";
import { valueType } from "antd/lib/statistic/utils";
import { CustomFabricObject } from "../../Types/CustomFabricTypes";

interface Props {
  selection: CustomFabricObject
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
  // const [strokeDashState, setStrokeDashState] = useState(strokeDashToString[selection.strokeDashArray])

  const handleStrokeDashSelect = (e: any) => {
    const newStrokeDashArray = stringToStrokeDash[e.target.value]
    setOnFabricObject(selection, { strokeDashArray: newStrokeDashArray })
    // setStrokeDashState(strokeDashToString[JSON.stringify(newStrokeDashArray)])
  }

  return (
    <Row justify='space-between'>
      <SkinnyNumberInput
        value={selection.strokeWidth || 0}
        onChange={(newValue: valueType) => {
          const setObject = { strokeWidth: newValue }
          setOnFabricObject(selection, setObject)
        }} />
      <FillPicker
        fillLocation='stroke'
        title='Border fill'
        liveObject={selection}
        fillValue={selection.stroke}
        open={(selection?.editingType === 'fill' && selection.editingLocation === 'stroke') ? true : false}
        onChange={(color: string) => {
          setOnFabricObject(selection, { stroke: color })
        }} />
      { }
      <Input value={selection?.strokeDashArray?.toString?.() || ''}
        onChange={(e) => {
          const newArrayValue = e.target.value
            .split(',')
            .map(string => parseInt(string))
            .filter(val => (typeof val === 'number'))

          if (!newArrayValue.length) {
            setOnFabricObject(selection, { strokeDashArray: null })
          } else {
            setOnFabricObject(selection, { strokeDashArray: newArrayValue })
          }
        }} />
      <SkinnyNumberInput
        value={selection?.strokeDashOffset || 0}
        onChange={(value) => {
          setOnFabricObject(selection, { strokeDashOffset: value })
        }} />
      <Select value={selection?.strokeLineCap || 'square'} onChange={(newValue) => {
        setOnFabricObject(selection, { strokeLineCap: newValue })
      }}>
        <Select.Option value='round'>Round</Select.Option>
        <Select.Option value='butt'>butt</Select.Option>
        <Select.Option value='square'>square</Select.Option>
      </Select>
      <Select value={selection?.strokeLineJoin || 'miter'} onChange={(newValue) => {
        setOnFabricObject(selection, { strokeLineJoin: newValue })
      }}>
        <Select.Option value='bevel'>bevel</Select.Option>
        <Select.Option value='round'>round</Select.Option>
        <Select.Option value='miter'>miter</Select.Option>
      </Select>
    </Row>
  )
}

export { BorderControlPanel }

/*
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

      <Radio.Group value={strokeDashState} size="small" style={{ marginLeft: "30px" }}>
        <Radio.Button value="solid" onClick={handleStrokeDashSelect}>-</Radio.Button>
        <Radio.Button value="dotted" onClick={handleStrokeDashSelect}>...</Radio.Button>
        <Radio.Button value="dashed" onClick={handleStrokeDashSelect}>---</Radio.Button>
        <Radio.Button value="largeDashed" onClick={handleStrokeDashSelect}>- -</Radio.Button>
      </Radio.Group>
*/
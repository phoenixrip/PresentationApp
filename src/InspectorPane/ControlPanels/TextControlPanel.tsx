import { useContext, useEffect, useState } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { ChromePicker, CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio, Dropdown, Menu, Checkbox } from 'antd';
import { EquationInput } from "../EquationInput";
import { arrayTypeAnnotation } from "@babel/types";
import Password from "antd/lib/input/Password";
import { CustomFabricOptions } from "../../Types/CustomFabricTypes";

interface Props {
  selection: any | undefined
}

interface FabricTextStyles {
  stroke: string,
  strokeWidth: string,
  fill: string,
  fontFamily: string,
  fontSize: string,
  fontWeight: string,
  fontStyle: string,
  underline: string,
  overline: string,
  linethrough: string,
  deltaY: string,
  textBackgroundColor: string
}


const TextControlPanel = ({ selection }: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const setOnFabricObject: Function = context.setOnFabricObject
  const setOnGlobalObject: Function = context.setOnGlobalObject

  const [selectedTextIndices, setSelectedTextIndices] = useState([selection.selectionStart, selection.selectionEnd])
  const [subselectionActive, setSubselectionActive] = useState(false)
  const [sharedAttributes, setSharedAttributes] = useState({} as FabricTextStyles)
  const [tick, setTick] = useState(false)

  useEffect(() => {
    selection.on("selection:changed", () => {
      checkSelection()
    })

    return () => {
      selection.off("selection:changed")
    }
  }, [])

  const checkSelection = () => {
    if (selection.isEditing) {
      if (!subselectionActive) setSubselectionActive(true)
      const newSelectedIndices = [selection.selectionStart, selection.selectionEnd]
      if (newSelectedIndices !== selectedTextIndices) {
        setSelectedTextIndices(newSelectedIndices)
        if (newSelectedIndices[0] !== newSelectedIndices[1]) setSharedAttributes(findAllSharedAttributesAndValues(selection.getSelectionStyles()))
      }
    } else {
      setSubselectionActive(false)
    }
  }


  const findAllSharedAttributesAndValues = (arr: Array<{ [key: string]: any }>) => {
    let sharedAttributes = arr[0]
    for (let i = 1; i < arr.length; i++) {
      let newSharedAttributes = {} as { [key: string]: any }
      Object.entries(sharedAttributes).forEach(([key, value]) => {
        if (sharedAttributes[key] === arr[i][key]) {
          newSharedAttributes[key] = value
        }
      })
      sharedAttributes = newSharedAttributes
    }
    return sharedAttributes as FabricTextStyles
  }


  const handleStyleChange = (options: any) => {
    if (selection.isEditing) {
      selection.setSelectionStyles(options)
      setOnGlobalObject(selection, options)
      context.fabricCanvas?.requestRenderAll()
    } else {
      setOnFabricObject(selection, options)
    }
    checkSelection()
  }


  return (
    <>
      <Checkbox checked={subselectionActive ? (sharedAttributes?.fontWeight === "normal" && sharedAttributes?.fontStyle === "normal") || (!sharedAttributes?.fontWeight && !sharedAttributes?.fontStyle)  : selection.fontWeight === "normal" && selection.fontStyle === "normal"} onClick={(e: any) => handleStyleChange({ fontWeight: "normal", fontStyle: "normal" })}>i</Checkbox>
      <Checkbox checked={subselectionActive ? sharedAttributes?.fontWeight === "bold" : selection.fontWeight === "bold"} onClick={(e: any) => handleStyleChange({ fontWeight: e.target.checked ? "bold" : "normal" })}><span style={{ fontWeight: "bold" }}>i</span></Checkbox>
      <Checkbox checked={subselectionActive ? sharedAttributes?.fontStyle === "italic" : selection.fontWeight === "bold"} onClick={(e: any) => handleStyleChange({ fontStyle: e.target.checked ? "italic" : "normal" })}><span style={{ fontStyle: "italic" }}>i</span></Checkbox>
      <EquationInput addonBefore="Font Size"
        addonAfter="px"
        min={1}
        precision={0}
        value={subselectionActive ? sharedAttributes?.fontSize || selection.fontSize : selection.fontSize}
        onChange={(e: any) => handleStyleChange({ fontSize: e.value })}
      />
      <Dropdown overlay={<Menu>
        {context.fonts.map((font) => <Menu.Item onClick={(e: any) => { }}>{font}</Menu.Item>)}
      </Menu>} >
        <Button>{subselectionActive ? sharedAttributes?.fontFamily || selection.fontFamily : selection.fontFamily}</Button>
      </Dropdown>
      <Checkbox checked={subselectionActive ? sharedAttributes?.overline : selection.overline} onClick={(e: any) => handleStyleChange({ overline: e.target.checked })}>‾</Checkbox>
      <Checkbox checked={subselectionActive ? sharedAttributes?.linethrough : selection.linethrough} onClick={(e: any) => handleStyleChange({ linethrough: e.target.checked })}>-</Checkbox>
      <Checkbox checked={subselectionActive ? sharedAttributes?.underline : selection.underline} onClick={(e: any) => handleStyleChange({ underline: e.target.checked })}>_</Checkbox>
      <ChromePicker
        color={subselectionActive ? sharedAttributes?.fill || selection.fill : selection.fill}
        onChange={e => {
          handleStyleChange({ fill: `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})` })
        }} />

      <Checkbox checked={subselectionActive ? sharedAttributes?.textBackgroundColor || selection.textBackgroundColor : selection.textBackgroundColor} onClick={(e: any) => handleStyleChange({ textBackgroundColor: e.target.checked ? "rgba(255,255,255,1)" : null })}>BG Color</Checkbox>
      {((subselectionActive &&  sharedAttributes?.textBackgroundColor) || selection.textBackgroundColor) && <ChromePicker
        color={subselectionActive ? sharedAttributes?.textBackgroundColor || selection.textBackgroundColor : selection.textBackgroundColor}
        onChange={e => {
          handleStyleChange({ textBackgroundColor: `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})` })
        }} />
      }
    </>
  )
}

export { TextControlPanel }
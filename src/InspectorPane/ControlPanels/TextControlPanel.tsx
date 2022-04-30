import { useContext, useEffect, useState } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { ChromePicker, CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio, Dropdown, Menu, Checkbox, Select, Row } from 'antd';
import { EquationInput } from "../EquationInput";
import { customAttributesToIncludeInFabricCanvasToObject } from "../../Utils/consts";
import { cornersOfRectangle } from "@dnd-kit/core/dist/utilities/algorithms/helpers";
import { Colorpicker } from "../../Colorpickers/Colorpicker";

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
  underline: boolean,
  overline: boolean,
  linethrough: boolean,
  deltaY: string,
  textBackgroundColor: string
}


const TextControlPanel = ({ selection }: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const setOnFabricObject: Function = context.setOnFabricObject
  const setOnGlobalObject: Function = context.setOnGlobalObject

  const [selectedTextIndices, setSelectedTextIndices] = useState([selection.selectionStart, selection.selectionEnd])
  const [sharedAttributes, setSharedAttributes] = useState({} as FabricTextStyles)
  const [colorMode, setColorMode] = useState("TEXT")


  useEffect(() => {
    checkSelection()

    selection.on("selection:changed", checkSelection)

    return () => {
      selection.off("selection:changed", checkSelection)
    }
  }, [])

  const checkSelection = () => {
    if (selection.isEditing) {
      const newSelectedIndices = [selection.selectionStart, selection.selectionEnd]
      if (newSelectedIndices !== selectedTextIndices) {
        setSelectedTextIndices(newSelectedIndices)
        if (newSelectedIndices[0] !== newSelectedIndices[1]) {
          setSharedAttributes(findAllSharedAttributesAndValues(selection.getSelectionStyles(selection.selectionStart, selection.selectionEnd, true)))
        }
      }
    } else {
      setSharedAttributes(findAllSharedAttributesAndValues(selection.getSelectionStyles(0, selection.text.length, true)))
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

      <Row>
        <Dropdown overlay={<Menu>
          {context.fonts.map((font) => <Menu.Item key={`${font}`} onClick={(e: any) => { }}>{font}</Menu.Item>)}
        </Menu>} >
          <Button>{sharedAttributes?.fontFamily}</Button>
        </Dropdown>
      </Row>

      <EquationInput
        size={context.state.antdSize}
        addonAfter="px"
        min={1}
        precision={0}
        value={sharedAttributes?.fontSize}
        style={{ width: "50%" }}
        onChange={(e: any) => handleStyleChange({ fontSize: e.value })}
      />

      <Row>
        <Checkbox checked={sharedAttributes?.fontWeight === "normal" && sharedAttributes?.fontStyle === "normal"} onClick={(e: any) => handleStyleChange({ fontWeight: "normal", fontStyle: "normal" })}>i</Checkbox>
        <Checkbox checked={sharedAttributes?.fontWeight === "bold"} onClick={(e: any) => handleStyleChange({ fontWeight: e.target.checked ? "bold" : "normal" })}><span style={{ fontWeight: "bold" }}>i</span></Checkbox>
        <Checkbox checked={sharedAttributes?.fontStyle === "italic"} onClick={(e: any) => handleStyleChange({ fontStyle: e.target.checked ? "italic" : "normal" })}><span style={{ fontStyle: "italic" }}>i</span></Checkbox>
      </Row>

      <Row>
        <Checkbox checked={sharedAttributes?.overline} onClick={(e: any) => handleStyleChange({ overline: e.target.checked })}>‾</Checkbox>
        <Checkbox checked={sharedAttributes?.linethrough} onClick={(e: any) => handleStyleChange({ linethrough: e.target.checked })}>-</Checkbox>
        <Checkbox checked={sharedAttributes?.underline} onClick={(e: any) => handleStyleChange({ underline: e.target.checked })}>_</Checkbox>
      </Row>

      <Row>
        <Select value={colorMode} onChange={setColorMode} bordered={false}>
          <Select.Option value="TEXT">Text</Select.Option>
          <Select.Option value="BACKGROUND">Background</Select.Option>
        </Select>

        <Colorpicker
          color={colorMode === "TEXT" ? sharedAttributes?.fill : sharedAttributes?.textBackgroundColor}
          onChange={(e: any) => {
            if (colorMode === "TEXT") handleStyleChange({ fill: `rgba(${e.r},${e.g},${e.b},${e.a})` })
            else handleStyleChange({ textBackgroundColor: `rgba(${e.r},${e.g},${e.b},${e.a})` })
          }} />
      </Row>
    </>
  )

}

export { TextControlPanel }
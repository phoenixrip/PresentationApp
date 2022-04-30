import { useContext, useEffect, useState } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { ChromePicker, CirclePicker } from 'react-color';
import {
  Button,
  InputNumber,
  Collapse,
  Switch,
  Radio,
  Slider,
  Dropdown,
  Menu,
  Checkbox,
  Select,
  Row,
  Col
} from 'antd';
import { EquationInput } from "../EquationInput";
import { customAttributesToIncludeInFabricCanvasToObject } from "../../Utils/consts";
import { cornersOfRectangle } from "@dnd-kit/core/dist/utilities/algorithms/helpers";
import { Colorpicker } from "../../Colorpickers/Colorpicker";
const WebFont = require('webfontloader');

interface Props {
  selection: any | undefined
}

interface FabricTextStyles {
  stroke: string,
  strokeWidth: string,
  fill: string,
  fontFamily: string,
  fontSize: number,
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

  const handleFontSelect = (fontFamily: String) => {
    if (!context.loadedFonts.includes(fontFamily)) {
      WebFont.load({
        google: {
          families: [fontFamily]
        },
        active: () => {
          context.loadedFonts.push(fontFamily)
          handleStyleChange({ fontFamily: fontFamily })
        },
        inactive: () => { alert("unable to load font") },
      })
    } else {
      handleStyleChange({ fontFamily: fontFamily })
    }
  }

  return (
    <>
      Total paras: {selection?.pS?.length}
      <Row style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
        <Dropdown overlay={<Menu>
          {context.availableFonts.map((font) => <Menu.Item key={`${font}`} onClick={() => { handleFontSelect(font) }}>{font}</Menu.Item>)}
        </Menu>} >
          <Button>{sharedAttributes?.fontFamily || ""}</Button>
        </Dropdown>
      </Row>
      {/* Font size */}
      <Row style={{ width: '100%', justifyContent: 'space-between' }}>
        <Col span={15}>
          <Slider
            onChange={(value) => handleStyleChange({ fontSize: value })}
            value={sharedAttributes?.fontSize} />
        </Col>
        <Col span={8}>
          <InputNumber
            // size='small'
            addonAfter='px'
            value={`${sharedAttributes?.fontSize}`}
            onChange={(value) => handleStyleChange({ fontSize: parseInt(`${value}`) })}
          />
        </Col>
      </Row>

      {/* FONT STYLES */}
      <Row>
        <Checkbox
          checked={sharedAttributes?.fontWeight === "normal" && sharedAttributes?.fontStyle === "normal"}
          onClick={(e: any) => handleStyleChange({ fontWeight: "normal", fontStyle: "normal" })}>
          Normal
        </Checkbox>
        <Checkbox
          checked={sharedAttributes?.fontWeight === "bold"}
          onClick={(e: any) => handleStyleChange({ fontWeight: e.target.checked ? "bold" : "normal" })}>
          Bold
        </Checkbox>
        <Checkbox
          checked={sharedAttributes?.fontStyle === "italic"}
          onClick={(e: any) => handleStyleChange({ fontStyle: e.target.checked ? "italic" : "normal" })}>
          <span style={{ fontStyle: "italic" }}>Italic</span>
        </Checkbox>
      </Row>

      <Row>
        <Checkbox
          checked={sharedAttributes?.overline}
          onClick={(e: any) => handleStyleChange({ overline: e.target.checked })}>
          Overline
        </Checkbox>
        <Checkbox
          checked={sharedAttributes?.linethrough}
          onClick={(e: any) => handleStyleChange({ linethrough: e.target.checked })}>
          Line-through
        </Checkbox>
        <Checkbox
          checked={sharedAttributes?.underline}
          onClick={(e: any) => handleStyleChange({ underline: e.target.checked })}>
          Underline
        </Checkbox>
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
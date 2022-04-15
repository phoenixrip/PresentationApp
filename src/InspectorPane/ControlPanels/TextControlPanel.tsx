import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { ChromePicker, CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio, Dropdown, Menu, Checkbox } from 'antd';
import { EquationInput } from "../EquationInput";
import { arrayTypeAnnotation } from "@babel/types";

interface Props {
  selection: any | undefined
}


const TextControlPanel = ({ selection }: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const setOnFabricObject: Function = context.setOnFabricObject
  const setOnGlobalObject: Function = context.setOnGlobalObject

  const handleStyleChange = (options: any) => {
    if (selection.isEditing) {
      selection.setSelectionStyles(options)
      context.setOnGlobalObject(selection, options)
      context.fabricCanvas?.requestRenderAll()
    } else {
      setOnFabricObject(selection, options)
    }
  }

  const loadFont = async (fontName: string) => {
    const fontFace = new FontFace(fontName, `url('./fonts/${fontName}.ttf')`)
    fontFace.load().then((font) => console.log(font))
  }


  return (
    <>
      <Checkbox checked={selection.fontWeight === "normal" && selection.fontStyle === "normal"} onClick={(e: any) => handleStyleChange({ fontWeight: "normal", fontStyle: "normal" })}>i</Checkbox>
      <Checkbox checked={selection.fontWeight === "bold"} onClick={(e: any) => handleStyleChange({ fontWeight: e.target.checked ? "bold" : "normal" })}><span style={{ fontWeight: "bold" }}>i</span></Checkbox>
      <Checkbox checked={selection.fontStyle === "italic"} onClick={(e: any) => handleStyleChange({ fontStyle: e.target.checked ? "italic" : "normal" })}><span style={{ fontStyle: "italic" }}>i</span></Checkbox>
      <EquationInput addonBefore="Font Size"
        addonAfter="px"
        min={1}
        precision={0}
        value={selection.fontSize}
        onChange={(e: any) => handleStyleChange({ fontSize: e.value })}
      />
      <Dropdown overlay={<Menu>
        {context.fonts.map((font) => <Menu.Item onClick={(e: any) => loadFont(e.domEvent.target.textContent)}>{font}</Menu.Item>)}
      </Menu>} >
        <Button>{selection.fontFamily}</Button>
      </Dropdown>
      <Checkbox checked={selection.overline} onClick={(e: any) => handleStyleChange({ overline: e.target.checked })}>‾</Checkbox>
      <Checkbox checked={selection.linethrough} onClick={(e: any) => handleStyleChange({ linethrough: e.target.checked })}>-</Checkbox>
      <Checkbox checked={selection.underline} onClick={(e: any) => handleStyleChange({ underline: e.target.checked })}>_</Checkbox>
      <ChromePicker
        color={selection.fill}
        onChange={e => {
          handleStyleChange({ fill: `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})` })
        }} />
      
      <Checkbox checked={selection.textBackgroundColor} onClick={(e: any) => handleStyleChange({ textBackgroundColor: e.target.checked ? "rgba(255,255,255,1)" : null })}>BG Color</Checkbox>
      {selection.textBackgroundColor &&<ChromePicker
        color={selection.textBackgroundColor}
        onChange={e => {
          handleStyleChange({textBackgroundColor: `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})` })
        }} />
      }

      <Button onClick={() => loadFont("Roboto")}>Hey</Button>
    </>
  )
}

export { TextControlPanel }
import { ReactNode, useContext, useEffect, useState } from "react";
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
  Col,
  Divider,
  DividerProps,
  Popover,
  InputNumberProps
} from 'antd';
// import { EquationInput } from "../EquationInput";
// import { customAttributesToIncludeInFabricCanvasToObject } from "../../Utils/consts";
// import { cornersOfRectangle } from "@dnd-kit/core/dist/utilities/algorithms/helpers";
import { IParaStyleOptions, ProjectParaStylesController } from "../../Utils/CustomControllerClasses/ProjectParaStylesController";
import { UseFaIcon } from "../../Utils/UseFaIcon";
import { faAlignCenter, faAlignJustify, faAlignLeft, faAlignRight, faBars, faBold, faFont, faItalic, faStrikethrough, faUnderline, faUpDown } from "@fortawesome/free-solid-svg-icons";
// import { IconDefinition } from '@fortawesome/fontawesome-common-types'
// import { CustomFabricObject } from "../../Types/CustomFabricTypes";
import { IObjectOptions } from "fabric/fabric-impl";
// import { fabric } from 'fabric'
import { FillPicker } from "../../FillPicker/FillPicker";
import { SkinnyNumberInput } from "../SkinnyNumberInput";
interface Props {
  selection: any | undefined,
  projectParaStylesController: ProjectParaStylesController
}

interface FabricTextStyles {
  stroke: string,
  strokeWidth: string,
  fill: IObjectOptions['fill'],
  fontFamily: string,
  fontSize: number,
  fontWeight: string,
  fontStyle: string,
  underline: boolean,
  overline: boolean,
  linethrough: boolean,
  deltaY: string,
  textBackgroundColor: string,
  textAlign: string
}

export interface ActiveTextSelectionStyleSettings {
  classType: string,
  paraStyleKey: string,
  paraIndex?: number,
  paraIndexes?: number[],
  useStyleStyles: Partial<IParaStyleOptions>,
  settingsName: string,
  hasOverrides?: boolean
}


const HUDSelectionIcons: Record<string, (s: ActiveTextSelectionStyleSettings) => ReactNode> = {
  'object': (s) => (<UseFaIcon icon={faFont} />),
  'singlePara': (s) => <div style={{ color: 'white' }}>{s.paraIndex! + 1}</div>,
  'multiParas': (s) => <div style={{ color: 'white' }}>M</div>,
}

const dividerProps: DividerProps = {
  plain: true,
  orientation: "left",
  style: { fontSize: 12, margin: '10px 0px', padding: 0 }
}

const TextControlPanel = ({ selection, projectParaStylesController }: Props) => {
  const context: EditorContextTypes = useContext(editorContext);

  const handleStyleChange = (options: any) => {
    selection.handleStyleChange(options)
  }

  function handleTextFillColorChange(color: string) {
    selection.handleStyleChange({ fill: color })
  }

  const activeSelectionStyleSettings: ActiveTextSelectionStyleSettings = selection!.getActiveSelectionStyleSettings()
  const s = activeSelectionStyleSettings.useStyleStyles
  const currTextAlign = s.textAlign
  // const textFillValueMode = getModeFromFillValue(s.fill)
  // console.log({ activeSelectionStyleSettings })
  // console.log(JSON.stringify(selection.pS, null, 4))
  return (
    <>
      {/* Para Styles Picker */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 12 }}>
          {HUDSelectionIcons[activeSelectionStyleSettings.classType]?.(activeSelectionStyleSettings)}
        </div>
        <Col span={20}>
          <Select
            style={{ width: '100%' }}
            tabIndex={-1}
            value={activeSelectionStyleSettings.paraStyleKey}
            onChange={(value) => selection.handleChangeParaStyle(value)}
          >
            {
              Object.entries(projectParaStylesController.paraStyles)
                .map(([paraStyleKey, paraStyleObject], paraStyleIndex) => {
                  return (
                    <Select.Option
                      key={paraStyleKey}
                      value={paraStyleKey}
                    >{paraStyleObject.displayName}</Select.Option>
                  )
                })
            }
          </Select>
        </Col>
        <Dropdown overlay={(
          <Menu>
            <Menu.Item
              onClick={() => selection?.handleClearAllSetParaStyles?.()}
              key='clearAllParaStyles'>Clear para styles</Menu.Item>
            <Menu.Item
              onClick={() => selection?.handleClearAllCharacterStyles?.()}
              key='clearAllCharStyles'>Clear character styles</Menu.Item>
          </Menu>
        )}>
          <UseFaIcon icon={faBars} />
        </Dropdown>
      </Row>
      {/* Style Settings divider */}
      <Divider {...dividerProps}>
        {activeSelectionStyleSettings.settingsName} {activeSelectionStyleSettings.hasOverrides ? '*' : ''}
      </Divider>
      {/* Font Family */}
      <Row style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
        <Dropdown overlay={<Menu>
          {context.availableFonts.map((font) => <Menu.Item key={`${font}`} onClick={() => { console.log(font) }}>{font}</Menu.Item>)}
        </Menu>} >
          <Button>{s?.fontFamily}</Button>
        </Dropdown>
      </Row>
      {/* Font size */}
      <Row style={{ width: '100%', justifyContent: 'space-between' }}>
        <Col style={{ flexGrow: 1, paddingRight: 10 }}>
          <Slider
            onChange={(value) => handleStyleChange({ fontSize: value })}
            value={activeSelectionStyleSettings.useStyleStyles.fontSize} />
        </Col>
        <Col>
          <InputNumber
            value={`${activeSelectionStyleSettings.useStyleStyles.fontSize}`}
            onChange={(value) => handleStyleChange({ fontSize: parseInt(`${value}`) })}
          />
        </Col>
      </Row>
      {/* FONT STYLES */}
      <Row style={{ marginTop: 5, marginBottom: 5, justifyContent: 'center' }}>
        <Button.Group>
          <Button
            onClick={(e) => handleStyleChange({ fontWeight: s.fontWeight !== 'normal' ? 'normal' : 'bold' })}
            type={s.fontWeight !== 'normal' ? 'primary' : 'default'}>
            <UseFaIcon icon={faBold} />
          </Button>
          <Button
            type={s.fontStyle !== 'italic' ? 'default' : 'primary'}
            onClick={(e) => handleStyleChange({ fontStyle: s.fontStyle !== 'italic' ? 'italic' : 'normal' })}
          >
            <UseFaIcon icon={faItalic} />
          </Button>
          <Button
            type={s.underline ? 'primary' : 'default'}
            onClick={(e) => handleStyleChange({ underline: !s.underline })}
          >
            <UseFaIcon icon={faUnderline} />
          </Button>
          <Button
            type={s.linethrough ? 'primary' : 'default'}
            onClick={(e) => handleStyleChange({ linethrough: !s.linethrough })}
          >
            <UseFaIcon icon={faStrikethrough} />
          </Button>
          <Button
            type={s.overline ? 'primary' : 'default'}
            onClick={(e) => handleStyleChange({ overline: !s.overline })}
          >
            <svg height='1em' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 500">
              <circle
                cx="782.507"
                cy="628.031"
                r="247.413"
                fill="none"
                stroke="#E9E9E9"
                strokeWidth="51.704"
                transform="matrix(.48842 0 0 .47862 -156.63 -10.587)"
              ></circle>
              <path
                stroke="#E9E9E9"
                strokeLinecap="round"
                strokeWidth="25"
                d="M47.757 98.719L412.243 98.719"
              ></path>
            </svg>
          </Button>
        </Button.Group>
      </Row>
      {/* FILL SETTINGS */}
      <Divider {...dividerProps}></Divider>
      {/* TEXT FILL */}
      <Row justify='space-between' align='middle'>
        <Col style={{ fontSize: dividerProps.style?.fontSize || 12 }}>Text fill</Col>
        <FillPicker
          fillLocation='text'
          title='Para fill'
          fillValue={s.fill}
          liveObject={selection}
          open={(selection?.editingType === 'fill' && selection.editingLocation === 'text') ? true : false}
          // color={s.fill as string}
          onChange={handleTextFillColorChange}
        />
      </Row>
      {/* <Row justify='space-between' align='middle'>
        <Col span={10}>
          <Select value={textFillValueMode} size={'small'}>
            <Select.Option value='textColor'>Text color</Select.Option>
            <Select.Option value='gradient'>Gradient</Select.Option>
          </Select>
        </Col>
        <Col>
          {textFillValueMode === 'textColor'
            && <ColorPreviewAndPicker
              color={s.fill as string}
              onChange={handleTextFillColorChange}
            />
          }
        </Col>
      </Row> */}
      {/* <Row>
        TEXT FILL SETTINGS
      </Row> */}
      {/* Text align */}
      <Divider {...dividerProps} />
      <Row style={{ marginBottom: 5, marginTop: 5, justifyContent: 'center' }}>
        <Button.Group>
          <Button onClick={() => handleStyleChange({ textAlign: 'left' })} tabIndex={-1} type={currTextAlign === 'left' ? 'primary' : 'default'}><UseFaIcon icon={faAlignLeft} /></Button>
          <Button onClick={() => handleStyleChange({ textAlign: 'center' })} tabIndex={-1} type={currTextAlign === 'center' ? 'primary' : 'default'}><UseFaIcon icon={faAlignCenter} /></Button>
          <Button onClick={() => handleStyleChange({ textAlign: 'right' })} tabIndex={-1} type={currTextAlign === 'right' ? 'primary' : 'default'}><UseFaIcon icon={faAlignRight} /></Button>
          <Button onClick={() => handleStyleChange({ textAlign: 'justify' })} tabIndex={-1} type={currTextAlign === 'justify' ? 'primary' : 'default'}><UseFaIcon icon={faAlignJustify} /></Button>
        </Button.Group>
      </Row>
      <Row justify='space-between' align='middle' style={{ margin: '10px 0px' }}>
        <Col style={{ fontSize: dividerProps.style?.fontSize || 12 }}>
          Para pad <UseFaIcon icon={faUpDown} />
        </Col>
        <Col>
          <SkinnyNumberInput value={s.paraTopPadding} />
          <SkinnyNumberInput value={s.paraBottomPadding} />
          {/* <InputNumber size={'small'} style={{ width: 50 }} value={s.paraTopPadding} />
          <InputNumber size={'small'} style={{ width: 50 }} value={s.paraBottomPadding} /> */}
        </Col>
      </Row>
      <Row justify='space-between' align='middle' style={{ margin: '10px 0px' }}>
        <Col style={{ fontSize: dividerProps.style?.fontSize || 12 }}>
          Para margin <UseFaIcon icon={faUpDown} />
        </Col>
        <Col>
          <SkinnyNumberInput value={s.paraTopMargin} />
          <SkinnyNumberInput value={s.paraBottomMargin} />
        </Col>
      </Row>
      {/* OLD FILL SETTINGS */}
      {/* <Row>
        <Select value={colorMode} onChange={setColorMode} size='small'>
          <Select.Option value="TEXT">Text</Select.Option>
          <Select.Option value="BACKGROUND">Background</Select.Option>
        </Select>

        <Colorpicker
          color={colorMode === "TEXT" ? sharedAttributes?.fill : sharedAttributes?.textBackgroundColor}
          onChange={(e: any) => {
            if (colorMode === "TEXT") handleStyleChange({ fill: `rgba(${e.r},${e.g},${e.b},${e.a})` })
            else handleStyleChange({ textBackgroundColor: `rgba(${e.r},${e.g},${e.b},${e.a})` })
          }} />
      </Row> */}
    </>
  )
}

export { TextControlPanel }

{/* OLD FONT STYLES */ }
{/* <Row>
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
      </Row> */}

{/* <Row>
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
      </Row> */}
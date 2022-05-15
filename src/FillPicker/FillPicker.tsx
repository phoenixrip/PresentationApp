import { faCircleChevronDown, faGear } from '@fortawesome/free-solid-svg-icons';
import { Popover, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import { fabric } from 'fabric'
import { Color, IObjectOptions } from "fabric/fabric-impl";
import { useState } from "react";
import { CustomFabricObject } from "../Types/CustomFabricTypes";
import { UseFaIcon } from '../Utils/UseFaIcon';
import c from './FillPicker.module.scss'
import { LinearGradientEditor } from './LinearGradientEditor';
import { SolidFillEditor } from './SolidFillEditor';

// custom css to alter the color picker appearance
import './ColorPickerOverrides.scss'

export interface IFillPickerProps {
  onChange(color: CustomFabricObject['fill']): void,
  title: string,
  fillValue: CustomFabricObject['fill'],
  liveObject: CustomFabricObject
}

function FillPicker(props: IFillPickerProps) {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  const typeInfo: ICompiledFillInfo = getModeFromFillValue(props.fillValue)

  function handleSettingsPopoverVisibilityChange(visible: boolean) {
    if (!settingsOpen && visible) {
      setSettingsOpen(visible)
      if (typeInfo.type === 'linearGradient' && props.liveObject && props.liveObject?.enterGradientEdit) {
        props.liveObject.enterGradientEdit()
      }
    }
  }

  function handleChangeFillType(e: RadioChangeEvent) {
    const newFillType = e.target.value as ICompiledFillInfo['type']
    const currentFillValue = props.fillValue

    if (!currentFillValue) {
      // Starting from nothing set
      if (newFillType === 'solidFill') {
        return props.onChange(`rgba(0, 0, 0, 1)`)
      }
      if (newFillType === 'linearGradient') {
        props.onChange(
          new fabric.Gradient(getDefaultLinearGradLayout(props.liveObject, ['black', 'white']))
        )
      }
    }
    if (typeInfo.type === 'solidFill') {
      const currentFillString = currentFillValue as string
      if (newFillType === 'linearGradient') {
        props.onChange(
          new fabric.Gradient(getDefaultLinearGradLayout(props.liveObject, [currentFillString, currentFillString]))
        )
      }
    }
  }

  function handleSolidFillOnChange(color: string) {
    props.onChange(color)
  }

  return (
    <div className={c.container}>
      <div className={c.typeInfo}>
        {typeInfo.hudDisplayValue}
      </div>
      <div className={c.previewWrapper}>
        <div className={c.previewContainer} style={{ background: typeInfo.previewBackgroundCss }}>
          <div className={c.previewDropDownIconContainer}>
            <UseFaIcon icon={faCircleChevronDown} />
          </div>
        </div>
      </div>
      <Popover
        visible={settingsOpen}
        trigger={['click']}
        placement='topRight'
        overlayClassName={c.customOverlayContents}
        title={
          <div className={c.popOverTitleContentsContainer}>
            <div className={c.title}>{props.title}</div>
            <div className={c.control}>
              <Radio.Group size='small' defaultValue={typeInfo.type} onChange={handleChangeFillType}>
                <Radio.Button value='none'>None</Radio.Button>
                <Radio.Button value='solidFill'>Fill</Radio.Button>
                <Radio.Button value='linearGradient'>Linear</Radio.Button>
                <Radio.Button value='radialGradient'>Radial</Radio.Button>
              </Radio.Group>
            </div>
          </div>
        }
        onVisibleChange={handleSettingsPopoverVisibilityChange}
        content={(
          <div className={c.contentContainer}>
            {
              typeInfo.type === 'none' &&
              <span>Select a fill to edit</span>
            }
            {
              typeInfo.type === 'solidFill' &&
              <SolidFillEditor
                liveObject={props.liveObject}
                fillValue={props.fillValue as string}
                onChange={handleSolidFillOnChange}
              />
            }
            {
              typeInfo.type === 'linearGradient' &&
              <LinearGradientEditor
                fillValue={props.fillValue as fabric.Gradient}
                liveObject={props.liveObject}
              />
            }
          </div>
        )}>
        <div className={classNames(
          c.settingsHUDButton,
          !settingsOpen ? c.idle : c.active,
        )}>
          <UseFaIcon icon={faGear} />
        </div>
      </Popover>
    </div>
  )
}

enum CompiledFillType {
  solidFill = 'solidFill',
  linearGradient = 'linearGradient',
  radialGradient = 'radialGradient',
  none = 'none'
}
interface ICompiledFillInfo {
  type: CompiledFillType,
  hudDisplayValue: string,
  previewBackgroundCss: string
}

function getModeFromFillValue(fillValue: IObjectOptions['fill']) {
  if (typeof fillValue === 'string') {
    console.log({ fillValue })
    return {
      type: 'solidFill' as CompiledFillType.solidFill,
      hudDisplayValue: fillValue,
      previewBackgroundCss: fillValue
    }
  }
  if (fillValue instanceof fabric.Gradient) {
    if (fillValue?.type === 'linear') {
      const stopVals = [...fillValue.colorStops!]
        .sort((a, b) => a.offset - b.offset)
        .map(stopObject => `${stopObject.color} ${stopObject.offset * 100}%`)
        .join(',')
      return {
        type: 'linearGradient' as CompiledFillType.linearGradient,
        hudDisplayValue: `#Linear`,
        previewBackgroundCss: `linear-gradient(to right, ${stopVals})`
      }
    }
  }
  return {
    type: 'none' as CompiledFillType.none,
    hudDisplayValue: 'none',
    previewBackgroundCss: ''
  }
}

function getDefaultLinearGradLayout(liveObject: CustomFabricObject, colors: string[]) {
  return {
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: liveObject.width, y2: liveObject.height },
    colorStops: colorStringsToColorStops(colors)
  }
}

function colorStringsToColorStops(colors: string[]) {
  if (colors.length === 1) {
    colors.push(colors[0])
  }
  const colorStopSize = colors.length === 2 ? 1 : (1 / (colors.length - 2))
  const colorStops = colors.map((color, index) => ({
    offset: colorStopSize * index,
    color
  }))
  return colorStops
}

export {
  FillPicker
}
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
import chroma from 'chroma-js'
// custom css to alter the color picker appearance
import './ColorPickerOverrides.scss'

export interface IFillPickerProps {
  open: boolean,
  fillLocation: string,
  fillIndex?: number,
  onChange(color: CustomFabricObject['fill']): void,
  title: string,
  fillValue: CustomFabricObject['fill'],
  liveObject: CustomFabricObject
}

function FillPicker(props: IFillPickerProps) {
  // const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  const typeInfo: ICompiledFillInfo = getModeFromFillValue(props.fillValue)
  const [cachedTypeValues, setCachedTypeValues] = useState<Record<string, CustomFabricObject['fill']>>({})

  function handleSettingsPopoverVisibilityChange(visible: boolean) {
    if (props.open) {
      console.log('already open', visible)
    }
    if (!props.open && visible) {
      props.liveObject.enterFillEditingMode({
        location: props.fillLocation,
        index: props.fillIndex
      })
      // setSettingsOpen(visible)
    }
  }

  function handleChangeFillType(e: RadioChangeEvent) {
    const { liveObject } = props
    if (!liveObject) return
    const newFillType = e.target.value as ICompiledFillInfo['type']
    const currentFillType = typeInfo.type
    const currentFillValue = props.fillValue
    const isCurrentGradientType = currentFillType === 'linearGradient' || currentFillType === 'radialGradient'
    // const cachedValueForNewType = cachedTypeValues[newFillType]

    let newFillValue
    // Create the new fill
    if (newFillType === 'solidFill') {
      if (isCurrentGradientType) {
        const currFill = props.fillValue as fabric.Gradient
        newFillValue = currFill?.colorStops?.[0].color || 'rgb(22, 22, 22)'
      } else {
        newFillValue = 'rgb(22, 22, 22)'
      }
    } else if (newFillType === 'linearGradient') {
      if (isCurrentGradientType) {
        const currFill = props.fillValue as fabric.Gradient
        newFillValue = new fabric.Gradient({
          type: 'linear',
          colorStops: JSON.parse(JSON.stringify(currFill.colorStops)),
          coords: { x1: 0, y1: 0, x2: liveObject.width, y2: liveObject.height }
        })
      } else if (currentFillType === 'solidFill') {
        // create a nice gradient from current solid fill
        newFillValue = new fabric.Gradient({
          type: 'linear',
          colorStops: getColorStopsFromSolidColor((currentFillValue as string)),
          coords: { x1: 0, y1: 0, x2: liveObject.width, y2: liveObject.height }
        })
      } else {
        newFillValue = new fabric.Gradient({
          type: 'linear',
          colorStops: colorStringsToColorStops(['rgb(22, 22, 22)', 'rgb(230, 230, 230)']),
          coords: { x1: 0, y1: 0, x2: liveObject.width, y2: liveObject.height }
        })
      }
    } else if (newFillType === 'radialGradient') {
      const coords = { x1: liveObject.width! / 2, y1: liveObject.height! / 2, r1: liveObject.width! * .25, x2: liveObject.width! / 2, y2: liveObject.height! / 2, r2: liveObject.width! * .75 }
      if (isCurrentGradientType) {
        const currFill = props.fillValue as fabric.Gradient
        newFillValue = new fabric.Gradient({
          type: 'radial',
          colorStops: JSON.parse(JSON.stringify(currFill.colorStops)),
          coords,
        })
      } else if (currentFillType === 'solidFill') {
        // create a nice gradient from current solid fill
        newFillValue = new fabric.Gradient({
          type: 'radial',
          colorStops: getColorStopsFromSolidColor((currentFillValue as string)),
          coords
        })
      } else {
        newFillValue = new fabric.Gradient({
          type: 'radial',
          colorStops: colorStringsToColorStops(['rgb(22, 22, 22)', 'rgb(230, 230, 230)']),
          coords
        })
      }
    }
    return liveObject.handleChangeFillMode({
      location: props.fillLocation,
      index: props.fillIndex,
      newValue: newFillValue
    })
  }

  function handleSolidFillOnChange(color: string) {
    props.onChange(color)
  }

  function handleMouseDownWithinPopoverContents(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    console.log('handleMouseDownWithinPopoverContents')
    e.stopPropagation()
  }

  return (
    <div className={c.container} onMouseDown={handleMouseDownWithinPopoverContents}>
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
        visible={props.open}
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
            {
              typeInfo.type === 'radialGradient' &&
              <LinearGradientEditor
                fillValue={props.fillValue as fabric.Gradient}
                liveObject={props.liveObject}
              />
            }
          </div>
        )}>
        <div className={classNames(
          c.settingsHUDButton,
          !props.open ? c.idle : c.active,
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
    return {
      type: 'solidFill' as CompiledFillType.solidFill,
      hudDisplayValue: fillValue,
      previewBackgroundCss: fillValue
    }
  }
  if (fillValue instanceof fabric.Gradient) {
    const stopVals = [...fillValue.colorStops!]
      .sort((a, b) => a.offset - b.offset)
      .map(stopObject => `${stopObject.color} ${stopObject.offset * 100}%`)
      .join(',')
    if (fillValue?.type === 'linear') {
      return {
        type: 'linearGradient' as CompiledFillType.linearGradient,
        hudDisplayValue: `#Linear`,
        previewBackgroundCss: `linear-gradient(to right, ${stopVals})`
      }
    } else {
      return {
        type: 'radialGradient' as CompiledFillType.radialGradient,
        hudDisplayValue: `#Radial`,
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

function getColorStopsFromSolidColor(color: string) {
  const currColor = chroma(color)
  const currHue = currColor.get('hsl.h')
  const secondHue = ((currHue + 35 > 360) ? currHue - 35 : currHue + 35)
  const secondColor = currColor.set('hsl.h', secondHue).css()
  return colorStringsToColorStops([color, secondColor])
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
import { fabric } from 'fabric'
import { faCircleChevronDown, faGear } from "@fortawesome/free-solid-svg-icons"
import { Popover, Radio } from "antd"
import { UseFaIcon } from "../../Utils/UseFaIcon"
import { Colorpicker } from "../Colorpicker"
import c from './ColorPreviewAndPicker.module.scss'
import classNames from 'classnames';
import React, { useContext, useEffect, useRef, useState } from "react"
import { Gradient, IObjectOptions } from "fabric/fabric-impl"
import { CustomFabricObject } from '../../Types/CustomFabricTypes'
import { editorContext } from '../../EditorContext'
import chroma from 'chroma-js'
import { RgbaStringColorPicker } from 'react-colorful'

export interface IColorPreviewAndPickerProps {
  onChange(color: string): void,
  title: string,
  fillValue: IObjectOptions['fill'],
  liveObject?: CustomFabricObject
}

function ColorPreviewAndPicker(props: IColorPreviewAndPickerProps) {

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)

  function handleSettingsPopoverVisibilityChange(visible: boolean) {
    // console.log('handleSettingsPopoverVisibilityChange', visible)
    if (!settingsOpen && visible) {
      setSettingsOpen(visible)
      if (props.liveObject && props.liveObject?.enterGradientEdit) {
        props.liveObject.enterGradientEdit()
      }
    }
  }

  function onChange(e: any) {
    return props.onChange(`rgba(${e.r},${e.g},${e.b},${e.a})`)
  }

  const typeInfo = getModeFromFillValue(props.fillValue)
  return (
    <div className={c.container}>
      <div className={c.typeInfo}>
        {typeInfo}
      </div>
      <div className={c.previewWrapper}>
        <div className={c.previewContainer} style={{ backgroundColor: props.fillValue as string }}>
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
              <Radio.Group size='small' defaultValue='textFill'>
                <Radio.Button value='textFill'>Fill</Radio.Button>
                <Radio.Button value='paraLinear'>Linear</Radio.Button>
                <Radio.Button value='paraRadial'>Radial</Radio.Button>
              </Radio.Group>
            </div>
          </div>
        }
        onVisibleChange={handleSettingsPopoverVisibilityChange}
        content={(
          <div className={c.contentContainer}>
            {/* {
              typeInfo === 'textColor' &&
              <SolidFillEditor
                fillValue={props.fillValue}
                onChange={onChange}
              />
            } */}
            {/* {
              typeInfo === 'linearGradient' &&
              <LinearGradientEditor
                fillValue={props.fillValue as fabric.Gradient}
                liveObject={props.liveObject}
              />
            } */}
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

function getModeFromFillValue(fillValue: IObjectOptions['fill']) {
  if (typeof fillValue === 'string') return 'textColor'
  if (fillValue instanceof fabric.Gradient) {
    if (fillValue?.type === 'linear') return 'linearGradient'
  }
}

export {
  ColorPreviewAndPicker
}
import chroma from "chroma-js"
import { useContext, useEffect, useRef, useState } from "react"
import { RgbaStringColorPicker } from "react-colorful"
import { editorContext } from "../EditorContext"
import { CustomFabricObject } from "../Types/CustomFabricTypes"
import classNames from 'classnames'
import c from './LinearGradientEditor.module.scss'

interface ILinearGradientEditorProps {
  fillValue: fabric.Gradient,
  // onChange(e: any): void,
  liveObject: CustomFabricObject
}

interface IStopObject {
  color: string,
  offset: number
}

function LinearGradientEditor(props: ILinearGradientEditorProps) {
  const context = useContext(editorContext)
  const gradContainer = useRef<HTMLDivElement>(null)
  const lastUsableOffset = useRef<number>()
  const [tick, setTick] = useState<boolean>(false)
  const [sortedStops, setSortedStops] = useState<any[]>([])
  const [stopCssValues, setStopCssValues] = useState<string>('')

  // this useEffect memoises a sorted array of stops and then a css string of the stops
  useEffect(() => {
    //@ts-ignore
    const newSortedStops = props?.fillValue?.colorStops
      .map((stopObject, originalStopIndex) => ({ ...stopObject, originalStopIndex }))
      .sort((a, b) => (a.offset - b.offset))
    // console.log({ newSortedStops })
    setSortedStops(newSortedStops)
    setStopCssValues(
      newSortedStops
        .map(stopObject => `${stopObject.color} ${stopObject.offset * 100}%`)
        .join(',')
    )
  }, [tick])

  function handleColorStopDragStart(e: React.DragEvent<HTMLDivElement>) {
    // Hide the ghost
    const blankCanvas: any = document.createElement('canvas');
    e.dataTransfer?.setDragImage(blankCanvas, 0, 0);
    document.body?.appendChild(blankCanvas);
    // e.dataTransfer.clearData()
    e.dataTransfer.dropEffect = 'none'
    e.dataTransfer.effectAllowed = 'none'
  }

  function getRelativeOffset(e: any) {
    const currentContainer = gradContainer?.current as HTMLDivElement | undefined
    if (currentContainer) {
      // Get the relative x of the drag
      const bbox = currentContainer.getBoundingClientRect()
      const relativeX = e.pageX - bbox.left
      const percentageX = (relativeX / bbox.width) * 100
      if (percentageX < 0) return lastUsableOffset.current
      if (percentageX > 100) return lastUsableOffset.current
      const newOffset = parseFloat((percentageX / 100).toFixed(2))
      lastUsableOffset.current = newOffset
      return newOffset
    }
  }

  function handleDraggingColorStop(stopIndex: number, e: React.DragEvent<HTMLDivElement>) {
    const newOffset = getRelativeOffset(e)
    console.log({ newOffset })
    //@ts-ignore
    props.fillValue.colorStops[stopIndex].offset = newOffset
    context.fabricCanvas?.requestRenderAll()
    setTick(!tick)
  }

  function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
    console.log('handleDragEnd')
  }

  function handleColorStopMouseDown(e: React.MouseEvent<HTMLDivElement>, stopIndex: number) {
    e.stopPropagation()
    if (props?.liveObject) {
      props.liveObject.activeStopIndex = stopIndex
      props.liveObject.canvas?.requestRenderAll()
    }
  }

  function handleGradInterfaceMouseDown(e: any) {
    const getAddAtOffset = getRelativeOffset(e)
    const colors = sortedStops!.map(stopObj => stopObj.color)
    const domains = sortedStops!.map(stopObj => stopObj.offset)
    const activeScale = chroma.scale(colors).domain(domains)
    const newColor = activeScale(getAddAtOffset)
    if (props.fillValue.colorStops?.length) {
      const newStopObject: IStopObject = {
        offset: getAddAtOffset || 0,
        color: newColor.css()
      }
      const newColorStopsArray: IStopObject[] = [...props.fillValue.colorStops, newStopObject]
      const newStopIndex = newColorStopsArray.length - 1
      props.fillValue.colorStops = newColorStopsArray
      props.liveObject!.activeStopIndex = newStopIndex
      props.liveObject.linearGradientControls!.createControlsFromScratch()
      // props.liveObject.controls[`stop${newStopIndex}`] = props.liveObject.linearGradientControls!.createControlForStop(newStopObject, newColorStopsArray.length - 1)
      props.liveObject.dirty = true
      context.fabricCanvas?.requestRenderAll()
      setTick(!tick)
    }
  }

  function handleChangeStopColor(color: string) {
    const activeStopIndex = props.liveObject?.activeStopIndex ?? 0
    if (props?.liveObject !== undefined) {
      //@ts-ignore
      props.liveObject.activeFillValue.colorStops[activeStopIndex].color = color
      props.liveObject.dirty = true
      props.liveObject.canvas?.requestRenderAll()
      setTick(!tick)
    }
  }
  const hasLiveObject = props?.liveObject !== undefined
  const hasActiveStop = hasLiveObject && props.liveObject!.activeStopIndex! !== null
  const activeStopIndex = props.liveObject?.activeStopIndex ?? 0
  return (
    <div className={c.container}>
      {/* {props?.liveObject?.activeStopIndex ?? 'None'
        //@ts-ignore
        // props.liveObject.__corner
      } */}
      <div className={c.gradientStopsInterface}
        onMouseDown={handleGradInterfaceMouseDown}
        ref={gradContainer}
        style={{ background: props.fillValue?.colorStops ? `linear-gradient(to right, ${stopCssValues})` : 'black' }}
      >
        {props.fillValue?.colorStops?.length &&
          props.fillValue.colorStops.map((stopObject, stopIndex) => {
            return (
              <div
                key={stopIndex}
                className={classNames(
                  c.stopHudWrapper,
                  (hasLiveObject && hasActiveStop && props.liveObject!.activeStopIndex === stopIndex) && c.active
                )}
                style={{
                  left: `${stopObject.offset * 100}%`,
                  backgroundColor: stopObject.color
                }}
                draggable
                onMouseDown={(e) => handleColorStopMouseDown(e, stopIndex)}
                onDragStart={handleColorStopDragStart}
                onDrag={(e) => handleDraggingColorStop(stopIndex, e)}
                onDragEnd={handleDragEnd}
              />
            )
          })
        }
      </div>
      <div className={c.fullColorPickerContainer}>
        <RgbaStringColorPicker
          color={props?.fillValue?.colorStops?.[activeStopIndex]?.color || 'rgba(0, 0, 0, 1)'}
          onChange={handleChangeStopColor}
        />
      </div>
    </div>
  )
}

export {
  LinearGradientEditor
}
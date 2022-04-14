import { useContext, useEffect, useState } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { CirclePicker, ChromePicker } from 'react-color';
import { Radio } from "antd";
import { fabric } from "fabric";
import { GradientControlPanel } from "./GradientControlPanel";

interface Props {
  selection: any | undefined
}

const FillControlPanel = ({ selection }: Props) => {
  const context: EditorContextTypes = useContext(editorContext);
  const setOnFabricObject: Function = context.setOnFabricObject

  let parsedRadioGroupValue
  if (typeof selection?.fill === "string") parsedRadioGroupValue = "fill"
  else if (selection?.fill?.type === "linear") parsedRadioGroupValue = "linearGradient"
  else if (selection?.fill?.type === "radial") parsedRadioGroupValue = "radialGradient"
  const [radioGroupValue, setRadioGroupValue] = useState(parsedRadioGroupValue)

  const [tickGradientModeSwitch, setTickGradientModeSwitch] = useState(false)

  useEffect(() => {
    let parsedRadioGroupValue
    if (typeof selection?.fill === "string") parsedRadioGroupValue = "fill"
    else if (selection?.fill?.type === "linear") parsedRadioGroupValue = "linearGradient"
    else if (selection?.fill?.type === "radial") parsedRadioGroupValue = "radialGradient"
    setRadioGroupValue(parsedRadioGroupValue)
    setTickGradientModeSwitch(!tickGradientModeSwitch)
  }, [selection])

  const handleRadioGroupSelect = (e: any) => {
    switch (e.target.value) {
      case "fill":
        setOnFabricObject(selection, { fill: 'rgba(0,0,0,1)' })
        setRadioGroupValue("fill")
        break
      case "linearGradient":
        const linearGradient = new fabric.Gradient({
          type: "linear",
          coords: {
            x1: 0,
            y1: 0,
            x2: selection.width,
            y2: selection.height,
          },
          colorStops: [
            {
              "offset": 0.72,
              "color": "#040404"
            },
            {
              "offset": 0.28,
              "color": "#6450c8"
            },
            {
              "offset": 0.13,
              "color": "#0d0827"
            },
            {
              "offset": 0.51,
              "color": "#a291f5"
            },
            {
              "offset": 0.28,
              "color": "#6450c8"
            },
            {
              "offset": 0.87,
              "color": "#e9e7f1"
            }
          ]

        })
        setOnFabricObject(selection, { fill: linearGradient }, "setGradient")
        setRadioGroupValue("linearGradient")
        setTickGradientModeSwitch(!tickGradientModeSwitch)
        selection.refreshGradientAngleControls()
        break
      case "radialGradient":
        const radialGradient = new fabric.Gradient({
          type: "radial",
          coords: {
            r1: selection.height / 2 + selection.width / 4,
            r2: selection.width * .05,

            x1: selection.width / 2,
            y1: selection.height / 2,

            x2: selection.width / 2,
            y2: selection.height / 2
          },
          colorStops: [
            {
              "offset": 0.2,
              "color": "#fff"
            },
            {
              "offset": 0.32,
              "color": "#000"
            },
            {
              "offset": 0.45,
              "color": "rgba(110,89,215,1)"
            },

            {
              "offset": 0.64,
              "color": "rgba(54, 18, 234, 255)"
            },
            {
              "offset": 0.82,
              "color": "rgba(52,15,235,1)"
            },
          ]
        })
        setOnFabricObject(selection, { fill: radialGradient }, "setGradient")
        setRadioGroupValue("radialGradient")
        setTickGradientModeSwitch(!tickGradientModeSwitch)
        selection.refreshGradientAngleControls()
        break
      default:
        break
    }
  }

  return (
    <>
      <Radio.Group value={radioGroupValue} size="small" style={{ marginTop: 16 }}>
        <Radio.Button value="fill" onClick={handleRadioGroupSelect}>Fill</Radio.Button>
        <Radio.Button value="linearGradient" onClick={handleRadioGroupSelect}>Linear</Radio.Button>
        <Radio.Button value="radialGradient" onClick={handleRadioGroupSelect}>Radial</Radio.Button>
      </Radio.Group>
      {typeof selection.fill === "string" &&
        <ChromePicker
          color={selection.fill}
          onChange={e => {
            setOnFabricObject(selection, { fill: `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})` })
          }} />
      }
      {(selection.fill?.type === "linear" || selection.fill?.type === "radial") &&
        <GradientControlPanel selection={selection} tickGradientModeSwitch={tickGradientModeSwitch} />
      }
    </>
  )

}

export { FillControlPanel }
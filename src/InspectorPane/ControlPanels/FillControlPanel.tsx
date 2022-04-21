import { useContext, useEffect, useState } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, Radio, Select } from "antd";
import { fabric } from "fabric";
import { Gradientpicker } from "./Gradientpicker";
import { Colorpicker } from "./Colorpicker";

interface Props {
    selection: any | undefined
}

const FillControlPanel = ({ selection }: Props) => {
    const context: EditorContextTypes = useContext(editorContext);
    const setOnFabricObject: Function = context.setOnFabricObject

    const [fillMode, setFillMode] = useState(selection?.fill?.type || "solid")

    useEffect(() => {
        switch (fillMode) {
            case "solid":
                if (typeof selection.fill !== "string") {
                    setOnFabricObject(selection, { fill: 'rgba(0,0,0,1)' })
                }
                break
            case "linear":
                if (selection.fill?.type !== "linear") {
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
                                "offset": 0.72,
                                "color": "#040404"
                            },
                            {
                                "offset": 0.87,
                                "color": "#e9e7f1"
                            }
                        ]

                    })
                    setOnFabricObject(selection, { fill: linearGradient }, "setGradient")
                    selection.refreshGradientAngleControls()
                }
                break
            case "radial":
                if (selection.fill?.type !== "radial") {
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
                    selection.refreshGradientAngleControls()
                }
                break
            default:
                break
        }
    }, [fillMode])


    return (
        <>
            <Select value={fillMode} onChange={setFillMode} bordered={false}>
                <Select.Option value="solid">Solid</Select.Option>
                <Select.Option value="linear">Linear</Select.Option>
                <Select.Option value="radial">Radial</Select.Option>
            </Select>
            {typeof selection.fill === "string" &&
                <Colorpicker
                    color={selection.fill}
                    onChange={(e: any) => setOnFabricObject(selection, { fill: `rgba(${e.r},${e.g},${e.b},${e.a})` })} />
            }
            {(selection.fill?.type === "linear" || selection.fill?.type === "radial") &&
                <Gradientpicker gradient={selection.fill} onChange={(e: any) => setOnFabricObject(selection, { fill: new fabric.Gradient(e) }, "setGradient")} />
            }

        </>
    )

}

export { FillControlPanel }
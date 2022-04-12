//@ts-nocheck
import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, InputNumber, Radio, } from "antd"
import { EquationInput } from "../EquationInput";
import { fabric } from "fabric";
import Grapick from "grapick";
import { useEffect, useContext, useState, useRef } from "react";
import "../../../node_modules/grapick/dist/grapick.min.css"
import "../../Utils/fabricCustomControls"
import { ChromePicker } from 'react-color';

function GradientControlPanel() {
    const context: EditorContextTypes = useContext(editorContext);
    const selection: any | undefined = context.fabricCanvas?.getActiveObject()
    const setOnFabricObject: Function = context.setOnFabricObject

    let gradientPicker = useRef(null)
    let selectedColorStop = useRef(null)
    const [selectedGrapickHandler, setSelectedGrapickHandler] = useState(null)
    let refreshing = false

    useEffect(() => {
        gradientPicker.current = new Grapick({ el: '#gradientPicker' });
        if (selection.fill.type === "linear" || selection.fill.type === "radial") {
            for (const colorStop of selection.fill.colorStops) {
                gradientPicker.current.addHandler(colorStop.offset * 100, colorStop.color)
            }
        }

        //Get reference to color stop in selection that has same position as the handler selected in the gradient picker
        gradientPicker.current.on("handler:select", e => {
            setSelectedGrapickHandler(e)
            selectedColorStop.current = selection.fill.colorStops.filter(cs => cs.offset === parseFloat(e.position.toFixed(0)) / 100)[0]
        })

        //Set offset on selected color stop in fabric object to new position given in event
        gradientPicker.current.on('handler:drag', e => {
            selectedColorStop.current.offset = parseFloat(e.position.toFixed(0)) / 100
            setOnFabricObject(selection, { fill: selection.fill })
        })

        // Get position and color of new handler and add to fabric js color stops array
        gradientPicker.current.on('handler:add', e => {
            if (!refreshing) {
                const newColorStop = { offset: parseFloat(e.position.toFixed(0)) / 100, color: e.color }
                const newColorStops = [...selection.fill.colorStops, newColorStop]
                setOnFabricObject(selection, {
                    fill: new fabric.Gradient({
                        ...selection.fill,
                        colorStops: newColorStops,
                    })
                })
            }
        })

        // Remove color stop which has same position as the removed handler
        gradientPicker.current.on('handler:remove', e => {
            const newColorStops = selection.fill.colorStops.filter(cs => cs.offset !== parseFloat(e.position.toFixed(0)) / 100)
            if (selection.fill.colorStops.length === newColorStops.length) console.log("OOPS", { e, newColorStops })
            setOnFabricObject(selection, {
                fill: new fabric.Gradient({
                    ...selection.fill,
                    colorStops: newColorStops,
                })
            })
        })

        gradientPicker.current.on('handler:color:change', e => {
            const newColorStops = selection.fill.colorStops.map((cs) => {
                if (cs.offset === parseFloat(e.position.toFixed(0)) / 100) {
                    return { ...cs, color: e.color }
                } else {
                    return cs
                }
            })
            setOnFabricObject(selection, {
                fill: new fabric.Gradient({
                    ...selection.fill,
                    colorStops: newColorStops
                })
            })
        })

        setSelectedGrapickHandler(gradientPicker.current.getSelected())
    }, [])

    const refreshGradientPicker = () => {
        console.log(gradientPicker.current)
        gradientPicker.current.clear()
        refreshing = true
        if (selection.fill.type === "linear" || selection.fill.type === "radial") {
            for (const colorStop of selection.fill.colorStops) {
                gradientPicker.current.addHandler(parseFloat((colorStop.offset * 100).toFixed(0)), colorStop.color)
            }
        }
        refreshing = false
    }


    return (
        <>
            <Radio checked={selection?.fill?.type === "linear"}
                onClick={(e: any) => {
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
                    refreshGradientPicker()
                    selection.refreshGradientAngleControls()
                }}
            >Linear</Radio>
            <Radio checked={selection?.fill?.type === "radial"}
                onClick={(e: any) => {
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
                                offset: 0,
                                color: "#000",
                            },
                            {
                                offset: 1,
                                color: "#fff",
                            }
                        ]
                    })
                    setOnFabricObject(selection, { fill: radialGradient }, "setGradient")
                    refreshGradientPicker()
                    selection.refreshGradientAngleControls()
                }}>Radial</Radio>

            <p></p>
            <div id="gradientPicker"></div>
            <p></p>
            <ChromePicker color={selectedGrapickHandler?.color}
                onChangeComplete={(e) => selectedGrapickHandler?.setColor(`rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)} />
        </>
    )

}

export { GradientControlPanel }
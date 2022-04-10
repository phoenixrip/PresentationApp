//@ts-nocheck
import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, InputNumber, Radio, } from "antd"
import { EquationInput } from "../EquationInput";
import { fabric } from "fabric";
import Grapick from "grapick";
import { useEffect, useContext, useState, useRef } from "react";
import "../../../node_modules/grapick/dist/grapick.min.css"
import "../../Utils/fabricCustomControls"

function GradientControlPanel() {
    const context: EditorContextTypes = useContext(editorContext);
    const selection: any | undefined = context.fabricCanvas?.getActiveObject()
    const setOnFabricObject: Function = context.setOnFabricObject

    let gradientPicker = useRef(null)
    let selectedColorStop = useRef(null)

    useEffect(() => {
        gradientPicker.current = new Grapick({ el: '#gradientPicker' });
        if (selection.fill.type === "linear" || selection.fill.type === "radial") {
            for (const colorStop of selection.fill.colorStops) {
                gradientPicker.current.addHandler(colorStop.offset * 100, colorStop.color)
            }
        }

        //Get reference to color stop in selection that has same position as the handler selected in the gradient picker
        gradientPicker.current.on('handler:drag:start', e => {
            selectedColorStop.current = selection.fill.colorStops.filter(cs => cs.offset * 100 === e.position)[0]
        })

        gradientPicker.current.on('handler:drag:end', e => {
            selectedColorStop.current = null
        })

        //Set offset on selected color stop in fabric object to new position given in event
        gradientPicker.current.on('handler:drag', e => {
            selectedColorStop.current.offset = e.position / 100
            setOnFabricObject(selection, { fill: selection.fill })
        })

        // Get position and color of new handler and add to fabric js color stops array
        gradientPicker.current.on('handler:add', e => {
            const newColorStop = { offset: e.position / 100, color: e.color }
            const newColorStops = [...selection.fill.colorStops, newColorStop]
            setOnFabricObject(selection, {
                fill: new fabric.Gradient({
                    ...selection.fill,
                    colorStops: newColorStops
                })
            })
        })

        // Remove color stop which has same position as the removed handler
        gradientPicker.current.on('handler:remove', e => {
            const newColorStops = selection.fill.colorStops.filter(cs => cs.offset !== e.position / 100)
            setOnFabricObject(selection, {
                fill: new fabric.Gradient({
                    ...selection.fill,
                    colorStops: newColorStops
                })
            })
        })

        refreshGradientAngleControls()

    }, [])

    const refreshGradientPicker = () => {
        gradientPicker.current.clear()
        if (selection.fill.type === "linear" || selection.fill.type === "radial") {
            for (const colorStop of selection.fill.colorStops) {
                gradientPicker.current.addHandler(colorStop.offset * 100, colorStop.color)
            }
        }
    }

    const refreshGradientAngleControls = () => {
        fabric.Object.prototype.controls.xy1GradientControl.offsetX = (selection.fill?.coords?.x1 - selection.width / 2) || 0
        fabric.Object.prototype.controls.xy1GradientControl.offsetY = (selection.fill?.coords?.y1 - selection.height / 2) || 0
        fabric.Object.prototype.controls.xy2GradientControl.offsetX = (selection.fill?.coords?.x2 - selection.width / 2) || 0
        fabric.Object.prototype.controls.xy2GradientControl.offsetY = (selection.fill?.coords?.y2 - selection.height / 2) || 0
    }

    return (
        <>
            <Radio checked={selection?.fill?.type === "linear"}
                onClick={(e: any) => {
                    setOnFabricObject(selection, {
                        fill: new fabric.Gradient({
                            type: "linear",
                            coords: {
                                x1: 0,
                                y1: 0,
                                x2: selection.width,
                                y2: selection.height,
                            },
                            colorStops: [
                                {
                                    offset: 0, // value 0 - 1
                                    color: "#000",
                                },
                                {
                                    offset: .75,
                                    color: "#fff",
                                }
                            ]
                        })
                    })
                    refreshGradientPicker()
                    refreshGradientAngleControls()
                }}
            >Linear</Radio>
            <Radio checked={selection?.fill?.type === "radial"}
                onClick={(e: any) => {
                    setOnFabricObject(selection, {
                        fill: new fabric.Gradient({
                            type: "radial",
                            coords: {
                                x1: 0,
                                y1: 0,
                                x2: 0,
                                y2: 0,
                                r1: 30,
                                r2: 2,
                            },
                            colorStops: [
                                {
                                    offset: 0, // value 0 - 1
                                    color: "#000",
                                },
                                {
                                    offset: 1,
                                    color: "#fff",
                                }
                            ]
                        })
                    })
                    refreshGradientPicker()
                    refreshGradientAngleControls()
                }}>Radial</Radio>
            {/* <EquationInput
                size={context.state.antdSize}
                addonBefore="x1:"
                precision={0}
                value={selection?.fill?.coords?.x1}
                onChange={(e: any) => {
                    setOnFabricObject(selection, {
                        fill: new fabric.Gradient({
                            ...selection.fill,
                            coords: { ...selection.fill.coords, x1: e.value }
                        }
                        )
                    })
                }} />
            <EquationInput
                size={context.state.antdSize}
                addonBefore="y1:"
                precision={0}
                value={selection?.fill?.coords?.y1}
                onChange={(e: any) => {
                    setOnFabricObject(selection, {
                        fill: new fabric.Gradient({
                            ...selection.fill,
                            coords: { ...selection.fill.coords, y1: e.value }
                        }
                        )
                    })
                }} />
            <EquationInput
                size={context.state.antdSize}
                addonBefore="x2"
                precision={0}
                value={selection?.fill?.coords?.x2}
                onChange={(e: any) => {
                    setOnFabricObject(selection, {
                        fill: new fabric.Gradient({
                            ...selection.fill,
                            coords: { ...selection.fill.coords, x2: e.value }
                        }
                        )
                    })
                }} />
            <EquationInput
                size={context.state.antdSize}
                addonBefore="y2:"
                precision={0}
                value={selection?.fill?.coords?.y2}
                onChange={(e: any) => {
                    setOnFabricObject(selection, {
                        fill: new fabric.Gradient({
                            ...selection.fill,
                            coords: { ...selection.fill.coords, y2: e.value }
                        }
                        )
                    })
                }} />
            {selection?.fill?.type === "radial" &&
                <>
                    <EquationInput
                        size={context.state.antdSize}
                        addonBefore="r1:"
                        precision={0}
                        value={selection?.fill?.coords?.r1}
                        onChange={(e: any) => {
                            setOnFabricObject(selection, {
                                fill: new fabric.Gradient({
                                    ...selection.fill,
                                    coords: { ...selection.fill.coords, r1: e.value }
                                }
                                )
                            })
                        }} />
                    <EquationInput
                        size={context.state.antdSize}
                        addonBefore="r2:"
                        precision={0}
                        value={selection?.fill?.coords?.r2}
                        onChange={(e: any) => {
                            setOnFabricObject(selection, {
                                fill: new fabric.Gradient({
                                    ...selection.fill,
                                    coords: { ...selection.fill.coords, r2: e.value }
                                }
                                )
                            })
                        }} />
                </>

            } */}
            <p></p>
            <div id="gradientPicker"></div>
        </>
    )

}

export { GradientControlPanel }
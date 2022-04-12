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

    useEffect(() => {
        if(selection.fill?.type === "linear") fabric.Object.prototype.setLinearGradientMode()
        else if(selection.fill?.type === "radial") fabric.Object.prototype.setRadialGradientMode()

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

        gradientPicker.current.on('handler:color:change', e => {
            console.log(e)
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
        fabric.Object.prototype.controls.xy1GradientControl.offsetX = (selection.fill?.coords?.x1 - selection.width / 2)
        fabric.Object.prototype.controls.xy1GradientControl.offsetY = (selection.fill?.coords?.y1 - selection.height / 2)
        fabric.Object.prototype.controls.xy2GradientControl.offsetX = (selection.fill?.coords?.x2 - selection.width / 2)
        fabric.Object.prototype.controls.xy2GradientControl.offsetY = (selection.fill?.coords?.y2 - selection.height / 2)
        console.log(fabric.Object.prototype.controls)
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
                                    offset: 0,
                                    color: "#000",
                                },
                                {
                                    offset: .75,
                                    color: "#fff",
                                }
                            ]
                        })
                    })
                    console.log(selection)
                    refreshGradientPicker()
                    refreshGradientAngleControls()
                    fabric.Object.prototype.setLinearGradientMode()
                }}
            >Linear</Radio>
            <Radio checked={selection?.fill?.type === "radial"}
                onClick={(e: any) => {
                    setOnFabricObject(selection, {
                        fill: new fabric.Gradient({
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
                    })
                    console.log(selection)
                    refreshGradientPicker()
                    refreshGradientAngleControls()
                    fabric.Object.prototype.setRadialGradientMode()
                }}>Radial</Radio>

            <p></p>
            <div id="gradientPicker"></div>
            <p></p>
            <ChromePicker />
        </>
    )

}

export { GradientControlPanel }
//@ts-nocheck
import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, InputNumber, Radio, } from "antd"
import { EquationInput } from "../EquationInput";
import { fabric } from "fabric";
import Grapick from "grapick";
import { useEffect, useContext, useState, useRef } from "react";
import "../../../node_modules/grapick/dist/grapick.min.css"
import "../../Utils/fabricCustomControls"
import './grapickCustom.css'
import { ChromePicker } from 'react-color';

interface Props {
    selection: any | undefined,
    tickRadialModeSwitch: Boolean
}

const GradientControlPanel = ({ selection, tickRadialModeSwitch }: Props) => {
    const context: EditorContextTypes = useContext(editorContext);
    const setOnFabricObject: Function = context.setOnFabricObject

    let gradientPicker = useRef(null)
    let selectedColorStop = useRef(null)
    const [selectedGrapickHandler, setSelectedGrapickHandler] = useState(null)
    let refreshing = useRef(false)

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
            const newColorStopsOrdered = selection.fill.colorStops.sort(function (a, b) { return a.offset - b.offset })
            setOnFabricObject(selection, {
                fill: new fabric.Gradient({
                    ...selection.fill,
                    colorStops: newColorStopsOrdered,
                })
            }, "setGradient")
        })

        // Get position and color of new handler and add to fabric js color stops array
        gradientPicker.current.on('handler:add', e => {
            if (!refreshing.current) {
                const newColorStop = { offset: parseFloat(e.position.toFixed(0)) / 100, color: e.color }
                const newColorStops = [...selection.fill.colorStops, newColorStop]
                const newColorStopsOrdered = newColorStops.sort(function (a, b) { return a.offset - b.offset })
                setOnFabricObject(selection, {
                    fill: new fabric.Gradient({
                        ...selection.fill,
                        colorStops: newColorStopsOrdered,
                    })
                }, "setGradient")
            }
        })

        // Remove color stop which has same position as the removed handler
        gradientPicker.current.on('handler:remove', e => {
            if (!refreshing.current) {
                const newColorStops = selection.fill.colorStops.filter(cs => cs.offset !== parseFloat(e.position.toFixed(0)) / 100)
                
                //only for testing
                if (selection.fill.colorStops.length === newColorStops.length) {
                    console.log("OOPS BABY") 
                    console.log({ old: selection.fill.colorStops, new: newColorStops })
                }
                setOnFabricObject(selection, {
                    fill: new fabric.Gradient({
                        ...selection.fill,
                        colorStops: newColorStops,
                    })
                }, "setGradient")
            }
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
            }, "setGradient")
        })

        setSelectedGrapickHandler(gradientPicker.current.getSelected())
    }, [])

    //refresh grapick on selection change
    useEffect(() => {
        refreshGradientPicker()
    }, [selection, tickRadialModeSwitch])

    const refreshGradientPicker = () => {
        refreshing.current = true
        gradientPicker.current.clear()
        if (selection.fill.type === "linear" || selection.fill.type === "radial") {
            for (const colorStop of selection.fill.colorStops) {
                gradientPicker.current.addHandler(parseFloat((colorStop.offset * 100).toFixed(0)), colorStop.color)
            }
        }
        refreshing.current = false
    }

    const handleDeleteGrapickHandler = () => {
        selectedGrapickHandler.remove()
        const remainingHandlers = gradientPicker.current.getHandlers()
        if (remainingHandlers.length) remainingHandlers[0].select()
    }

    return (
        <>
            <div id="gradientPicker"></div>
            <Button onClick={handleDeleteGrapickHandler}>Delete Color Stop</Button>
            <ChromePicker color={selectedGrapickHandler?.color}
                onChangeComplete={(e) => selectedGrapickHandler?.setColor(`rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)} />
            {
                selection.fill?.type === "radial" &&
                <>
                    <EquationInput
                        addonBefore="r1:"
                        addonAfter="px"
                        precision={0}
                        value={selection.fill?.coords?.r1}
                        onChange={(e: any) => {
                            setOnFabricObject(selection, {
                                fill: new fabric.Gradient({
                                    ...selection.fill,
                                    coords: { ...selection.fill.coords, r1: e.value }
                                })
                            }, "setGradient")
                        }}
                    />
                    <EquationInput
                        addonBefore="r2:"
                        addonAfter="px"
                        precision={0}
                        value={selection.fill?.coords?.r2}
                        onChange={(e: any) => {
                            setOnFabricObject(selection, {
                                fill: new fabric.Gradient({
                                    ...selection.fill,
                                    coords: { ...selection.fill.coords, r2: e.value }
                                })
                            }, "setGradient")
                        }}
                    />
                </>
            }
        </>
    )

}

export { GradientControlPanel }
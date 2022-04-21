import { editorContext, EditorContextTypes } from "../../Editor";
import { Button, InputNumber, Radio, } from "antd"
import { EquationInput } from "../EquationInput";
import { fabric } from "fabric";
import Grapick from "grapick";
import { useEffect, useContext, useState, useRef } from "react";
import "../../../node_modules/grapick/dist/grapick.min.css"
import './grapickCustom.css'
import { Colorpicker } from './Colorpicker'
import { Color, Gradient } from "fabric/fabric-impl";

interface Props {
    gradient: Gradient
    onChange: Function
}

interface ColorStop {
    offset: number,
    color: String
}

type GrapickType = {
    addHandler: Function,
    on: Function,
    getSelected: Function
    clear: Function,
    getHandlers: Function
}

type GrapickHandler = {
    color: Color,
    remove: Function,
    setColor: Function
}

const Gradientpicker = ({ gradient, onChange }: Props) => {
    const gradientPicker = useRef<GrapickType | null>(null)
    const selectedColorStop = useRef<ColorStop | null>(null)
    const refreshing = useRef(false)
    const [selectedGrapickHandler, setSelectedGrapickHandler] = useState<GrapickHandler | null>(null)
    const gradientRef = useRef(gradient) //Use this to keep the reference to the gradient for the grapick event handlers fresh

    useEffect(() => {
        // Create new grapick instance and add color stops from selection
        gradientPicker.current = new Grapick({ el: '#gradientPicker' });
        if (gradient.type === "linear" || gradient.type === "radial") {
            //@ts-ignore
            for (const colorStop of gradient.colorStops) {
                gradientPicker.current!.addHandler(colorStop.offset * 100, colorStop.color)
            }
        }

        //Get reference to color stop in selection that has same position as the handler selected in the gradient picker
        gradientPicker!.current!.on("handler:select", (e: any) => {
            if (!refreshing.current) {
                const currentColorStops = gradientRef.current.colorStops as Array<ColorStop>
                setSelectedGrapickHandler(e)
                selectedColorStop.current = currentColorStops.filter(cs => cs.offset === parseFloat(e.position.toFixed(0)) / 100)[0]
            }
        })

        //Set offset on selected color stop in fabric object to new position given in event
        gradientPicker!.current!.on('handler:drag:end', (e: any) => {
            selectedColorStop!.current!.offset = parseFloat(e.position.toFixed(0)) / 100
            //@ts-ignore
            const newColorStopsOrdered = gradientRef.current.colorStops.sort(function (a: ColorStop, b: ColorStop) { return a.offset - b.offset })
            if (onChange) {
                const newGradient = new fabric.Gradient({ ...gradientRef.current, colorStops: newColorStopsOrdered })
                onChange(newGradient)
            }
        })

        // Get position and color of new handler and add to fabric js color stops array
        gradientPicker!.current!.on('handler:add', (e: any) => {
            if (!refreshing.current) {
                const newColorStop = { offset: parseFloat(e.position.toFixed(0)) / 100, color: e.color }
                //@ts-ignore
                const newColorStops = [...gradientRef.current.colorStops, newColorStop]
                const newColorStopsOrdered = newColorStops.sort(function (a: ColorStop, b: ColorStop) { return a.offset - b.offset })
                if (onChange) {
                    const newGradient = new fabric.Gradient({ ...gradientRef.current, colorStops: newColorStopsOrdered })
                    onChange(newGradient)
                }
            }
        })

        // Remove color stop which has same position as the removed handler
        gradientPicker!.current!.on('handler:remove', (e: any) => {
            if (!refreshing.current) {
                const currentColorStops = gradientRef.current.colorStops as Array<ColorStop>
                const newColorStops = currentColorStops.filter(cs => cs.offset !== parseFloat(e.position.toFixed(0)) / 100)
                if (onChange) {
                    //@ts-ignore
                    const newGradient = new fabric.Gradient({ ...gradientRef.current, colorStops: newColorStops })
                    onChange(newGradient)
                }
            }
        })

        gradientPicker!.current!.on('handler:color:change', (e: any) => {
            const currentColorStops = gradientRef.current.colorStops as Array<ColorStop>
            const newColorStops = currentColorStops.map((cs) => {
                if (cs.offset === parseFloat(e.position.toFixed(0)) / 100) {
                    return { ...cs, color: e.color }
                } else {
                    return cs
                }
            })
            if (onChange) {
                //@ts-ignore
                const newGradient = new fabric.Gradient({ ...gradientRef.current, colorStops: newColorStops })
                onChange(newGradient)
            }
        })

        setSelectedGrapickHandler(gradientPicker!.current!.getSelected())
    }, [])

    useEffect(() => {
        gradientRef.current = gradient
        refreshGradientPicker()
    }, [gradient])

    const handleDeleteGrapickHandler = () => {
        selectedGrapickHandler!.remove()
        const remainingHandlers = gradientPicker!.current!.getHandlers()
        if (remainingHandlers.length) remainingHandlers[0].select()
    }

    const refreshGradientPicker = () => {
        refreshing.current = true
        gradientPicker.current!.clear()
        //@ts-ignore
        for (const colorStop of gradient.colorStops) {
            gradientPicker.current!.addHandler(colorStop.offset * 100, colorStop.color)
        }
        refreshing.current = false
    }

    return (
        <>
            <div id="gradientPicker"></div>
            <Button onClick={handleDeleteGrapickHandler}>Delete Color Stop</Button>
            <Colorpicker color={selectedGrapickHandler?.color}
                onChange={(e: any) => selectedGrapickHandler?.setColor(`rgba(${e.r},${e.g},${e.b},${e.a})`)} />
            {
                gradient?.type === "radial" &&
                <>
                    {/* <EquationInput
                        addonBefore="r1:"
                        addonAfter="px"
                        precision={0}
                        value={gradient?.coords?.r1}
                        onChange={(e: any) => {
                            setOnFabricObject(selection, {
                                gradient: new fabric.Gradient({
                                    ...gradient,
                                    coords: { ...gradient.coords, r1: e.value }
                                })
                            }, "setGradient")
                        }}
                    />
                    <EquationInput
                        addonBefore="r2:"
                        addonAfter="px"
                        precision={0}
                        value={gradient?.coords?.r2}
                        onChange={(e: any) => {
                            setOnFabricObject(selection, {
                                gradient: new fabric.Gradient({
                                    ...gradient,
                                    coords: { ...gradient.coords, r2: e.value }
                                })
                            }, "setGradient")
                        }}
                    /> */}
                </>
            }
        </>
    )

}

export { Gradientpicker }
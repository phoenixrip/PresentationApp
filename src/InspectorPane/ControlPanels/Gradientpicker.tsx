import { Button, Slider, } from "antd"
import Grapick from "grapick";
import { useEffect, useRef, useCallback, useState } from "react";
import "../../../node_modules/grapick/dist/grapick.min.css"
import './grapickCustom.css'
import { Colorpicker } from './Colorpicker'
import { Gradient } from "fabric/fabric-impl";

interface Props {
    gradient: Gradient
    onChange: Function
}

type GrapickType = {
    addHandler: Function,
    on: Function,
    off: Function,
    getSelected: Function
    clear: Function,
    getHandlers: Function
}

type GrapickHandler = {
    setColor: Function,
    color: string,
    position: number
}

const Gradientpicker = ({ gradient, onChange }: Props) => {
    const gradientPicker = useRef<GrapickType | null>(null)
    const lastSelectedHandler = useRef<GrapickHandler | null>(null)


    const parseColorStops = useCallback(() => {
        let newColorStops = []
        for (const handler of gradientPicker.current!.getHandlers()) {
            newColorStops.push({
                offset: parseInt(handler.position) / 100,
                color: handler.color
            })
        }
        const newFill = {...gradient, colorStops: newColorStops}
        onChange(newFill)
    }, [])

    useEffect(() => {
        // Create new grapick instance and add color stops from selection
        gradientPicker.current = new Grapick({ el: '#gradientPicker' });
        if (gradient.type === "linear" || gradient.type === "radial") {
            //@ts-ignore
            for (const colorStop of gradient.colorStops) {
                gradientPicker.current!.addHandler(colorStop.offset * 100, colorStop.color)
            }
        }

        // When we setColor on a picker the gradient is refreshed so if the new gradient has a handler with the same position and color we reselect it
        for(const handler of gradientPicker.current?.getHandlers()) {
            if(lastSelectedHandler.current?.color === handler.color && lastSelectedHandler.current?.position === handler.position) {
                handler.select()
            }

        }

        gradientPicker!.current!.on('handler:drag:end', parseColorStops)
            .on('handler:add', parseColorStops)
            .on('handler:remove', parseColorStops)
            .on('handler:color:change', parseColorStops)

        return () => {
            gradientPicker!.current!.off('handler:drag:end', parseColorStops)
                .off('handler:add', parseColorStops)
                .off('handler:remove', parseColorStops)
                .off('handler:color:change', parseColorStops)
        }



    }, [gradient])

    return (
        <>
            <div id="gradientPicker"></div>
            <Colorpicker color={gradientPicker.current?.getSelected().color}
                onChange={(e: any) => { 
                    // When we setColor on a picker the gradient is refreshed so we cache the current selection to reselect it
                    lastSelectedHandler.current = gradientPicker.current?.getSelected()
                    lastSelectedHandler.current?.setColor(`rgba(${e.r},${e.g},${e.b},${e.a})`)}} />
            {
                gradient.type === "radial" &&
                <> 
                <span>R1: </span><Slider value={gradient.coords!.r1} onChange={(e) => onChange({...gradient, coords: {...gradient.coords, r1: e}})}/>
                <span>R2: </span><Slider value={gradient.coords!.r2} onChange={(e) => onChange({...gradient, coords: {...gradient.coords, r2: e}})}/>
                </>
            }
        </>
    )

}

export { Gradientpicker }
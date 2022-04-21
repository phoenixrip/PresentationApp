import { Button, Slider, } from "antd"
import Grapick from "grapick";
import { useEffect, useRef, useCallback } from "react";
import "../../../node_modules/grapick/dist/grapick.min.css"
import './grapickCustom.css'
import { Colorpicker } from './Colorpicker'
import { Gradient } from "fabric/fabric-impl";
import { defaultCoordinates } from "@dnd-kit/core";

interface Props {
    gradient: Gradient
    onChange: Function
}

type GrapickType = {
    addHandler: Function,
    on: Function,
    getSelected: Function
    clear: Function,
    getHandlers: Function
}

const Gradientpicker = ({ gradient, onChange }: Props) => {
    const gradientPicker = useRef<GrapickType | null>(null)

    const parseColorStops = useCallback(() => {
        let newColorStops = []
        for (const handler of gradientPicker.current!.getHandlers()) {
            newColorStops.push({
                offset: parseInt(handler.position) / 100,
                color: handler.color
            })
        }
        const newFill = {...gradient, colorStops: newColorStops}
        console.log("new gradient", newFill)
        onChange(newFill)
    }, [])

    useEffect(() => {
        console.log("render")
        // Create new grapick instance and add color stops from selection
        gradientPicker.current = new Grapick({ el: '#gradientPicker' });
        if (gradient.type === "linear" || gradient.type === "radial") {
            //@ts-ignore
            for (const colorStop of gradient.colorStops) {
                gradientPicker.current!.addHandler(colorStop.offset * 100, colorStop.color)
            }
        }

        gradientPicker!.current!.on('handler:drag:end', parseColorStops)
            .on('handler:add', parseColorStops)
            .on('handler:remove', parseColorStops)
            .on('handler:color:change', parseColorStops)
        
        return () => {
            //@ts-ignore
            gradientPicker!.current!.off('handler:drag:end', parseColorStops)
                .off('handler:add', parseColorStops)
                .off('handler:remove', parseColorStops)
                .off('handler:color:change', parseColorStops)
        }
    }, [gradient])

    return (
        <>
            <div id="gradientPicker"></div>
            <Button onClick={() => gradientPicker.current?.getSelected()?.remove()}>Delete Color Stop</Button>
            <Colorpicker color={gradientPicker.current?.getSelected()?.color}
                onChange={(e: any) => gradientPicker.current?.getSelected()?.setColor(`rgba(${e.r},${e.g},${e.b},${e.a})`)} />
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
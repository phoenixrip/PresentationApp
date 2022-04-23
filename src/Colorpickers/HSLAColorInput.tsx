import { Input, InputNumber } from "antd"
import { useState, useEffect, useRef } from "react";
const tinycolor = require("tinycolor2");

interface HexColorInputPropsType {
    color: any
    onChange: Function
}

const HSLAColorInput = ({ color, onChange }: HexColorInputPropsType) => {
    let internalHSLAColor = tinycolor(color).toHsl()
    internalHSLAColor.h = Math.round(internalHSLAColor.h)
    internalHSLAColor.s = internalHSLAColor.s.toFixed(2)
    internalHSLAColor.l = internalHSLAColor.l.toFixed(2)
    internalHSLAColor.a = internalHSLAColor.a.toFixed(2)

    const hue = useRef<HTMLInputElement>(null)
    const saturation = useRef<HTMLInputElement>(null)
    const lightness = useRef<HTMLInputElement>(null)
    const alpha = useRef<HTMLInputElement>(null)

    const handleInput = (col: string) => {
        const newColor = tinycolor({
            h: hue.current?.value,
            s: saturation.current?.value,
            l: lightness.current?.value,
            a: alpha.current?.value
        })
        console.log(newColor.toHsl())
        if(newColor.isValid()) onChange(newColor.toHsl())
    }

    return (
        <>
            <InputNumber
                ref={hue}
                value={internalHSLAColor.h}
                min="0"
                max="360"
                precision={0}
                onChange={handleInput}
                style={{ width: "20%" }}
                controls={false}
            />
            <InputNumber
                ref={saturation}
                value={internalHSLAColor.s}
                min="0"
                max="1"
                precision={2}
                onChange={handleInput}
                style={{ width: "20%" }}
                controls={false}
            />
            <InputNumber
                ref={lightness}
                value={internalHSLAColor.l}
                min="0"
                max="1"
                precision={2}
                onChange={handleInput}
                style={{ width: "20%" }}
                controls={false}
            />
            <InputNumber
                ref={alpha}
                value={internalHSLAColor.a}
                min="0"
                max="1"
                precision={2}
                step={0.1}
                onChange={handleInput}
                style={{ width: "20%" }}
                controls={false}
            />
        </>

    )
}

export { HSLAColorInput }
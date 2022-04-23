import { Input, InputNumber } from "antd"
import { useState, useEffect, useRef } from "react";
const tinycolor = require("tinycolor2");

interface RGBAColorInputTypes {
    color: any
    onChange: Function
}

const RGBAColorInput = ({ color, onChange }: RGBAColorInputTypes) => {
    let internalRGBAColor = tinycolor(color).toRgb()
    internalRGBAColor.a = internalRGBAColor.a.toFixed(2)

    const red = useRef<HTMLInputElement>(null)
    const green = useRef<HTMLInputElement>(null)
    const blue = useRef<HTMLInputElement>(null)
    const alpha = useRef<HTMLInputElement>(null)

    const handleInput = (col: string) => {
        const newColor = tinycolor({
            r: red.current?.value,
            g: green.current?.value,
            b: blue.current?.value,
            a: alpha.current?.value
        })
        if(newColor.isValid()) onChange(newColor.toRgb())
    }

    return (
        <>
            <InputNumber
                ref={red}
                value={internalRGBAColor.r}
                min="0"
                max="255"
                precision={0}
                onChange={handleInput}
                style={{ width: "20%" }}
                controls={false}
            />
            <InputNumber
                ref={green}
                value={internalRGBAColor.g}
                min="0"
                max="255"
                precision={0}
                onChange={handleInput}
                style={{ width: "20%" }}
                controls={false}
            />
            <InputNumber
                ref={blue}
                value={internalRGBAColor.b}
                min="0"
                max="255"
                precision={0}
                onChange={handleInput}
                style={{ width: "20%" }}
                controls={false}
            />
            <InputNumber
                ref={alpha}
                value={internalRGBAColor.a}
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

export { RGBAColorInput }
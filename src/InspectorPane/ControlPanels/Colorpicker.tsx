import { Col, Input, InputNumber, InputRef, Row, Select, } from "antd"
import { useState, useRef, useEffect } from "react";
import { RgbaStringColorPicker } from "react-colorful";
const tinycolor = require("tinycolor2");
import c from './Colorpicker.module.css'
import { Eyedropper } from "./Eyedropper";

interface ColorpickerPropsType {
    color: any
    onChange?: Function
    palette?: Array<string>
}

const Colorpicker = ({ color, onChange, palette }: ColorpickerPropsType) => {
    const [stringInputMode, setStringInputMode] = useState("HEX")
    const [tick, setTick] = useState(false)

    const internalColor = useRef(tinycolor(color))
    const internalHexColor = useRef(internalColor.current.toHex())
    const internalHSLAColor = useRef(internalColor.current.toHsl())
    const internalRGBAColor = useRef(internalColor.current.toRgb())

    let colorPalette
    if (palette) {
        colorPalette = palette.map((col) => tinycolor(col).toRgbString())
    } else {
        palette = ["#f44336",
            "#e91e63",
            "#9c27b0",
            "#673ab7",
            "#3f51b5",
            "#2196f3",
            "#03a9f4",
            "#00bcd4",
            "#009688",
            "#4caf50",
            "#8bc34a",
            "#cddc39",
            "#ffeb3b",
            "#ffc107",
            "#ff9800",
            "#ff5722",
            "#795548",
            "#607d8b"]
        colorPalette = palette.map((col) => tinycolor(col).toRgbString())
    }

    const hex = useRef<InputRef>(null)
    const red = useRef<HTMLInputElement>(null)
    const green = useRef<HTMLInputElement>(null)
    const blue = useRef<HTMLInputElement>(null)
    const alphargba = useRef<HTMLInputElement>(null)
    const hue = useRef<HTMLInputElement>(null)
    const saturation = useRef<HTMLInputElement>(null)
    const lightness = useRef<HTMLInputElement>(null)
    const alphahsla = useRef<HTMLInputElement>(null)

    useEffect(() => {
        parseColor(color, "props", false)
    }, [color])

    const parseColor = (e: any, source: string, doOnChange: Boolean = true) => {
        const newColor = tinycolor(e)
        if (newColor.isValid()) {
            internalColor.current = newColor

            // Only change controlled input for Hex string when it comes from outside that input
            if (source !== "hexInput" && source !== "props") {
                internalHexColor.current = newColor.toHex()
            }

            internalHSLAColor.current = newColor.toHsl()
            internalRGBAColor.current = newColor.toRgb()

            if (doOnChange && onChange) onChange(newColor.toRgb())
        }
        setTick(!tick)
    }

    const handleInput = (e: any) => {
        if (stringInputMode === "HEX") {
            internalHexColor.current = e.target.value
            parseColor(internalHexColor.current, "hexInput")
        } else if (stringInputMode === "RGBA" && red.current?.value && green.current?.value && blue.current?.value && alphargba.current?.value) {
            parseColor({ r: red.current.value, g: green.current.value, b: blue.current.value, a: alphargba.current.value }, "rgbaInput")
        } else if (stringInputMode === "HSLA" && hue.current?.value && saturation.current?.value && lightness.current?.value && alphahsla.current?.value) {
            parseColor({ h: hue.current.value, s: saturation.current.value, l: lightness.current.value, a: alphahsla.current.value }, "hslInput")
        }
    }

    return (
        <>
            <RgbaStringColorPicker className={c["react-colorful"]} color={internalColor.current.toRgbString()} onChange={(e: any) => parseColor(e, "colorpicker")} />
            <Row>
                <Col span={22}>
                    <Input.Group compact>
                        <Select value={stringInputMode} onChange={setStringInputMode} style={{ width: "20%" }}>
                            <Select.Option value="HEX">HEX</Select.Option>
                            <Select.Option value="RGBA">RGB</Select.Option>
                            <Select.Option value="HSLA">HSL</Select.Option>
                        </Select>
                        {stringInputMode === "HEX" &&
                            <Input
                                ref={hex}
                                value={internalHexColor.current}
                                addonBefore={"#"}
                                maxLength={7}
                                onChange={handleInput}
                                style={{ width: "80%" }}
                            />
                        }
                        {
                            stringInputMode === "RGBA" &&
                            <>
                                <InputNumber
                                    ref={red}
                                    value={internalRGBAColor.current.r}
                                    min={0}
                                    max={255}
                                    precision={0}
                                    onChange={handleInput}
                                    style={{ width: "20%" }}
                                    controls={false}
                                />
                                <InputNumber
                                    ref={green}
                                    value={internalRGBAColor.current.g}
                                    min={0}
                                    max={255}
                                    precision={0}
                                    onChange={handleInput}
                                    style={{ width: "20%" }}
                                    controls={false}
                                />
                                <InputNumber
                                    ref={blue}
                                    value={internalRGBAColor.current.b}
                                    min={0}
                                    max={255}
                                    precision={0}
                                    onChange={handleInput}
                                    style={{ width: "20%" }}
                                    controls={false}
                                />
                                <InputNumber
                                    ref={alphargba}
                                    value={internalRGBAColor.current.a}
                                    min={0}
                                    max={1}
                                    precision={2}
                                    step={0.1}
                                    onChange={handleInput}
                                    style={{ width: "20%" }}
                                    controls={false}
                                />
                            </>
                        }
                        {stringInputMode === "HSLA" &&
                            <>
                                <InputNumber
                                    ref={hue}
                                    value={internalHSLAColor.current.h}
                                    min={-360}
                                    max={360}
                                    precision={0}
                                    onChange={handleInput}
                                    style={{ width: "20%" }}
                                    controls={false}
                                />
                                <InputNumber
                                    ref={saturation}
                                    value={internalHSLAColor.current.s}
                                    min={0}
                                    max={1}
                                    precision={2}
                                    onChange={handleInput}
                                    style={{ width: "20%" }}
                                    controls={false}
                                />
                                <InputNumber
                                    ref={lightness}
                                    value={internalHSLAColor.current.l}
                                    min={0}
                                    max={1}
                                    precision={2}
                                    onChange={handleInput}
                                    style={{ width: "20%" }}
                                    controls={false}
                                />
                                <InputNumber
                                    ref={alphahsla}
                                    value={internalHSLAColor.current.a}
                                    min={0}
                                    max={1}
                                    precision={2}
                                    step={0.1}
                                    onChange={handleInput}
                                    style={{ width: "20%" }}
                                    controls={false}
                                />
                            </>
                        }
                    </Input.Group>
                </Col>
                <Col span={2}>
                    <Eyedropper onChange={parseColor} />
                </Col>
            </Row>
            {
                colorPalette &&
                <div className={c.colorPickerPalette}>
                    {colorPalette.map((col) =>
                        <div key={col} className={c.colorPickerPaletteOption}
                            style={{ backgroundColor: col }}
                            onClick={() => { parseColor(col, "palette") }}></div>
                    )}
                </div>
            }
        </>
    )
}

export { Colorpicker }
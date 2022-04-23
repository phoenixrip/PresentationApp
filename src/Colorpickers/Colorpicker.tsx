import { Col, Input, InputNumber, InputRef, Row, Select, } from "antd"
import { useState, useRef, useEffect } from "react";
import { RgbaStringColorPicker } from "react-colorful";
const tinycolor = require("tinycolor2");
import c from './Colorpicker.module.css'
import { Eyedropper } from "./Eyedropper";
import { HexColorInput } from "./HexColorInput";
import { HSLAColorInput } from "./HSLAColorInput";
import { RGBAColorInput} from "./RGBAColorInput";

interface ColorpickerPropsType {
    color: any
    onChange?: Function
    palette?: Array<string>
}

const Colorpicker = ({ color, onChange, palette }: ColorpickerPropsType) => {
    const [stringInputMode, setStringInputMode] = useState("HEX")
    const internalColor = tinycolor(color)

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

    const parseColor = (e: any) => {
        console.log(e)
        const newColor = tinycolor(e)
        if (newColor.isValid()) {
            if (onChange) onChange(newColor.toRgb())
        }
    }

    return (
        <>
            <RgbaStringColorPicker className={c["react-colorful"]} defaultValue={internalColor.toRgbString()} onChange={parseColor} />
            <Row>
                <Col span={22}>
                    <Input.Group compact>
                        <Select value={stringInputMode} onChange={setStringInputMode} style={{ width: "20%" }}>
                            <Select.Option value="HEX">HEX</Select.Option>
                            <Select.Option value="RGBA">RGB</Select.Option>
                            <Select.Option value="HSLA">HSL</Select.Option>
                        </Select>
                        {stringInputMode === "HEX" && <HexColorInput color={internalColor.toHex()} onChange={parseColor} />}
                        {stringInputMode === "RGBA" && <RGBAColorInput color={color} onChange={parseColor} />}
                        {stringInputMode === "HSLA" && <HSLAColorInput color={color} onChange={parseColor} />}
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
                            onClick={() => { parseColor(col) }}></div>
                    )}
                </div>
            }
        </>
    )
}

export { Colorpicker }
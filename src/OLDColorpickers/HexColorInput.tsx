import { Input } from "antd"
import { useState, useEffect } from "react";
const tinycolor = require("tinycolor2");

interface HexColorInputPropsType {
    color: any
    onChange: Function
}

const HexColorInput = ({ color, onChange }: HexColorInputPropsType) => {
    const [internalHexString, setInternalHexString] = useState(color)

    const handleInput = (col: string) => {
        setInternalHexString(col)
        if (col.length === 6 || col.length === 7) {
            const newColor = tinycolor(col)
            if (newColor.isValid()) onChange(col)
        }
    }

    useEffect(() => {
        setInternalHexString(color)
    }, [color])

    return (
        <Input
            value={internalHexString}
            addonBefore={"#"}
            maxLength={7}
            onChange={(e: any) => handleInput(e.target.value)}
        // style={{ flexGrow: 1 }}
        />
    )
}

export { HexColorInput }
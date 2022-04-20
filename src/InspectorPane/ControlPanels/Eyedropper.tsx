import { Input, InputNumber, Select, } from "antd"
import { editorContext, EditorContextTypes } from "../../Editor";
import { useContext, useState, useRef, useEffect } from "react";
import "../../../node_modules/grapick/dist/grapick.min.css"
import './grapickCustom.css'
import { RgbaStringColorPicker } from "react-colorful";
import { UseFaIcon } from "../../Utils/UseFaIcon";
import { faEyedropper } from "@fortawesome/free-solid-svg-icons";
const tinycolor = require("tinycolor2");
import c from './Colorpicker.module.css'

interface ColorpickerPropsType {
    onChange: Function
}

const Eyedropper = ({ onChange }: ColorpickerPropsType) => {
    const context: EditorContextTypes = useContext(editorContext);
    const eyedropperPreview = useRef<any>(null)
    const [enabled, setEnabled] = useState(false)

    const updateEyedropperColor = (e: any) => {
        const canvasContext = context.fabricCanvas?.getContext()
        const mouse = context.fabricCanvas!.getPointer(e, true)
        const px = canvasContext!.getImageData(mouse.x, mouse.y, 1, 1).data
        eyedropperPreview.current.style.backgroundColor = `rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
        eyedropperPreview.current.style.color = `rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    }

    const selectEyedropperColor = (e: any) => {
        onChange(tinycolor(eyedropperPreview.current!.style.backgroundColor).toRgb())
        setEnabled(false)
    }

    const handleMouseMove = (e: any) => {
        eyedropperPreview.current!.style.left = e.pageX + 'px';
        eyedropperPreview.current!.style.top = e.pageY + 'px';
    }

    // const toggleEyedropper = () => {
    useEffect(() => {
        if (!enabled) {
            context.fabricCanvas!.eyedropperActive = true
            document.addEventListener("mousemove", handleMouseMove)
            context.fabricCanvas!.on("mouse:move", updateEyedropperColor)
            context.fabricCanvas!.on("mouse:down", selectEyedropperColor)
        } else {
            document.removeEventListener("mousemove", handleMouseMove)
            context.fabricCanvas!.off("mouse:move", updateEyedropperColor)
            context.fabricCanvas!.off("mouse:down", selectEyedropperColor)
            context.fabricCanvas!.eyedropperActive = false
        }
    }, [enabled])



    return (
        <>
            <UseFaIcon icon={faEyedropper} onClick={() => setEnabled(!enabled)} />
            {enabled &&
                <div ref={eyedropperPreview}
                    style={{
                        position: "fixed",
                        height: "35px",
                        width: "35px",
                        border: "2px solid black",
                        borderRadius: "20px",
                        transform: "translate(10%, 10%)"
                    }}
                />
            }
        </>
    )
}

export { Eyedropper }
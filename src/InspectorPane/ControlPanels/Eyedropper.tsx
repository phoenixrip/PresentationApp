import { editorContext, EditorContextTypes } from "../../Editor";
import { useContext, useState, useRef, useEffect, useCallback } from "react";
import { UseFaIcon } from "../../Utils/UseFaIcon";
import { faEyedropper } from "@fortawesome/free-solid-svg-icons";
const tinycolor = require("tinycolor2");

interface EydropperPropsType {
    onChange: Function
}

const Eyedropper = ({ onChange }: EydropperPropsType) => {
    const context: EditorContextTypes = useContext(editorContext);
    const eyedropperPreview = useRef<any>(null)
    const [enabled, setEnabled] = useState(false)

    const updateEyedropperColor = useCallback((e: any) => {
        const canvasContext = context.fabricCanvas?.getContext()
        const mouse = context.fabricCanvas!.getPointer(e, true)
        const px = canvasContext!.getImageData(mouse.x, mouse.y, 1, 1).data
        eyedropperPreview.current.style.backgroundColor = `rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
        eyedropperPreview.current.style.color = `rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    }, [])

    const selectEyedropperColor = useCallback((e: any) => {
        onChange(tinycolor(eyedropperPreview.current!.style.backgroundColor).toRgb())
        setEnabled(false)
    }, [])

    const handleMouseMove = useCallback((e: any) => {
        eyedropperPreview.current!.style.left = e.pageX + 'px';
        eyedropperPreview.current!.style.top = e.pageY + 'px';
    }, [])

    useEffect(() => {
        if (enabled) {
            context.fabricCanvas!.eyedropperActive = true
            document.addEventListener("mousemove", handleMouseMove, true)
            context.fabricCanvas!.on("mouse:move", updateEyedropperColor)
            context.fabricCanvas!.on("mouse:down", selectEyedropperColor)
        } else {
            document.removeEventListener("mousemove", handleMouseMove, true)
            context.fabricCanvas!.off("mouse:move", updateEyedropperColor)
            context.fabricCanvas!.off("mouse:down", selectEyedropperColor)
            context.fabricCanvas!.eyedropperActive = false
        }
    }, [enabled])

    return (
        <>
            <UseFaIcon 
            icon={faEyedropper} 
            onClick={() => setEnabled(!enabled)} 
            style={{ margin: "0",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)"}}/>
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
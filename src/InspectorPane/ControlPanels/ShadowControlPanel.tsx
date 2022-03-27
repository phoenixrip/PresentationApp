import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';
import { fabric } from "fabric";

function ShadowControlPanel() {
    const context: EditorContextTypes = useContext(editorContext);
    const selection: any | undefined = context.fabricCanvas?.getActiveObject()
    const setOnFabricObject: Function = context.setOnFabricObject

    // const setOnObjectShadow = (obj: fabric.Object, setting: string, val: any) => {
    //   if (obj && typeof obj.shadow === "object") {
    //     obj.shadow[setting] = val
    //     obj?.setCoords();
    //     obj?.canvas?.renderAll()
    // }

    const setOnSelectionShadow = (setting: string, val: any) => {
        selection.shadow[setting] = val
        selection.setCoords();
        selection.canvas.renderAll()
    }


    return (
        <>
            <Switch
                checkedChildren={"Shadow"}
                unCheckedChildren={""}
                checked={selection?.shadow}
                onChange={e => {
                    if (selection?.shadow) {
                        setOnFabricObject(selection, {shadow: undefined})
                        return
                    } else {
                        setOnFabricObject(selection, {shadow: new fabric.Shadow("50px 50px 50px rgba(0,0,0,1)")})
                    }
                }}
            />
            {selection?.shadow &&
                <>
                    <InputNumber addonBefore="Blur"
                        addonAfter="px"
                        min={0}
                        max={1000}
                        precision={0}
                        value={selection.shadow.blur}
                        onChange={e => setOnSelectionShadow("blur", e)} />
                    <CirclePicker
                        color={selection.shadow.color || "rgba(10,10,10,0.5)"}
                        onChange={e => { setOnSelectionShadow("color", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`) }}
                    />
                    <InputNumber addonBefore="X-offset"
                        addonAfter="px"
                        min={0}
                        max={1000}
                        precision={0}
                        value={selection.shadow.offsetX}
                        onChange={e => setOnSelectionShadow("offsetX", e)} />
                    <InputNumber addonBefore="Y-offset"
                        addonAfter="px"
                        min={0}
                        max={1000}
                        precision={0}
                        value={selection.shadow.offsetY}
                        onChange={e => setOnSelectionShadow("offsetY", e)} />
                    <pre>{selection && JSON.stringify(selection.shadow, null, 4)}</pre>
                </>
            }
        </>
    )

}

export { ShadowControlPanel }
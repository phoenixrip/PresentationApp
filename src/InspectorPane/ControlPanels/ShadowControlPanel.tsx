import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';
import { fabric } from "fabric";

function ShadowControlPanel() {
    const context: EditorContextTypes = useContext(editorContext);
    const selection: any | undefined = context.fabricCanvas?.getActiveObject()
    const setOnFabricObject: Function = context.setOnFabricObject

    return (
        <>
            <Switch
                checkedChildren={"Shadow"}
                unCheckedChildren={""}
                checked={selection?.shadow}
                onChange={e => {
                    if (selection?.shadow) {
                        setOnFabricObject(selection, { shadow: undefined })
                        return
                    } else {
                        setOnFabricObject(selection, { shadow: new fabric.Shadow("50px 50px 50px rgba(0,0,0,1)") })
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
                        onChange={e => setOnFabricObject(selection, { shadow: { ...selection.shadow, blur: e } })}
                    />
                    <CirclePicker
                        color={selection.shadow.color || "rgba(10,10,10,0.5)"}
                        onChange={e => setOnFabricObject(selection, { shadow: { ...selection.shadow, color: `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})` } })}
                    />
                    <InputNumber addonBefore="X-offset"
                        addonAfter="px"
                        min={-1000}
                        max={1000}
                        precision={0}
                        value={selection.shadow.offsetX}
                        onChange={e => setOnFabricObject(selection, { shadow: { ...selection.shadow, offsetX: e} })}
                        />
                    <InputNumber addonBefore="Y-offset"
                        addonAfter="px"
                        min={-1000}
                        max={1000}
                        precision={0}
                        value={selection.shadow.offsetY}
                        onChange={e => setOnFabricObject(selection, { shadow: { ...selection.shadow, offsetY: e} })}
                        />
                    <pre>{selection && JSON.stringify(selection.shadow, null, 4)}</pre>
                </>
            }
        </>
    )

}

export { ShadowControlPanel }
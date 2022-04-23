import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';
import { fabric } from "fabric";
import { EquationInput } from "../EquationInput";
import { Colorpicker } from "./Colorpicker";

interface Props {
    selection: any | undefined
}

const ShadowControlPanel = ({ selection }: Props) => {
    const context: EditorContextTypes = useContext(editorContext);
    const setOnFabricObject: Function = context.setOnFabricObject

    const handleSetOnShadow = () => {

    }

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
                        setOnFabricObject(selection, { shadow: new fabric.Shadow("0px 0px 10px rgba(0, 0, 0, 1)") })
                    }
                }}
            />
            {selection?.shadow &&
                <>
                    <EquationInput addonBefore="Blur"
                        addonAfter="px"
                        min={0}
                        max={1000}
                        precision={0}
                        value={selection.shadow.blur}
                        onChange={(e: any) => setOnFabricObject(selection, { shadow: { ...selection.shadow, blur: e.value } })}
                    />
                    <EquationInput addonBefore="X-offset"
                        addonAfter="px"
                        min={-1000}
                        max={1000}
                        precision={0}
                        value={selection.shadow.offsetX}
                        onChange={(e: any) => setOnFabricObject(selection, { shadow: { ...selection.shadow, offsetX: e.value } })}
                    />
                    <EquationInput addonBefore="Y-offset"
                        addonAfter="px"
                        min={-1000}
                        max={1000}
                        precision={0}
                        value={selection.shadow.offsetY}
                        onChange={(e: any) => setOnFabricObject(selection, { shadow: { ...selection.shadow, offsetY: e.value } })}
                    />
                    <Colorpicker
                        color={selection.shadow.color || "rgba(10,10,10,0.5)"}
                        onChange={(e: any) => setOnFabricObject(selection, { shadow: { ...selection.shadow, color: `rgba(${e.r},${e.g},${e.b},${e.a})` } })}
                    />

                </>
            }
        </>
    )

}

export { ShadowControlPanel }
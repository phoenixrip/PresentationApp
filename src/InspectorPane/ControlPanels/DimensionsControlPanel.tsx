import { useContext } from "react";
import { globalContext } from "../../App";
import { globalContextType } from "../../App";
import { InputNumber, Switch } from "antd"

function DimensionsControlPanel() {
    const context: globalContextType = useContext(globalContext);
    const selection: any | undefined = context.fabricCanvas?.getActiveObject()
    const setOnFabricObject: Function = context.setOnFabricObject

    return (
        <>
            <InputNumber addonBefore="Width:"
                addonAfter="px"
                min={0}
                max={1000}
                precision={0}
                value={selection.width}
                onChange={(e) => { setOnFabricObject(selection, "width", e) }} />
            <Switch
                checkedChildren={"Moveable x"}
                unCheckedChildren={"Locked x"}
                checked={!selection.lockMovementX}
                onChange={e => setOnFabricObject(selection, "lockMovementX", !e)}
            />
            <InputNumber addonBefore="Height:"
                addonAfter="px"
                min={0}
                max={1000}
                precision={0}
                value={selection.height}
                onChange={(e) => { setOnFabricObject(selection, "height", e) }} />
            <Switch
                checkedChildren={"Moveable y"}
                unCheckedChildren={"Locked y"}
                checked={!selection.lockMovementY}
                onChange={e => setOnFabricObject(selection, "lockMovementY", !e)}
            />
            <InputNumber addonBefore="Angle:"
                addonAfter="°"
                min={-360}
                max={360}
                precision={0}
                value={selection.angle}
                onChange={(e) => { setOnFabricObject(selection, "angle", e) }} />
            <InputNumber addonBefore="Skew X:"
                addonAfter="px"
                min={-1000}
                max={1000}
                precision={0}
                value={selection.skewX}
                onChange={(e) => { setOnFabricObject(selection, "skewX", e) }} />
            <InputNumber addonBefore="Skew Y:"
                addonAfter="px"
                min={-1000}
                max={1000}
                precision={0}
                value={selection.skewY}
                onChange={(e) => { setOnFabricObject(selection, "skewY", e) }} />

            <Switch
                checkedChildren={"Rotatable"}
                unCheckedChildren={"Rotation locked"}
                checked={!selection.lockRotation}
                onChange={e => setOnFabricObject(selection, "lockRotation", !e)}
            />
            {//TODO: lockScalingX is the only thing checked for both scaling locks
                //Should we also onchange lockScalingX/Y also lock the other=
            }
            <Switch
                checkedChildren={"Scalable"}
                unCheckedChildren={"Scaling locked"}
                checked={!selection.lockScalingX}
                onChange={e => {
                    setOnFabricObject(selection, "lockScalingX", !e)
                    setOnFabricObject(selection, "lockScalingY", !e)
                }}
            />
            {//TODO: lockSkewingX is the only thing checked for both skewing locks
                //Should we also onchange lockSkewingX/Y also lock the other=
            }
            <Switch
                checkedChildren={"Skewing"}
                unCheckedChildren={"Skewing locked"}
                checked={!selection.lockSkewingX}
                onChange={e => {
                    setOnFabricObject(selection, "lockSkewingX", !e)
                    setOnFabricObject(selection, "lockSkewingY", !e)
                }}
            />
        </>
    )

}

export { DimensionsControlPanel }
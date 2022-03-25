import { useContext } from "react";
import { globalContext } from "../../App";
import { globalContextType } from "../../App";
import { CirclePicker } from 'react-color';

function FillControlPanel() {
    const context: globalContextType = useContext(globalContext);
    const selection: any | undefined = context.fabricCanvas?.getActiveObject()
    const setOnFabricObject: Function = context.setOnFabricObject

    return (
        <>
        <CirclePicker
                color={selection.fill}
                onChange={e => {
                  setOnFabricObject(selection, "fill", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)
                }} />
              {/* <ChromePicker
                color={selection.fill}
                onChange={e => {
                  setOnFabricObject(selection, "fill", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)
                }} /> */}
        </>
    )

}

export { FillControlPanel }
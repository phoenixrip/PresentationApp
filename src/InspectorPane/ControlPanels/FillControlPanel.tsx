// import { useContext, useEffect, useState } from "react";
// import { editorContext, EditorContextTypes } from "../../Editor";
// import { Select } from "antd";
// import { fabric } from "fabric";
import { CustomFabricObject } from "../../Types/CustomFabricTypes";
import { FillPicker } from "../../FillPicker/FillPicker";
import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../EditorContext";

interface Props {
	selection: CustomFabricObject
}

const FillControlPanel = ({ selection }: Props) => {
	const context: EditorContextTypes = useContext(editorContext);

	return (
		<>
			<FillPicker
				title='El fill'
				onChange={(newFill) => context.setOnFabricObject(selection, { fill: newFill })}
				fillValue={selection.fill}
				liveObject={selection}
			/>
		</>
	)
}

// const FillControlPanel = ({ selection }: Props) => {
//     const context: EditorContextTypes = useContext(editorContext);
//     const setOnFabricObject: Function = context.setOnFabricObject

//     const [fillMode, setFillMode] = useState(selection?.fill?.type || "solid")

//     const updateFillMode = (newFillMode: any) => {
//         switch (newFillMode) {
//             case "solid":
//                 if (typeof selection.fill !== "string") {
//                     setOnFabricObject(selection, { fill: selection.fill.colorStops[0].color || 'rgba(0,0,0,1)' })
//                     setFillMode("solid")
//                 }
//                 break
//             case "linear":
//                 if (selection.fill!.type !== "linear") {
//                     if (typeof selection.fill === "string") {
//                         const linearGradient = new fabric.Gradient({
//                             type: "linear",
//                             coords: {
//                                 x1: 0,
//                                 y1: 0,
//                                 x2: selection.width,
//                                 y2: selection.height,
//                             },
//                             colorStops: [
//                                 {
//                                     "offset": 0.25,
//                                     "color": selection.fill
//                                 },
//                                 {
//                                     "offset": 0.75,
//                                     "color": "#000000"
//                                 }
//                             ]
//                         })
//                         setOnFabricObject(selection, { fill: linearGradient }, "setGradient")
//                         selection.refreshGradientAngleControls()
//                     } else if (selection.fill!.type === "radial") {
//                         const linearGradient = new fabric.Gradient({
//                             type: "linear",
//                             coords: {
//                                 x1: 0,
//                                 y1: 0,
//                                 x2: selection.width,
//                                 y2: selection.height,
//                             },
//                             colorStops: selection.fill.colorStops
//                         })
//                         setOnFabricObject(selection, { fill: linearGradient }, "setGradient")
//                         selection.refreshGradientAngleControls()
//                     }
//                     setFillMode("linear")
//                 }
//                 break
//             case "radial":
//                 if (selection.fill?.type !== "radial") {
//                     if (typeof selection.fill === "string") {
//                         const radialGradient = new fabric.Gradient({
//                             type: "radial",
//                             coords: {
//                                 r1: selection.height / 2 + selection.width / 4,
//                                 r2: selection.width * .05,

//                                 x1: selection.width / 2,
//                                 y1: selection.height / 2,

//                                 x2: selection.width / 2,
//                                 y2: selection.height / 2
//                             },
//                             colorStops: [
//                                 {
//                                     "offset": 0.25,
//                                     "color": selection.fill
//                                 },
//                                 {
//                                     "offset": 0.75,
//                                     "color": "#000000"
//                                 },
//                             ]
//                         })
//                         console.log({radialGradient})
//                         setOnFabricObject(selection, { fill: radialGradient }, "setGradient")
//                         selection.refreshGradientAngleControls()
//                     } else if (selection.fill!.type === "linear") {
//                         const radialGradient = new fabric.Gradient({
//                             type: "radial",
//                             coords: {
//                                 r1: selection.height / 2 + selection.width / 4,
//                                 r2: selection.width * .05,

//                                 x1: selection.width / 2,
//                                 y1: selection.height / 2,

//                                 x2: selection.width / 2,
//                                 y2: selection.height / 2
//                             },
//                             colorStops: selection.fill.colorStops
//                         })
//                         setOnFabricObject(selection, { fill: radialGradient }, "setGradient")
//                         selection.refreshGradientAngleControls()
//                     }
//                     setFillMode("radial")
//                 }
//                 break
//             default:
//                 break
//         }
//     }

//     return (
//         <>
//             <Select value={fillMode} onChange={updateFillMode} bordered={false}>
//                 <Select.Option value="solid">Solid</Select.Option>
//                 <Select.Option value="linear">Linear</Select.Option>
//                 <Select.Option value="radial">Radial</Select.Option>
//             </Select>
//             {typeof selection.fill === "string" &&
//                 <Colorpicker
//                     color={selection.fill}
//                     onChange={(e: any) => setOnFabricObject(selection, { fill: `rgba(${e.r},${e.g},${e.b},${e.a})` })} />
//             }
//             {(selection.fill?.type === "linear" || selection.fill?.type === "radial") &&
//                 <Gradientpicker gradient={selection.fill} onChange={(e: any) => setOnFabricObject(selection, { fill: new fabric.Gradient(e) }, "setGradient")} />
//             }

//         </>
//     )

// }

export { FillControlPanel }
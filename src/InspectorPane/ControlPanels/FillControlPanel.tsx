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
		<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
			<FillPicker
				fillLocation='fill'
				title='El fill'
				onChange={(newFill) => context.setOnFabricObject(selection, { fill: newFill })}
				fillValue={selection.fill}
				liveObject={selection}
				open={(selection?.editingType === 'fill' && selection.editingLocation === 'fill') ? true : false}
			/>
		</div>
	)
}

export { FillControlPanel }
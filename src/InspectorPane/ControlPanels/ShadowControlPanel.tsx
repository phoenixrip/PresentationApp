import { useContext } from "react";
import { editorContext, EditorContextTypes } from "../../Editor";
import { CirclePicker } from 'react-color';
import { Button, InputNumber, Collapse, Switch, Radio, Row, Col } from 'antd';
import { fabric } from "fabric";
import { EquationInput } from "../EquationInput";
import { FillPicker } from "../../FillPicker/FillPicker";

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
			{!selection?.shadow &&
				<Button onClick={() => setOnFabricObject(selection, { shadow: new fabric.Shadow("0px 0px 10px rgba(0, 0, 0, 1)") })}>Insert Shadow</Button>
			}
			{selection?.shadow &&
				<>
					<Button onClick={() => setOnFabricObject(selection, { shadow: undefined })}>x</Button>

					<Row>
						<Col span={12}>
							<EquationInput
								size={context.state.antdSize}
								addonBefore="Blur"
								addonAfter="px"
								min={0}
								max={1000}
								precision={0}
								value={selection.shadow.blur}
								onChange={(e: any) => setOnFabricObject(selection, { shadow: { ...selection.shadow, blur: e.value } })}
							/>
						</Col>
						<Col span={10} offset={2}>
							<EquationInput
								size={context.state.antdSize}
								min={-1000}
								max={1000}
								precision={0}
								value={selection.shadow.offsetX}
								style={{ width: "40%", marginRight: "3px" }}
								onChange={(e: any) => setOnFabricObject(selection, { shadow: { ...selection.shadow, offsetX: e.value } })}
							/>
							<span>x</span>
							<EquationInput
								size={context.state.antdSize}
								min={-1000}
								max={1000}
								precision={0}
								value={selection.shadow.offsetY}
								style={{ width: "40%", marginLeft: "3px" }}
								onChange={(e: any) => setOnFabricObject(selection, { shadow: { ...selection.shadow, offsetY: e.value } })}
							/>
						</Col>
					</Row>
					<FillPicker
						fillLocation='shadow'
						title='Shadow fill'
						liveObject={selection}
						fillValue={selection.shadow.color || "rgba(10,10,10,0.5)"}
						open={(selection?.editingType === 'fill' && selection.editingLocation === 'shadow') ? true : false}
						onChange={(color: string) => setOnFabricObject(selection, { shadow: { ...selection.shadow, color } })}
					/>
				</>
			}
		</>
	)

}

export { ShadowControlPanel }
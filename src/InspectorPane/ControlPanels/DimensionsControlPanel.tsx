import { useContext } from "react"
import { editorContext, EditorContextTypes } from "../../Editor";
import { InputNumber, Switch, Button, Slider, Row, Col } from "antd"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoffee, faLock, faUnlock } from '@fortawesome/free-solid-svg-icons'

import { EquationInput } from "../EquationInput";

import Input from "rc-input";

interface Props {
	selection: any | undefined
}

const DimensionsControlPanel = ({ selection }: Props) => {
	const context: EditorContextTypes = useContext(editorContext)
	const setOnFabricObject: Function = context.setOnFabricObject

	return (
		<>
			<Row>
				<Col span={2}>
					L
				</Col>
				<Col span={22}>
					<Row>
						<EquationInput
							size={context.state.antdSize}
							addonBefore="W"
							min={0}
							max={1000}
							precision={0}
							value={selection.width}
							equation={selection?.widthEquation}
							onChange={(e: any) => { setOnFabricObject(selection, { width: e.value, widthEquation: e.equation }, "scale") }}
						/>
					</Row>
					<Row>
					<EquationInput
				size={context.state.antdSize}
				addonBefore="Width:"
				min={0}
				max={1000}
				precision={0}
				value={selection.width}
				equation={selection?.widthEquation}
				onChange={(e: any) => { setOnFabricObject(selection, { width: e.value, widthEquation: e.equation }, "scale") }}
			/>

					</Row>
				</Col>
			</Row>
			<EquationInput
				size={context.state.antdSize}
				addonBefore="W"
				min={0}
				max={1000}
				precision={0}
				value={selection.width}
				equation={selection?.widthEquation}
				onChange={(e: any) => { setOnFabricObject(selection, { width: e.value, widthEquation: e.equation }, "scale") }}
			/>
			<p> OOOOOOLLLLLDDD</p>
			<EquationInput
				size={context.state.antdSize}
				addonBefore="Width:"
				addonAfter={<Switch
					checkedChildren={<FontAwesomeIcon icon={faUnlock} />}
					unCheckedChildren={<FontAwesomeIcon icon={faLock} />}
					checked={!selection.lockMovementX}
					onChange={e => setOnFabricObject(selection, { lockMovementX: !e })}
				/>}
				min={0}
				max={1000}
				precision={0}
				value={selection.width}
				equation={selection?.widthEquation}
				onChange={(e: any) => { setOnFabricObject(selection, { width: e.value, widthEquation: e.equation }, "scale") }}
			/>
			<EquationInput
				size={context.state.antdSize}
				addonBefore="Height:"
				addonAfter={<Switch
					checkedChildren={<FontAwesomeIcon icon={faUnlock} />}
					unCheckedChildren={<FontAwesomeIcon icon={faLock} />}
					checked={!selection.lockMovementY}
					onChange={e => setOnFabricObject(selection, { lockMovementY: !e })}
				/>}
				min={0}
				max={1000}
				precision={0}
				value={selection.height}
				equation={selection?.heightEquation}
				onChange={(e: any) => { setOnFabricObject(selection, { height: e.value, heightEquation: e.equation }, "scale") }} />

			<EquationInput
				size={context.state.antdSize}
				addonBefore="Angle:"
				addonAfter={<Switch
					checkedChildren={<FontAwesomeIcon icon={faUnlock} />}
					unCheckedChildren={<FontAwesomeIcon icon={faLock} />}
					checked={!selection.lockRotation}
					onChange={e => setOnFabricObject(selection, { lockRotation: !e })}
				/>}
				min={-360}
				max={360}
				precision={0}
				value={selection.angle}
				onChange={(e: any) => { setOnFabricObject(selection, { angle: e.value }) }} />
			<EquationInput
				size={context.state.antdSize}
				addonBefore="Skew X:"
				addonAfter="px"
				min={-1000}
				max={1000}
				precision={0}
				value={selection.skewX}
				onChange={(e: any) => { setOnFabricObject(selection, { skewX: e.value }) }} />
			<EquationInput
				size={context.state.antdSize}
				addonBefore="Skew Y:"
				addonAfter="px"
				min={-1000}
				max={1000}
				precision={0}
				value={selection.skewY}
				onChange={(e: any) => { setOnFabricObject(selection, { skewY: e.value }) }} />
			<InputNumber
				addonBefore={'ScaleX'}
				value={selection.scaleX}
			// onChange={(e: any) => { setOnFabricObject(selection, { skewY: e.value }) }} />
			/>
			{//TODO: lockScalingX is the only thing checked for both scaling locks
				//Should we also onchange lockScalingX/Y also lock the other=
			}
			<Switch
				checkedChildren={"Scalable"}
				unCheckedChildren={"Scaling locked"}
				checked={!selection.lockScalingX}
				onChange={e => {
					setOnFabricObject(selection, { lockScalingX: !e })
					setOnFabricObject(selection, { lockScalingY: !e })
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
					setOnFabricObject(selection, { lockSkewingX: !e })
					setOnFabricObject(selection, { lockSkewingY: !e })
				}}
			/>
			<Slider
				value={selection.opacity}
				min={0}
				max={1}
				step={0.01}
				onChange={value => {
					setOnFabricObject(selection, { opacity: value })
				}}
			/>
		</>
	)
}

export { DimensionsControlPanel }
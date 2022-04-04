import { useContext } from "react"
import { editorContext, EditorContextTypes } from "../../Editor";
import { InputNumber, Switch, Button } from "antd"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoffee, faLock, faUnlock } from '@fortawesome/free-solid-svg-icons'

import { EquationInput } from "../EquationInput";

import { calculateFromString } from '../../Utils/calculateFromString.js'

// console.log(calculateFromString("2+2"))

function DimensionsControlPanel() {
	const context: EditorContextTypes = useContext(editorContext)
	const selection: any | undefined = context.fabricCanvas?.getActiveObject()
	const setOnFabricObject: Function = context.setOnFabricObject


	return (
		<>
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
				onChange={(e:any) => { setOnFabricObject(selection, { height: e.value, heightEquation: e.equation }, "scale") }} />

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
		</>
	)
}

export { DimensionsControlPanel }
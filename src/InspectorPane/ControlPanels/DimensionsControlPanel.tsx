import { useContext, useRef, useState } from "react"
import { editorContext, EditorContextTypes } from "../../Editor";
import { InputNumber, Switch, Button, Slider, Row, Col, Input } from "antd"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faUnlock, faLockOpen, faRotateLeft, faRotateRight, faRepeat, faSquare, faCircleDot, faArrowRight, faArrowUp, faUpRightAndDownLeftFromCenter, faRotate } from '@fortawesome/free-solid-svg-icons'

import { EquationInput } from "../EquationInput";
import { UseFaIcon } from "../../Utils/UseFaIcon";
import { SkinnyNumberInput } from "../SkinnyNumberInput";

interface Props {
	selection: any | undefined
}

const DimensionsControlPanel = ({ selection }: Props) => {
	const context: EditorContextTypes = useContext(editorContext)
	const setOnFabricObject: Function = context.setOnFabricObject

	const [aspectRatioLocked, setAspectRatioLocked] = useState(false)
	const aspectRatio = useRef(selection.width / selection.height)

	return (
		<>
			<Row align="middle">
				{/* <Col span={2} style={{ position: "relative" }}>
					<UseFaIcon icon={aspectRatioLocked ? faLock : faLockOpen}
						style={{ cursor: "pointer" }}
						onClick={() => {
							aspectRatio.current = selection.width / selection.height
							setAspectRatioLocked(!aspectRatioLocked)
						}}
					/>
				</Col> */}
				<Col>
					<Row>
						<Col span={12}>
							<InputNumber
								addonBefore="x"
								value={selection.left}
								onChange={(e: any) => {
									setOnFabricObject(selection, { left: parseInt(e) })
								}}
							/>
							{/* <EquationInput
								size={context.state.antdSize}
								addonBefore="x"
								min={-1000}
								max={1000}
								precision={0}
								value={selection.left}
								onChange={(e: any) => { setOnFabricObject(selection, { left: e.value }) }}
							/> */}
						</Col>
						<Col span={12}>
							<InputNumber
								addonBefore="y"
								value={selection.top}
								onChange={(e: any) => {
									setOnFabricObject(selection, { top: parseInt(e) })
								}}
							/>
							{/* <EquationInput
								size={context.state.antdSize}
								addonBefore="y"
								min={-1000}
								max={1000}
								precision={0}
								value={selection.top}
								onChange={(e: any) => { setOnFabricObject(selection, { top: e.value }) }} /> */}
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<EquationInput
								size={context.state.antdSize}
								addonBefore="w"
								min={0}
								max={1000}
								precision={0}
								value={selection.width}
								equation={selection?.widthEquation}
								onChange={(e: any) => {
									if (!aspectRatioLocked) setOnFabricObject(selection, { width: e.value, widthEquation: e.equation }, "scale")
									else setOnFabricObject(selection, { width: e.value, height: e.value / aspectRatio.current }, "scale")
								}}
							/>
						</Col>
						<Col span={12}>
							<EquationInput
								size={context.state.antdSize}
								addonBefore="h"
								min={0}
								max={1000}
								precision={0}
								value={selection.height}
								equation={selection?.heightEquation}
								onChange={(e: any) => {
									if (!aspectRatioLocked) setOnFabricObject(selection, { height: e.value, heightEquation: e.equation }, "scale")
									else setOnFabricObject(selection, { height: e.value, width: e.value * aspectRatio.current }, "scale")
								}}
							/>
						</Col>
					</Row>
				</Col>
			</Row>

			<Row align="middle" style={{ marginTop: "20px" }}>
				<Col span={14}>
					<Row align="middle">
						<Col span={4}>
							<UseFaIcon icon={faRotate} />
						</Col>
						<Col span={20}>
							<EquationInput
								size={context.state.antdSize}
								addonAfter="°"
								addonBefore={<UseFaIcon icon={faRotate} />}
								min={-360}
								max={360}
								precision={0}
								value={selection.angle}
								onChange={(e: any) => { setOnFabricObject(selection, { angle: e.value }) }}
							/>
							<Button size={context.state.antdSize}
								style={{ width: "25%" }}
								onClick={() => setOnFabricObject(selection, { angle: selection.angle + 90 })}>
								<UseFaIcon icon={faRotateLeft} />
							</Button>
							<Button size={context.state.antdSize}
								style={{ width: "25%" }}
								onClick={() => setOnFabricObject(selection, { angle: selection.angle - 90 })}>
								<UseFaIcon icon={faRotateRight} />
							</Button>
							<Button size={context.state.antdSize}
								style={{ width: "25%" }}
								onClick={() => setOnFabricObject(selection, { flipX: !selection.flipX })}>
								<UseFaIcon icon={faRepeat} />
							</Button>
							<Button size={context.state.antdSize}
								style={{ width: "25%" }}
								onClick={() => setOnFabricObject(selection, { flipY: !selection.flipY })}>
								<UseFaIcon className={"fa-rotate-90"} icon={faRepeat} />
							</Button>
						</Col>
					</Row>
				</Col>
				<Col span={10}>
					<Row align="middle">
						<Col span={8}>
							<UseFaIcon icon={faSquare} style={{ transform: "skew(-30deg,-10deg)", paddingLeft: "10px" }} />
						</Col>
						<Col span={16}>
							<EquationInput
								size={context.state.antdSize}
								addonBefore="x"
								min={-1000}
								max={1000}
								precision={0}
								value={selection.skewX}
								onChange={(e: any) => { setOnFabricObject(selection, { skewX: e.value }) }} />
							<EquationInput
								size={context.state.antdSize}
								addonBefore="y"
								min={-1000}
								max={1000}
								precision={0}
								value={selection.skewY}
								onChange={(e: any) => { setOnFabricObject(selection, { skewY: e.value }) }} />
						</Col>
					</Row>
				</Col>
			</Row>

			{selection?.type === 'CRect' &&
				<Row>
					<InputNumber
						min={0}
						addonBefore='cornerRad'
						value={selection.rx || 0}
						onChange={newRx => setOnFabricObject(selection, { rx: newRx, ry: newRx })}
					/>
					{/* <InputNumber addonBefore='ry' value={selection.ry || 0} onChange={newRy => setOnFabricObject(selection, { ry: newRy })} /> */}
				</Row>
			}
			{/* Locking movements */}
			{/* <Row style={{ marginTop: "20px" }}>
				<Col span={6}>
					<UseFaIcon icon={selection.lockMovementX ? faLock : faLockOpen}
						style={{ width: "100%", cursor: "pointer" }}
						onClick={() => setOnFabricObject(selection, { lockMovementX: !selection.lockMovementX })}
					/>
					<UseFaIcon icon={faArrowRight} style={{ width: "100%" }} />
				</Col>
				<Col span={6}>
					<UseFaIcon icon={selection.lockMovementY ? faLock : faLockOpen}
						style={{ width: "100%", cursor: "pointer" }}
						onClick={() => setOnFabricObject(selection, { lockMovementY: !selection.lockMovementY })}
					/>
					<UseFaIcon icon={faArrowUp} style={{ width: "100%" }} />
				</Col>
				<Col span={6}>
					<UseFaIcon icon={selection.lockScalingX && selection.lockScalingY ? faLock : faLockOpen}
						style={{ width: "100%", cursor: "pointer" }}
						onClick={() => setOnFabricObject(selection, {
							lockScalingX: !selection.lockScalingX,
							lockScalingY: !selection.lockScalingX
						})}
					/>
					<UseFaIcon icon={faUpRightAndDownLeftFromCenter} style={{ width: "100%" }} />
				</Col>
				<Col span={6}>
					<UseFaIcon icon={selection.lockSkewingX && selection.lockSkewingY ? faLock : faLockOpen}
						style={{ width: "100%", cursor: "pointer" }}
						onClick={() => setOnFabricObject(selection, {
							lockSkewingX: !selection.lockSkewingX,
							lockSkewingY: !selection.lockSkewingX
						})}
					/>
					<UseFaIcon icon={faSquare} style={{ transform: "skew(-30deg,-10deg)", width: "100%" }} />
				</Col>
			</Row> */}
		</>
	)
}

export { DimensionsControlPanel }
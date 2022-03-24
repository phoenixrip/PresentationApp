import React, { useContext } from "react";
import { globalContext } from "../App";
import { globalContextType } from "../App";
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';
const { Panel } = Collapse;
import { CirclePicker } from 'react-color';
import { fabric } from "fabric";
import { Canvas } from "fabric/fabric-impl";
import { PositionControlPanel } from "./ControlPanels/PositionControlPanel";

const InspectorContainer = (props: Object) => {
  const context: globalContextType = useContext(globalContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()
  const setOnFabricObject: Function = context.setOnFabricObject



  // const setOnObjectShadow = (obj: fabric.Object, setting: string, val: any) => {
  //   if (obj && typeof obj.shadow === "object") {
  //     obj.shadow[setting] = val
  //     obj?.setCoords();
  //     obj?.canvas?.renderAll()
  // }

  const setOnSelectionShadow = (setting: string, val: any) => {
    selection.shadow[setting] = val
    selection.setCoords();
    selection.canvas.renderAll()
  }

  const getStrokeDashState = () => {
    return "lol"
  }

  if (selection) console.log("strokedash", !selection?.strokeDashArray)
  return (
    <>
      {!selection &&
        <p>no element selected</p>
      }

      {selection &&
        <>
          <Collapse defaultActiveKey={["1", "2", "3", "4", "5"]}>
            <Panel header="Dimensions" key="1">
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
            </Panel>
            <Panel header="Position" key="2">
              <PositionControlPanel></PositionControlPanel>
            </Panel>
            <Panel header="Fill" key="3">
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
            </Panel>
            <Panel header="Border" key="4">
              <CirclePicker
                color={selection.stroke || "rgba(0,0,0,0)"}
                onChange={e => {
                  setOnFabricObject(selection, "stroke", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)
                }} />
              <InputNumber
                addonBefore="Thickness"
                addonAfter="px"
                min={0}
                max={1000}
                value={selection.strokeWidth || 0}
                onChange={e => {
                  setOnFabricObject(selection, "strokeWidth", e)
                }} />

              <Radio.Group value={getStrokeDashState()} size="small" style={{ marginTop: 16 }}>
                <Radio.Button value="solid" onClick={() => { }}>-</Radio.Button>
                <Radio.Button value="dotted" onClick={() => { }}>...</Radio.Button>
                <Radio.Button value="dashed" onClick={() => { }}>---</Radio.Button>
                <Radio.Button value="large-dashed" onClick={() => { }}>- -</Radio.Button>
              </Radio.Group>
            </Panel>
            <Panel header="Shadow" key="5">
              <Switch
                checkedChildren={"Shadow"}
                unCheckedChildren={""}
                checked={selection?.shadow}
                onChange={e => {
                  if (selection?.shadow) {
                    setOnFabricObject(selection, "shadow", undefined)
                    return
                  } else {
                    setOnFabricObject(selection, "shadow", new fabric.Shadow("50px 50px 50px rgba(0,0,0,1)"))
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
                    onChange={e => setOnSelectionShadow("blur", e)} />
                  <CirclePicker
                    color={selection.shadow.color || "rgba(10,10,10,0.5)"}
                    onChange={e => { setOnSelectionShadow("color", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`) }}
                  />
                  <InputNumber addonBefore="X-offset"
                    addonAfter="px"
                    min={0}
                    max={1000}
                    precision={0}
                    value={selection.shadow.offsetX}
                    onChange={e => setOnSelectionShadow("offsetX", e)} />
                  <InputNumber addonBefore="Y-offset"
                    addonAfter="px"
                    min={0}
                    max={1000}
                    precision={0}
                    value={selection.shadow.offsetY}
                    onChange={e => setOnSelectionShadow("offsetY", e)} />
                  <pre>{selection && JSON.stringify(selection.shadow, null, 4)}</pre>
                </>
              }
            </Panel>


          </Collapse>

          <pre>{selection && JSON.stringify(selection, null, 4)}</pre>
        </>
      }
    </>
  );
};

export { InspectorContainer };

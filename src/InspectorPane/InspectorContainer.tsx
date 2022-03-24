import React, { useContext } from "react";
import { globalContext } from "../App";
import { globalContextType } from "../App";
import { Button, InputNumber, Collapse, Switch, Radio } from 'antd';
const { Panel } = Collapse;
import { CirclePicker } from 'react-color';
import { fabric } from "fabric";
import { Canvas } from "fabric/fabric-impl";

const InspectorContainer = (props: Object) => {
  const context: globalContextType = useContext(globalContext);
  const selection: any | undefined = context.fabricCanvas?.getActiveObject()

  const setOnSelection = (setting: String, val: any) => {
    selection.set(setting, val)
    selection.setCoords();
    selection.canvas.renderAll()
  }

  const setOnSelectionShadow = (setting: string, val: any) => {
    selection.shadow[setting] = val
    selection.setCoords();
    selection.canvas.renderAll()
  }

  if (selection) console.log(selection)
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
                onChange={(e) => { setOnSelection("width", e) }} />
              <Switch
                checkedChildren={"Moveable x"}
                unCheckedChildren={"Locked x"}
                checked={!selection.lockMovementX}
                onChange={e => setOnSelection("lockMovementX", !e)}
              />
              <InputNumber addonBefore="Height:"
                addonAfter="px"
                min={0}
                max={1000}
                precision={0}
                value={selection.height}
                onChange={(e) => { setOnSelection("height", e) }} />
              <Switch
                checkedChildren={"Moveable y"}
                unCheckedChildren={"Locked y"}
                checked={!selection.lockMovementY}
                onChange={e => setOnSelection("lockMovementY", !e)}
              />
              <InputNumber addonBefore="Angle:"
                addonAfter="°"
                min={-360}
                max={360}
                precision={0}
                value={selection.angle}
                onChange={(e) => { setOnSelection("angle", e) }} />
              <InputNumber addonBefore="Skew X:"
                addonAfter="px"
                min={-1000}
                max={1000}
                precision={0}
                value={selection.skewX}
                onChange={(e) => { setOnSelection("skewX", e) }} />
              <InputNumber addonBefore="Skew Y:"
                addonAfter="px"
                min={-1000}
                max={1000}
                precision={0}
                value={selection.skewY}
                onChange={(e) => { setOnSelection("skewY", e) }} />

              <Switch
                checkedChildren={"Rotatable"}
                unCheckedChildren={"Rotation locked"}
                checked={!selection.lockRotation}
                onChange={e => setOnSelection("lockRotation", !e)}
              />
              {//TODO: lockScalingX is the only thing checked for both scaling locks
                //Should we also onchange lockScalingX/Y also lock the other=
              }
              <Switch
                checkedChildren={"Scalable"}
                unCheckedChildren={"Scaling locked"}
                checked={!selection.lockScalingX}
                onChange={e => {
                  setOnSelection("lockScalingX", !e)
                  setOnSelection("lockScalingY", !e)
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
                  setOnSelection("lockSkewingX", !e)
                  setOnSelection("lockSkewingY", !e)
                }}
              />
            </Panel>
            <Panel header="Position" key="2">
              <InputNumber addonBefore="X:"
                addonAfter="px"
                min={0}
                max={1000}
                precision={0}
                value={selection.left}
                onChange={(e) => { setOnSelection("left", e) }} />
              <InputNumber addonBefore="Y:"
                addonAfter="px"
                min={0}
                max={1000}
                precision={0}
                value={selection.top}
                onChange={(e) => { setOnSelection("top", e) }} />
              <Button onClick={() => setOnSelection("flipX", !selection.flipX)}> Flip Horizontal</Button>
              <Button onClick={() => setOnSelection("flipY", !selection.flipY)}> Flip Vertical</Button>
              <Button onClick={() => setOnSelection("angle", selection.angle + 90)}>Rotate</Button>
              <Button onClick={() => setOnSelection("angle", selection.angle - 90)}>Rotate other way</Button>
            </Panel>
            <Panel header="Fill" key="3">
              <CirclePicker
                color={selection.fill}
                onChange={e => {
                  setOnSelection("fill", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)
                }} />
              {/* <ChromePicker
                color={selection.fill}
                onChange={e => {
                  setOnSelection("fill", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)
                }} /> */}
            </Panel>
            <Panel header="Border" key="4">
              <CirclePicker
                color={selection.stroke || "rgba(0,0,0,0)"}
                onChange={e => {
                  setOnSelection("stroke", `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`)
                }} />
              <InputNumber
                addonBefore="Thickness"
                addonAfter="px"
                min={0}
                max={1000}
                value={selection.strokeWidth || 0}
                onChange={e => {
                  setOnSelection("strokeWidth", e)
                }} />

              <Radio.Group defaultValue="a" size="small" style={{ marginTop: 16 }}>
                <Radio.Button value="dotted">Hangzhou</Radio.Button>
                <Radio.Button value="dashed">Shanghai</Radio.Button>
                <Radio.Button value="large-dashed">Beijing</Radio.Button>
              </Radio.Group>
            </Panel>
            <Panel header="Shadow" key="5">
              <Switch
                checkedChildren={"Shadow"}
                unCheckedChildren={""}
                checked={selection?.shadow}
                onChange={e => {
                  if (selection?.shadow) {
                    setOnSelection("shadow", undefined)
                    return
                  } else {
                    setOnSelection("shadow", new fabric.Shadow("50px 50px 50px rgba(0,0,0,1)"))
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

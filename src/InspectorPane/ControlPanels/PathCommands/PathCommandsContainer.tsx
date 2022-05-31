import { fabric } from 'fabric'
import { useEffect } from 'react'
import { CustomFabricObject } from '../../../Types/CustomFabricTypes'
import { SkinnyNumberInput } from '../../SkinnyNumberInput'
import c from './PathCommandsContainer.module.scss'
import classNames from 'classnames'

interface PathCommandsContainerProps {
  selection: CustomFabricObject
}

type PathPointValue = (string | number)[]

function PathCommandsContainer(props: PathCommandsContainerProps) {
  const { selection } = props
  const path = selection.path as unknown as PathPointValue[]
  const hoveredControl = selection?.hoveredControl
  const selectedDict = selection?.selectedPointIndexes ?? {}
  useEffect(() => {
    const obj: CustomFabricObject = selection as unknown as CustomFabricObject
    obj?.enterPathEditingMode?.()
    obj.canvas?.requestRenderAll()
    return () => {
      obj?.exitPathEditingMode?.()
        .canvas?.requestRenderAll()
    }
  }, [])

  function handlePointValueChanged(pointIndex: number, valueIndex: number, newValue: number) {
    path[pointIndex][valueIndex] = newValue
    const selectedPathObject = selection as unknown as CustomFabricObject
    selectedPathObject?.afterManualPathUpdate()
    selectedPathObject?.canvas?.requestRenderAll()
  }
  return (
    <div className={c.container}>
      {path.map((pointVal, pointIndex) =>
        <PathPointEditorRow
          isHovered={(hoveredControl && hoveredControl.pointIndex === pointIndex ? true : false)}
          isSelected={selectedDict[pointIndex]}
          key={pointIndex}
          pointIndex={pointIndex}
          point={pointVal}
          handlePointValueChanged={handlePointValueChanged}
        />
      )}
    </div>

  )
}

function PathPointEditorRow(props: {
  point: PathPointValue,
  pointIndex: number,
  handlePointValueChanged(pointIndex: number, valueIndex: number, newValue: number): void,
  isHovered: boolean,
  isSelected: boolean
}) {
  const [type, ...values] = props.point
  function handleChildValueChanged(valueIndex: number, newValue: number) {
    props.handlePointValueChanged(props.pointIndex, valueIndex, newValue)
  }
  return (
    <div
      className={classNames(
        c.pointContainer,
        props.isHovered && c.hovered,
        props.isSelected && c.selected
      )}>
      <div className={c.typeText}>
        {type}
      </div>
      {values.map((value, valueIndex) => (
        <ValueInput
          valueIndex={valueIndex + 1}
          value={value as number}
          key={`${props.pointIndex}${valueIndex + 1}`}
          handleValueChanged={handleChildValueChanged}
        />
      ))}
    </div>
  )
}

function ValueInput(props: {
  value: number,
  valueIndex: number,
  handleValueChanged(valueIndex: number, newValue: number): void
}) {
  function handleInputValueChanged(e: any) {
    let newValue = e.target.value
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    console.log('handleInputValueChanged', newValue)
    props.handleValueChanged(props.valueIndex, newValue)
  }
  return (
    <input
      onChange={handleInputValueChanged}
      className={c.numberInput}
      type="number"
      value={props.value}
    />
  )
}

export {
  PathCommandsContainer
}
import React, { MouseEventHandler, ReactEventHandler } from 'react'
import { CustomFabricObject } from '../../../../Types/CustomFabricTypes'
import { Input, InputRef } from 'antd';

interface Props {
  liveObject: CustomFabricObject,
  triggerSelect: Function,
  isEditable: boolean
}
class UserSetNameInput extends React.Component<Props, {}> {
  inputRef: InputRef | null

  constructor(props: Props) {
    super(props)
    this.inputRef = null
  }
  state = {
    editingMode: false
  }

  handleClick = (e: any) => {
    if (e.detail < 2) {
      this.props.triggerSelect(e)
    } else {
      if (this.props.isEditable) {
        return this.setState({ editingMode: true }, () => {
          this.inputRef?.select()
        })
      }
    }
  }

  onPressEnter = (e: any) => {
    this.inputRef?.blur()
    this.props.liveObject.canvas?.requestRenderAll()
  }

  onBlur = (e: any) => {
    return this.setState({ editingMode: false })
  }

  handleNameChange = (e: any) => {
    this.props.liveObject
      .set({ userSetName: e.target.value })
  }

  render() {
    const { liveObject, isEditable } = this.props
    const { editingMode } = this.state
    const useDefaultValue = liveObject?.text ?? liveObject?.userSetName ?? liveObject.type

    return (
      <div onClick={this.handleClick} style={{
        userSelect: editingMode ? 'auto' : 'none',
        flexGrow: 1
      }}>
        {
          isEditable
            ? <Input
              defaultValue={useDefaultValue}
              onPressEnter={this.onPressEnter}
              onBlur={this.onBlur}
              onChange={this.handleNameChange}
              ref={c => this.inputRef = c}
              style={{
                padding: '0px 4px',
                border: 0,
                pointerEvents: editingMode ? 'auto' : 'none',
                backgroundColor: editingMode ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                width: '100%'
              }}
            />
            : <Input
              value={useDefaultValue}
              ref={c => this.inputRef = c}
              style={{
                padding: '0px 4px',
                border: 0,
                pointerEvents: editingMode ? 'auto' : 'none',
                backgroundColor: editingMode ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                width: '100%'
              }}
            />
        }
      </div>
    )
  }
}

export {
  UserSetNameInput
}
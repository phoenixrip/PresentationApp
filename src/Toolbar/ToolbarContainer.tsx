import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

import { faImage, faRectangleAd, faSquare } from "@fortawesome/free-solid-svg-icons"
import { Button, ButtonProps } from "antd"

import { useContext } from "react"
import { editorContext } from "../Editor"
import { UseFaIcon } from "../Utils/UseFaIcon"
import c from './ToolbarContainer.module.css'

const ToolbarContainer = () => {
  const context = useContext(editorContext)

  return (
    <div className={c.toolbarContainer}>
      <Button onClick={(e) => context.handleUndo()}>UNDO</Button>
      <Button onClick={(e) => context.handleRedo()}>REDO</Button>
      <Button onClick={e => context.addText()}>Add text</Button>
      <Button onClick={e => context.addSVG()}>Add svg</Button>
      <Button onClick={e => context.addLabel()}>addLabel</Button>
      <CustomIconButton
        icon={faSquare}
        onClick={e => context.addRect()}>
        Add Rect
      </CustomIconButton>
      <CustomIconButton
        icon={faImage}
        onClick={e => context.addImageFromPicker()}>
        Add image
      </CustomIconButton>
      <Button type={'primary'} onClick={e => context.handleOpenProjectPreview()}>handleOpenProjectPreview</Button>
    </div>
  )
}

interface ICustomIconButtonProps extends ButtonProps {
  icon: IconDefinition | IconDefinition[]
}
const CustomIconButton = (props: ICustomIconButtonProps) => {
  if (Array.isArray(props.icon)) {
    return (
      <Button
        {...props}
        tabIndex={-1}
        icon={<span>
          {props.icon.map(icon => <UseFaIcon icon={icon} />)}
        </span>}>
        {props.children}
      </Button>
    )
  } else {
    return (
      <Button
        {...props}
        tabIndex={-1}
        icon={<span style={{ marginRight: 6 }}><UseFaIcon icon={props.icon} /> </span>}>
        {props.children}
      </Button>
    )
  }
}

export {
  ToolbarContainer
}
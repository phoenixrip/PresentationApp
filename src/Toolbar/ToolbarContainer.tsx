import { Button } from "antd"
import { useContext } from "react"
import { editorContext } from "../Editor"


const ToolbarContainer = () => {
  const context = useContext(editorContext)

  return (
    <div style={{ height: "100%", backgroundColor: "#29252F" }}>
      <Button onClick={(e) => context.handleUndo()}>UNDO</Button>
      <Button onClick={(e) => context.handleRedo()}>REDO</Button>
      <Button onClick={e => context.addText()}>Add text</Button>
      <Button onClick={e => context.addSVG()}>Add svg</Button>
      <Button onClick={e => context.addLabel()}>addLabel</Button>
      <Button onClick={e => context.addRect()}>addRect</Button>
      <Button onClick={e => context.addImageFromURL()}>addImageFromURL</Button>
      <Button type={'primary'} onClick={e => context.handleOpenProjectPreview()}>handleOpenProjectPreview</Button>
    </div>
  )
}

export {
  ToolbarContainer
}
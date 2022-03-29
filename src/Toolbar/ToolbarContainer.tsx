import { Button } from "antd"
import { useContext } from "react"
import { editorContext } from "../Editor"


const ToolbarContainer = () => {
  const context = useContext(editorContext)

  return (
    <div style={{ height: "100%", backgroundColor: "#29252F" }}>
      <Button onClick={(e) => context.handleUndo()}>UNDO</Button>
      <Button onClick={(e) => context.handleRedo()}>REDO</Button>
    </div>
  )
}

export {
  ToolbarContainer
}
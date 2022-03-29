import { Button } from "antd"
import { useContext } from "react"
import { editorContext } from "../Editor"


const ToolbarContainer = () => {
  const context = useContext(editorContext)

  return (
    <div style={{ height: "100%", backgroundColor: "#29252F" }}>
      <Button onClick={(e) => context.handleUndo()}>UNDO</Button>
    </div>
  )
}

export {
  ToolbarContainer
}
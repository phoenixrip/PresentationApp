import { useContext } from "react";
import { globalContext, globalContextType } from "../Editor";
import c from './ScenesPane.module.css'

const ScenesPane = (props: Object) => {
  const context: globalContextType = useContext(globalContext)
  const currentScreenIndex = context.state.editorState.activeSceneIndex
  return (
    <div className={c.container}>
      {
        context.state.project.scenes.map(
          (sceneObject: any, sceneIndex: number) => {
            const isCurrent = currentScreenIndex === sceneIndex
            return (
              <div
                key={`ScenePill${sceneIndex}`}
                onClick={() => { context.setActiveSceneIndex(sceneIndex)}}
                className={`${c.scenePill} ${isCurrent ? c.current : c.idle}`}>
                <div className={c.sceneTitleContainer}>
                  Scene {sceneIndex + 1}
                </div>
              </div>
            )
          }
        )
      }
    </div>
  )
}
export { ScenesPane }

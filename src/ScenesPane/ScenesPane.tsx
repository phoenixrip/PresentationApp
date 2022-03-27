import { Button } from "antd";
import { useContext } from "react";
import { editorContext } from "../Editor";
import { UseFaIcon } from "../Utils/UseFaIcon";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import c from './ScenesPane.module.css'

const ScenesPane = (props: Object) => {
  const context = useContext(editorContext)
  const currentScreenIndex = context.state.activeSceneIndex
  return (
    <div className={c.container}>
      {
        context.state.project.scenes.map(
          (sceneObject: any, sceneIndex: number) => {
            const isCurrent = currentScreenIndex === sceneIndex
            return (
              <div
                key={`ScenePill${sceneIndex}`}
                onClick={() => { context.setActiveSceneIndex(sceneIndex) }}
                className={`${c.scenePill} ${isCurrent ? c.current : c.idle}`}>
                <div className={c.sceneTitleContainer}>
                  Scene {sceneIndex + 1}
                </div>
              </div>
            )
          }
        )
      }
      <div className={c.addNewControlsContainer}>
        <Button
          size={context.state.antdSize}
          icon={<UseFaIcon icon={faPlus} />}
          type='primary'>
          Add next scene
        </Button>
      </div>
    </div>
  )
}
export { ScenesPane }

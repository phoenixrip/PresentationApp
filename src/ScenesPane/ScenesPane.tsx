import { Button } from "antd";
import { useContext } from "react";
import { editorContext } from "../Editor";
import { UseFaIcon } from "../Utils/UseFaIcon";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import c from './ScenesPane.module.css'
import { ProjectController } from "../ProjectController";

interface Props {
  handleDuplicateScene: ProjectController['handleDuplicateScene']
}
const ScenesPane = (props: Props) => {
  const context = useContext(editorContext)
  const currentScreenIndex = context.activeSceneIndexs[0]
  return (
    <div className={c.container}>
      {
        context.project.scenes.map(
          (sceneObject: any, sceneIndex: number) => {
            const isCurrent = currentScreenIndex === sceneIndex
            return (
              <div key={`ScenePill${sceneIndex}`}>
                <div
                  onClick={() => { context.setActiveSceneIndex(sceneIndex) }}
                  className={`${c.scenePill} ${isCurrent ? c.current : c.idle}`}>
                  <div className={c.sceneTitleContainer}>
                    Scene {sceneIndex + 1}
                  </div>
                </div>
                {isCurrent &&
                  <div className={c.addNewControlsContainer}>
                    <Button
                      onClick={props.handleDuplicateScene}
                      size={context.state.antdSize}
                      icon={<UseFaIcon icon={faPlus} />}
                      type='primary'>
                      Add next scene
                    </Button>
                  </div>
                }
              </div>
            )
          }
        )
      }
    </div>
  )
}
export { ScenesPane }

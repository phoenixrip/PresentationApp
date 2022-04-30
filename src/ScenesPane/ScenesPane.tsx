import { Button, Dropdown } from "antd";
import { useContext } from "react";
import { editorContext } from "../Editor";
import { UseFaIcon } from "../Utils/UseFaIcon";
import { faBars, faCopy, faDeleteLeft, faHamburger, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import c from './ScenesPane.module.css'
import { ProjectController } from "../ProjectController";
import { Menu } from 'antd'
interface Props {
  handleDuplicateScene: ProjectController['handleDuplicateScene'],
  handleDeleteScene: ProjectController['handleDeleteScene']
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
                  className={`${c.scenePill} ${isCurrent ? c.current : c.idle}`}>
                  <div className={c.sceneTitleContainer} onClick={() => { context.setActiveSceneIndex(sceneIndex) }}>
                    Scene {sceneIndex + 1}
                  </div>
                  <div className={c.menuContainer}>
                    <Dropdown
                      trigger={['click']}
                      overlay={
                        <Menu>
                          <Menu.Item key='Duplicate above'
                            icon={<UseFaIcon icon={faCopy} />}
                            onClick={(e) => props.handleDuplicateScene('above')}
                          >Duplicate above</Menu.Item>
                          <Menu.Item key='Duplicate below'
                            icon={<UseFaIcon icon={faCopy} />}
                            onClick={(e) => props.handleDuplicateScene('below')}
                          >Duplicate below</Menu.Item>
                          <Menu.Item key='Delete'
                            icon={<UseFaIcon icon={faTrash} />}
                            onClick={(e) => props.handleDeleteScene()}
                          >Delete scene</Menu.Item>
                        </Menu>
                      }>
                      <UseFaIcon icon={faBars} />
                    </Dropdown>
                  </div>
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

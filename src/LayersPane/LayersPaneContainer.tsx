import { Collapse } from 'antd'
import { fabric } from 'fabric'
import { useContext } from 'react'
import { editorContext } from '../EditorContext'
import { CustomFabricObject } from '../Types/CustomFabricTypes'
import { UseFaIcon } from '../Utils/UseFaIcon'
import { faEye, faLock, faVectorSquare } from '@fortawesome/free-solid-svg-icons'
import c from './LayersPaneContainer.module.css'
import { SortableTree } from './Tree/SortableTree'
import { buildTree } from './Tree/utilities'
import { FlattenedItem, TreeItems } from './Tree/types'

interface ObjIconTypes {
  [key: string]: any
}
const objIcons: ObjIconTypes = {
  'rect': faVectorSquare
}
/* const LayersPaneContainer: React.FC = () => {
  const context = useContext(editorContext)
  const currentSelection = context.fabricCanvas?.getActiveObject() as CustomFabricObject | fabric.ActiveSelection
  let activeSelectionGUIDsArray: Array<String> = []
  if (currentSelection && currentSelection instanceof fabric.ActiveSelection) {
    const selectedObjects = currentSelection.getObjects() as Array<CustomFabricObject>
    selectedObjects.forEach(obj => activeSelectionGUIDsArray.push(obj.uniqueGlobalId))
  } else if (currentSelection) {
    activeSelectionGUIDsArray.push(currentSelection.uniqueGlobalId)
  }
  // TODO: Figure out how to avoid this check
  const fabricHasObjects = context?.fabricCanvas?._objects?.length
  return (
    <div className={c.container}>
      <div className={c.liveObjectsTreeViewContainer}>
        {
          fabricHasObjects &&
          (context.fabricCanvas?.getObjects() as Array<CustomFabricObject>)
            .map((obj, objectLayoutIndex) => (
              <div key={objectLayoutIndex} className={`${c.objectPillContainer} ${(activeSelectionGUIDsArray.includes(obj.uniqueGlobalId)) ? c.active : c.idle}`}>
                <div className={c.left}>
                  <div className={c.objectIcon}>
                    <UseFaIcon icon={objIcons[obj?.type || 'default']} />
                  </div>
                  <div className={c.objectName}>
                    {obj.userSetName}
                  </div>
                </div>
                <div className={c.right}>
                  <div className={c.objectControls}>
                    <div className={c.controlIcon}>
                      <UseFaIcon icon={faLock} />
                    </div>
                    <div className={c.controlIcon}>
                      <UseFaIcon icon={faEye} />
                    </div>
                  </div>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
} */

const LayersPaneContainer: React.FC = () => {
  const context = useContext(editorContext)
  const flatTreeableData = (context.fabricCanvas?.getObjects() || []) as Array<CustomFabricObject>
  const treeData: Array<FlattenedItem> = flatTreeableData
    .map((obj, i) => ({
      id: obj.uniqueGlobalId,
      children: [],
      collapsed: false,
      parentId: obj?.parentGUID || null,
      depth: i,
      index: i,
      objType: obj.type
    }))
  const tree = buildTree(treeData)
  return (
    <div className={c.container}>
      <SortableTree
        collapsible
        defaultItems={tree}
        // indicator
        removable
        indentationWidth={20}
      />
    </div>
  )
}

export {
  LayersPaneContainer
}
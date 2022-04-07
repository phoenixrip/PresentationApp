// @ts-nocheck
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
    selectedObjects.forEach(obj => activeSelectionGUIDsArray.push(obj.guid))
  } else if (currentSelection) {
    activeSelectionGUIDsArray.push(currentSelection.guid)
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
              <div key={objectLayoutIndex} className={`${c.objectPillContainer} ${(activeSelectionGUIDsArray.includes(obj.guid)) ? c.active : c.idle}`}>
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

  function handleOnDragEnd({ newSorted, newNested, newFlatTree }) {
    context.fabricCanvas.handleRecieveNewFlatOrder(newFlatTree)
    context.fabricCanvas?.requestRenderAll()
    console.log('handleOnDragEnd', { newSorted, newNested, newFlatTree })
  }
  const flatTreeableData = (context.fabricCanvas?.getObjects() || []) as Array<CustomFabricObject>
  const treeData = flatTreeableData
    .map((obj, i) => ({
      id: obj.guid,
      guid: obj.guid,
      parentID: obj.parentID,
      structurePath: obj.structurePath,
      type: obj.type,
      depth: obj.depth,
      treeIndex: obj.treeIndex,
      topLevelIndex: obj.topLevelIndex,
      collapsed: obj?.collapsed || false
    }))
  const tree = buildTree(treeData)
  return (
    <div className={c.container}>
      <SortableTree
        collapsible
        handleOnDragEnd={handleOnDragEnd}
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
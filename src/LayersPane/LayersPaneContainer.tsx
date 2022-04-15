// @ts-nocheck
import { useContext } from 'react'
import { editorContext } from '../EditorContext'
import { CustomFabricObject } from '../Types/CustomFabricTypes'
import c from './LayersPaneContainer.module.css'
import { SortableTree } from './Tree/SortableTree'
import { buildTree } from './Tree/utilities'

const LayersPaneContainer: React.FC = () => {
  const context = useContext(editorContext)

  function handleOnDragEnd({ newSorted, newNested, newFlatTree }) {
    console.log('handleOnDragEnd', { newSorted, newNested, newFlatTree })
    context.fabricCanvas.handleRecieveNewFlatOrder(newFlatTree)
    context.fabricCanvas?.logFlatVisual()
    context.fabricCanvas?.requestRenderAll()
  }
  const flatTreeableData = (context.fabricCanvas?.getObjects() || []) as Array<CustomFabricObject>
  const tree = buildTree(flatTreeableData)

  return (
    <div className={c.container}>
      <SortableTree
        collapsible
        handleOnDragEnd={handleOnDragEnd}
        defaultItems={tree}
        removable
        indentationWidth={20}
      />
    </div>
  )
}

export {
  LayersPaneContainer
}
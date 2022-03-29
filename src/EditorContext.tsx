import { SizeType } from 'antd/lib/config-provider/SizeContext'
import React from 'react'
import { ProjectDataTypes } from './Types/ProjectDataTypes'

interface EditorStateTypes {
  tick: Boolean;
  isInitted: Boolean;
  project: ProjectDataTypes;
  activeSceneIndex: number;
  antdSize: SizeType;
  gridCoords: {
    width: number,
    height: number,
    top: number,
    left: number
  }
}

interface EditorContextTypes {
  fabricCanvas: fabric.Canvas | null;
  state: EditorStateTypes;
  handleAddRect: Function;
  setOnFabricObject: Function;
  setOnGlobalObject: Function;
  setActiveSceneIndex: Function;
  handleGroupObjects: Function;
  handleUndo: Function
}

const editorContext = React.createContext<EditorContextTypes>(
  ({} as EditorContextTypes)
)

export { editorContext }
export type { EditorContextTypes, EditorStateTypes }
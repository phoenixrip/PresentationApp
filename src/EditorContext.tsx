import { SizeType } from 'antd/lib/config-provider/SizeContext'
import React from 'react'
import { CustomFabricObject } from './Types/CustomFabricTypes'
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
  },
  selectedGUIDsDict: {
    [key: string]: boolean
  }
}

interface EditorContextTypes {
  fabricCanvas: fabric.Canvas | null;
  state: EditorStateTypes;
  setOnFabricObject: Function;
  setOnGlobalObject: Function;
  setActiveSceneIndex: Function;
  handleGroupObjects: Function;
  handleUndo: Function,
  handleRedo: Function,
  handleSelectElementByGUID: Function,
  addText: Function,
  addSVG: Function,
  liveObjectsDict: {
    [key: string]: CustomFabricObject
  }
}

const editorContext = React.createContext<EditorContextTypes>(
  ({} as EditorContextTypes)
)

export { editorContext }
export type { EditorContextTypes, EditorStateTypes }
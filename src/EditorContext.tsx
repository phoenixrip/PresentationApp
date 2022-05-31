import { SizeType } from 'antd/lib/config-provider/SizeContext'
import React from 'react'
import { Editor } from './Editor'
import { ProjectController } from './ProjectController'
import { CustomFabricObject } from './Types/CustomFabricTypes'
import { ProjectDataTypes } from './Types/ProjectDataTypes'
import { CustomFabricCanvas } from './Utils/CustomFabricCanvas'

interface EditorStateTypes {
  tick: Boolean;
  isInitted: Boolean;
  // project: ProjectDataTypes;
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
  fabricCanvas: CustomFabricCanvas | null;
  state: EditorStateTypes;
  availableFonts: Array<String>,
  loadedFonts: Array<String>,
  project: ProjectDataTypes;
  activeSceneIndexs: Array<number>;
  setOnFabricObject: Function;
  setOnGlobalObject: Function;
  setActiveSceneIndex: Function;
  handleGroupObjects: Function;
  handleUndo: Function,
  handleRedo: Function,
  handleSelectElementByGUID: Editor['handleSelectElementByGUID'],
  addText: Function,
  addSVG: Function,
  addRect: Editor['addRect'],
  addRoundedRect: Editor['addRoundedRect'],
  addImageFromPicker: Editor['addImageFromPicker'],
  handleInitCustomInteractionComponent: Editor['handleInitCustomInteractionComponent'],
  addLabel: Function,
  handleOpenProjectPreview: ProjectController['handleOpenProjectPreview'],
  liveObjectsDict: {
    [key: string]: CustomFabricObject
  },
  liveObjectScenesReferences: {
    [key: CustomFabricObject['guid']]: Set<number>
  }
}

const editorContext = React.createContext<EditorContextTypes>(
  ({} as EditorContextTypes)
)

export { editorContext }
export type { EditorContextTypes, EditorStateTypes }
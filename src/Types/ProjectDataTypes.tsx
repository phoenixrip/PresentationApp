import { CustomFabricObject } from "./CustomFabricTypes";

interface ProjectDataTypes {
  settings: ProjectSettingsTypes,
  globalObjects: { [key: string]: Object },
  scenes: Array<SceneType>
}

interface ProjectSettingsTypes {
  dimensions: {
    width: number,
    height: number
  }
}

interface SceneType {
  activeSceneObjects: { [key: string]: Object },
  sceneSettings: {},
  animationSettings?: {}
  // undoHistory: Array<{ [key: string]: fabric.IObjectOptions }>,
  undoHistory: Array<UndoHistoryEntry>,
  redoHistory: Array<UndoHistoryEntry>
}

interface UndoHistoryEntry {
  selectedGUIDs: Array<string>,
  objectStates: { [key: string]: CustomFabricObject },
}

export type {
  SceneType,
  ProjectDataTypes,
  UndoHistoryEntry
}
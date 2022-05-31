import { CustomFabricObject, CustomFabricOptions } from "./CustomFabricTypes";

interface ProjectDataTypes {
  settings: ProjectSettingsTypes,
  globalObjects: { [key: CustomFabricObject['guid']]: Partial<CustomFabricOptions> },
  scenes: Array<SceneType>
}

interface ProjectSettingsTypes {
  dimensions: {
    width: number,
    height: number
  }
}

interface SceneType {
  activeSceneObjects: { [key: CustomFabricObject['guid']]: Partial<CustomFabricOptions> },
  sceneSettings: {},
  animationSettings?: {}
  // undoHistory: Array<{ [key: string]: fabric.IObjectOptions }>,
  undoHistory: Array<UndoHistoryEntry>,
  redoHistory: Array<UndoHistoryEntry>
}

interface UndoHistoryEntry {
  selectedGUIDs: Array<CustomFabricObject['guid']>,
  objectStates: { [key: CustomFabricObject['guid']]: CustomFabricOptions },
}

export type {
  SceneType,
  ProjectDataTypes,
  UndoHistoryEntry
}
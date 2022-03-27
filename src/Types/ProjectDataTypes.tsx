interface ProjectDataTypes {
  settings: ProjectSettingsTypes,
  globalObjects: Object,
  scenes: Array<SceneType>
}

interface ProjectSettingsTypes {
  dimensions: {
    width: number,
    height: number
  }
}

interface SceneType {
  activeSceneObjects: { [key: string]: fabric.IObjectOptions },
  sceneSettings: {},
  animationSettings?: {}
  undoHistory: fabric.IObjectOptions[],
  redoHistory: fabric.IObjectOptions[]
}

export type {
  SceneType,
  ProjectDataTypes,
}
interface ProjectDataTypes {
  settings: ProjectSettingsTypes,
  globalObjects: {[key: string]: Object},
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
  undoHistory: Array<{ [key: string]: fabric.IObjectOptions }>,
  redoHistory: Array<{ [key: string]: fabric.IObjectOptions }>
}

export type {
  SceneType,
  ProjectDataTypes,
}
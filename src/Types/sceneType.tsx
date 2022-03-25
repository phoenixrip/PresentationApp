interface SceneType {
    activeSceneObjects: { [key: string]: fabric.IObjectOptions},
    sceneSettings: {},
    animationSettings?: {}
    undoHistory: fabric.IObjectOptions[],
    redoHistory: fabric.IObjectOptions[]
}

export type { SceneType }
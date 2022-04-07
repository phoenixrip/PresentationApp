import { Modal } from "antd";
import React, { Component, ReactNode } from "react";
import { Editor } from './Editor'
import { CustomFabricObject, CustomFabricOptions } from "./Types/CustomFabricTypes";
import { ProjectDataTypes, SceneType } from "./Types/ProjectDataTypes";
import { v4 as uuidv4 } from 'uuid';
import { customAttributesToIncludeInFabricCanvasToObject } from "./Utils/consts";
import { flatMapFabricSceneState } from "./Utils/flatMapFabricState";
import { RenderEngine } from "./RenderEngine/RenderEngine";
import { fabric } from 'fabric'

interface Props {
  project: ProjectDataTypes
}
interface State {
  projectAssetsLoaded: boolean,
  project: ProjectDataTypes,
  activeSceneIndexs: Array<number>,
  projectPreviewOpen: boolean
}
export type { State as IProjectControllerState }

class ProjectController extends Component<Props, State> {
  liveEditor?: Editor | null
  liveObjectScenesReferences: {
    [key: CustomFabricObject['guid']]: Set<number>
  }
  liveObjectsDict: {
    [key: CustomFabricObject['guid']]: CustomFabricObject
  }
  constructor(props: Props) {
    super(props);
    this.liveEditor = null
    this.liveObjectScenesReferences = {}
    this.liveObjectsDict = {}
    this.initObjectScenesReferences()
    this.state = {
      projectAssetsLoaded: true,
      project: this.props.project,
      activeSceneIndexs: [0],
      projectPreviewOpen: false
    }
  }

  get activeSceneIndex() {
    if (this.state.activeSceneIndexs.length !== 1) return null
    return this.state.activeSceneIndexs[0]
  }

  initObjectScenesReferences = () => {
    this.props.project.scenes.forEach((currSceneObject, currSceneIndex) => {
      Object.keys(currSceneObject.activeSceneObjects)
        .forEach(guid => {
          this.liveObjectScenesReferences[guid] = this.liveObjectScenesReferences[guid] ?? new Set()
          this.liveObjectScenesReferences[guid].add(currSceneIndex)
        })
    })
    console.log(this.props.project.scenes)
  }

  handleFabricMountConfirmed = async () => {
    console.log('handleFabricMountConfirmed')
    if (!this.liveEditor || !this.liveEditor?.fabricCanvas) return null
    // Load all the project global objects into the fabricCanvas
    const json: any = {
      objects: Object.values(this.state.project.globalObjects),
    }
    this.liveEditor.fabricCanvas.loadFromJSON(
      json,
      () => {
        this.liveEditor?.fabricCanvas?.updatePaths()
        this.liveEditor?.fabricCanvas?.logFlatVisual()
        this.handleSetNewActiveScene(0, false)
      },
      (options: any, object: any, a: any) => {
        this.liveObjectsDict[options.guid] = object;
      }
    )
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (document.activeElement !== document.body) {
      console.log('not firing editor key down listeners')
      return
    }
    e.preventDefault()
    e.stopPropagation()
    console.log(document.activeElement)
    // TODO: Some library that handles multiples for us
    console.log(`Key pressed: ${e.key}`)
    switch (e.key) {
      case 'Backspace':
        return this.handleRequestDeleteObject(e)
      default:
        return null
    }
  }

  setActiveSceneIndex = (sceneIndex: number) => this.handleSetNewActiveScene(sceneIndex)

  handleSetNewActiveScene = (newActiveSceneIndex: number, saveExisting = true) => {
    let leavingSceneObject: SceneType | null = null
    if (saveExisting) {
      leavingSceneObject = this.getSaveableCurrentSceneState()
    }

    const newActiveSceneObject = this.state.project.scenes[newActiveSceneIndex]

    // This restores the state of the newly set activeScene
    // Let's do this by iterating over the liveObjectsDict
    Object.entries(this.liveObjectsDict)
      .forEach(([guid, obj]) => {
        const object = obj as CustomFabricObject
        const isObjectInNewScene = (newActiveSceneObject.activeSceneObjects?.[guid] as Partial<CustomFabricOptions> | undefined)
        const isObjectInCanvasMemory = object?.canvas

        // Update the in memory objects array to contain only objs
        // that are actually in this scene
        if (!isObjectInNewScene && isObjectInCanvasMemory) {
          this?.liveEditor?.fabricCanvas?.remove(obj)
        } else if (isObjectInNewScene && !isObjectInCanvasMemory) {
          this?.liveEditor?.fabricCanvas?.add(obj)
        }

        // Now for any obects that are in this scene
        // apply their new positions
        // Here we need to make sure that we aren't resetting values
        // that will become invalid
        if (isObjectInNewScene) {
          // const globalObjectOptions = this.state.project.globalObjects[guid]
          object
            .set({ scaleX: 1, scaleY: 1 })
            // .set(globalObjectOptions)
            .set(isObjectInNewScene)
            .setCoords()
          object.parentID = (isObjectInNewScene as CustomFabricOptions)?.parentID || undefined
        }
      })

    // Now run all the updates
    this.liveEditor?.fabricCanvas?.handleReorderObjectArrayToObjectTreeIndexOrder()
    this.liveEditor?.fabricCanvas?.requestRenderAll()

    let stateUpdateObject = {
      activeSceneIndexs: [newActiveSceneIndex],
    } as State
    if (leavingSceneObject !== null) {
      const currentScenesArray: Array<SceneType> = this.state.project.scenes
      const newScenesArray: Array<SceneType> = currentScenesArray.map((currSceneObj, currSceneIndex) => {
        if (currSceneIndex !== this.activeSceneIndex) return currSceneObj
        return leavingSceneObject!
      })

      stateUpdateObject.project = {
        ...this.state.project,
        scenes: newScenesArray
      }
    }

    return this.setState(stateUpdateObject)
  }

  handleGroupObjects = () => {
    if (!this.liveEditor || !this.liveEditor?.fabricCanvas) return
    const orderedSelectedGUIDs = Array.from(this.liveEditor.orderedSelectionGUIDs)
    const orderedSelectedIndexs = orderedSelectedGUIDs.map(guid => this.liveObjectsDict[guid].treeIndex)
    this.liveEditor.fabricCanvas
      .groupSelectedByObjectIndexes(orderedSelectedIndexs, this.activeSceneIndex)
      .requestRenderAll()
    this.liveEditor.fabricCanvas.logFlatVisual()
  }

  handleRequestDeleteObject = (e: KeyboardEvent) => {
    const confirm = Modal.confirm({
      content: 'Are you sure you wish to delete this item?',
      onOk: this.handleConfirmedDeleteObject
    })
  }

  handleConfirmedDeleteObject = () => {
    if (!this.liveEditor) return
    if (this.activeSceneIndex === null) return
    console.log('handleConfirmedDeleteObject')
    // Check if this is the only appearance of the object
    const activeGUIDsArray = Array.from(this.liveEditor.orderedSelectionGUIDs)
    console.log({ activeGUIDsArray })
    activeGUIDsArray.forEach(guid => {
      const liveObject = this.liveEditor!.liveObjectsDict[guid]
      console.log(`check delete mode for ${guid}`, liveObject)
      const objectSceneRefsArray = Array.from(this.liveObjectScenesReferences[guid] || [])
      const sortedSceneRefs = objectSceneRefsArray.sort((a, b) => (a - b))

      const appearsOnlyInThisScene = (objectSceneRefsArray.length === 1 && objectSceneRefsArray[0] === this.activeSceneIndex)
      const appearsBeforeThisScene = (!appearsOnlyInThisScene) && sortedSceneRefs[0] < this.activeSceneIndex!
      const appearsAfterThisScene = (!appearsOnlyInThisScene) && sortedSceneRefs[sortedSceneRefs.length - 1] > this.activeSceneIndex!

      if (appearsOnlyInThisScene) {
        console.log('appearsOnlyInThisScene')
        // Complete delete
        // Todo: handle undo-able delete
        this.liveEditor?.fabricCanvas?.discardActiveObject()
        this.liveEditor?.fabricCanvas?.remove(liveObject)
        this.liveEditor?.fabricCanvas?.updatePaths()
        this.liveEditor?.fabricCanvas?.renderAll()
        return this.setState({}, () => {
          delete this.liveObjectsDict[guid]
          delete this.liveObjectScenesReferences[guid]
        })
      }
      // TODO: HANDLE DELETE OF OBJECTS THAT EXIST ON OTHER SCREENS
      console.log(`CAN't Delete`, {
        objectSceneRefsArray,
        sortedSceneRefs,
        appearsOnlyInThisScene,
        appearsBeforeThisScene,
        appearsAfterThisScene
      })
      // If it is the only appearanvce of this object
      //    Delete the object from the scene and remove from the inMemory canvas? what about undos?
      // if () {
      //   console.log('ONE AND ONLY SCENE APPEARANCE')
      // } else if (sortedSceneRefs[0] < ) {

      // }
    })
    // If it isn't and the appearance is later than the current scene
    //    Remove the object from the current scene and update its firstOccurrenceIndex to the new firstOccurrent
    // If it isn't the only appearance and the other appearances are earlier than this current scene
    //    Set this scene index as the objects REMOVAL INDEX so we can animate it out on transition to this screen?

    console.log('DELETE OBJECTS')
  }

  handleAddObject = (
    objectToAdd: CustomFabricObject | fabric.Object,
    parentID: CustomFabricObject['parentID'] | undefined = undefined,
    userSetName: string | null = null
  ) => {
    /*
      Todo: handle adding when not the last scene by
      asking the user if this is a one scene 'in out' obejct,
      or if the object should appear in every scene until they delete it
      Currenttly we're just adding it to the current scene i think
    */
    const useAsCustom = (objectToAdd as CustomFabricObject)
    const { activeSceneIndexs } = this.state
    if (this.activeSceneIndex === null) return Modal.warn({ content: 'No active scene index to add to' })
    console.log('handle add single object to current scene')

    const newGUID = uuidv4()
    // Apply custom settings to object
    // const useAsCustomObject = objectToAdd as CustomFabricObject
    const useUserSetName = useAsCustom?.userSetName ?? userSetName ?? useAsCustom.type
    const useParentID = useAsCustom?.parentID ?? parentID
    useAsCustom.set({
      guid: newGUID,
      parentID: useParentID,
      userSetName: useUserSetName
    })
    // Add the object to the liveDict
    this.liveObjectsDict[newGUID] = useAsCustom
    // Create a scenesReferenceSet for this object and add the current scene
    this.liveObjectScenesReferences[newGUID] = this.liveObjectScenesReferences[newGUID] ?? new Set()
    this.liveObjectScenesReferences[newGUID].add(this.activeSceneIndex)
    // Add the object to the canvas
    this.liveEditor?.fabricCanvas?.add(useAsCustom)
    this.liveEditor?.fabricCanvas?.updatePaths()
    this.liveEditor?.fabricCanvas?.setActiveObject(useAsCustom)
    this.liveEditor?.fabricCanvas?.requestRenderAll()
  }

  handleDuplicateScene = () => {
    console.log('handleDuplicateScene')
    if (this.activeSceneIndex === null) return Modal.warn({ content: 'No active scene to duplicate' })
    // We need to update our objectscrenerefs if the objects are present in the duplicated scene
    const newActiveSceneObject = this.getSaveableCurrentSceneState()
    if (!newActiveSceneObject) return

    // Update each objects sceneRefs
    Object.keys(newActiveSceneObject.activeSceneObjects)
      .forEach(guid => {
        this.liveObjectScenesReferences[guid] = this.liveObjectScenesReferences[guid] || new Set()
        this.liveObjectScenesReferences[guid].add(this.activeSceneIndex!)
        this.liveObjectScenesReferences[guid].add(this.activeSceneIndex! + 1)
      })

    let newScenesArray: Array<SceneType> = []
    this.state.project.scenes.forEach((sceneObject, screenIndex) => {
      if (screenIndex !== this.activeSceneIndex) return newScenesArray.push(sceneObject)
      newScenesArray.push(newActiveSceneObject)
      newScenesArray.push(newActiveSceneObject)
    })
    return this.setState({
      project: {
        ...this.state.project,
        scenes: newScenesArray
      },
      activeSceneIndexs: [this.activeSceneIndex + 1]
    })
  }

  getSaveableCurrentSceneState = () => {
    if (this.activeSceneIndex === null) return null
    if (!this.liveEditor?.fabricCanvas) return null
    const currentSavedSceneState = this.state.project.scenes[this.activeSceneIndex]
    // const newFabricState = this.liveEditor.fabricCanvas.toObject(customAttributesToIncludeInFabricCanvasToObject)
    const newSavableSceneState = this.liveEditor.fabricCanvas.getSaveableSceneState()
    // const newFlatMappedState = flatMapFabricSceneState(newFabricState)
    const newSceneObject: SceneType = {
      activeSceneObjects: newSavableSceneState,
      sceneSettings: currentSavedSceneState.sceneSettings,
      undoHistory: [],
      redoHistory: []
    }
    return newSceneObject
  }

  handleGetSaveableProjectData = () => {
    // Get a saveable JSON of the project
  }

  handleOpenProjectPreview = () => {
    // update project global objects to match live objects
    let newProjectGlobalObjects: Record<CustomFabricObject['guid'], CustomFabricOptions> = {}
    Object.values(this.liveObjectsDict)
      .forEach(obj => {
        newProjectGlobalObjects[obj.guid] = obj.toObject(customAttributesToIncludeInFabricCanvasToObject)
      })

    return this.setState({
      projectPreviewOpen: true,
      project: {
        ...this.state.project,
        globalObjects: newProjectGlobalObjects
      }
    })
  }
  render(): ReactNode {
    const {
      projectAssetsLoaded,
      project,
      projectPreviewOpen
    } = this.state

    if (projectAssetsLoaded) {
      return (
        <>
          <Editor
            ref={c => this.liveEditor = c}
            project={project}
            activeSceneIndexs={this.state.activeSceneIndexs}
            handleGroupObjects={this.handleGroupObjects}
            handleFabricMountConfirmed={this.handleFabricMountConfirmed}
            handleRequestDeleteObject={this.handleRequestDeleteObject}
            liveObjectsDict={this.liveObjectsDict}
            liveObjectScenesReferences={this.liveObjectScenesReferences}
            setActiveSceneIndex={this.setActiveSceneIndex}
            handleAddObject={this.handleAddObject}
            handleDuplicateScene={this.handleDuplicateScene}
            handleOpenProjectPreview={this.handleOpenProjectPreview}
          />
          {
            <Modal
              visible={projectPreviewOpen}
              onCancel={() => this.setState({ projectPreviewOpen: false })}
              width={project.settings.dimensions.width + 48 + 40}
              destroyOnClose
            >
              <ProjectPreviewRendererContainer
                project={project}
              />
            </Modal>
          }
        </>
      )
    } else {
      return <p>Loading project data</p>;
    }
  }
}

export {
  ProjectController
}

interface IProjectPreviewRendererContainerProps {
  project: ProjectDataTypes
}

class ProjectPreviewRendererContainer extends React.Component<IProjectPreviewRendererContainerProps, {}> {
  ca1: HTMLCanvasElement | null
  ca2: HTMLCanvasElement | null
  c1: fabric.StaticCanvas | undefined
  c2: fabric.Canvas | undefined
  renderEngine: RenderEngine | undefined
  constructor(props: IProjectPreviewRendererContainerProps) {
    super(props)
    this.ca1 = null
    this.ca2 = null
  }

  componentDidMount() {
    const { project } = this.props
    if (!this.ca1 || !this.ca2) return
    this.c1 = new fabric.StaticCanvas(this.ca1)
    this.c2 = new fabric.Canvas(this.ca2)
    const both = [this.c1, this.c2]
    both.forEach(c => {
      c.setDimensions({
        width: project.settings.dimensions.width,
        height: project.settings.dimensions.height
      })
      c.renderOnAddRemove = false
    })
    this.renderEngine = new RenderEngine(this.props.project, this.c1, this.c2)
    this.renderEngine.play()
  }
  render() {
    const absolutePosition = {
      position: 'absolute', top: 0, left: 0
    } as React.CSSProperties
    return (
      <div style={{ position: 'relative', backgroundColor: 'white', margin: 20 }}>
        <div style={absolutePosition}>
          <canvas ref={canvas => this.ca1 = canvas} />
        </div>
        <div>
          <canvas ref={canvas => this.ca2 = canvas} />
        </div >
      </div >
    )
  }
}
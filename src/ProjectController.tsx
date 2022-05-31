import { Modal } from "antd";
import React, { Component, ReactNode } from "react";
import { Editor } from './Editor'
import { CustomFabricObject, CustomFabricOptions } from "./Types/CustomFabricTypes";
import { ProjectDataTypes, SceneType } from "./Types/ProjectDataTypes";
import { v4 as uuidv4 } from 'uuid';
import { customAttributesToIncludeInFabricCanvasToObject } from "./Utils/consts";
import { RenderEngine } from "./RenderEngine/RenderEngine";
import { fabric } from 'fabric'
import { greatestCommonDenominator } from "./Utils/greatestCommonDenominator";
import { RequestInsertImageEventTypes } from "./Events/RequestInsertImage";
import { MediaPickerContainer, UploadNewImageArgs } from "./MediaPicker/MediaPickerContainer";
import { ICustomMediaStorageApi, ImageStorageHandler } from "./PlugIns/ImageStorageHandler/ImageStorageHandlerClass";
import { ProjectParaStylesController } from "./Utils/CustomControllerClasses/ProjectParaStylesController";

interface Props {
  project: ProjectDataTypes,
  customMediaStorageApi: ICustomMediaStorageApi
}
interface State {
  projectAssetsLoaded: boolean,
  project: ProjectDataTypes,
  activeSceneIndexs: Array<number>,
  projectPreviewOpen: boolean,
  mediaPickerState: {
    open: boolean
  }
}

interface IAddGroupedObjectsConfig {
  addAtIndex?: number
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
  onInsertImageFunction?: Function | undefined
  storageHandlerClass: ImageStorageHandler
  projectParaStylesController: ProjectParaStylesController
  constructor(props: Props) {
    super(props);
    this.storageHandlerClass = new ImageStorageHandler(props.customMediaStorageApi)
    this.projectParaStylesController = new ProjectParaStylesController(props.project)
    this.liveEditor = null
    this.liveObjectScenesReferences = {}
    this.liveObjectsDict = {}
    this.initObjectScenesReferences()
    this.state = {
      projectAssetsLoaded: true,
      project: props.project,
      activeSceneIndexs: [0],
      projectPreviewOpen: false,
      mediaPickerState: {
        open: false
      }
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
  }

  handleFabricMountConfirmed = async () => {
    if (!this.liveEditor || !this.liveEditor?.fabricCanvas) return null
    // Load all the project global objects into the fabricCanvas
    const json: any = {
      objects: Object.values(this.state.project.globalObjects),
    }
    this.liveEditor.fabricCanvas.initProjectParaStylesController(this.projectParaStylesController)
    //@ts-ignore
    fabric.BodyTextbox.prototype.projectParaStylesController = this.projectParaStylesController
    this.liveEditor.fabricCanvas.loadFromJSON(
      json,
      () => {
        this.liveEditor?.fabricCanvas?.updatePaths()
        // this.liveEditor?.fabricCanvas?.logFlatVisual()
        this.handleSetNewActiveScene(0, false)
      },
      (options: any, object: any, a: any) => {
        this.liveObjectsDict[options.guid] = object;
      }
    )
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('requestInsertImage', (e) => this.handleStartInsertImageRequest(e as RequestInsertImageEventTypes))
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (document.activeElement !== document.body) {
      console.log('not firing editor key down listeners: ', document.activeElement)
      return
    }
    e.preventDefault()
    e.stopPropagation()
    // TODO: Some library that handles multiples for us
    console.log(`Key pressed: ${e.key}, meta: ${e.metaKey}, control: ${e.ctrlKey}`)
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        return this.handleArrowKeys(e)
      default:
        break;
    }
    if (e.metaKey) {
      // Handle apple related keyboard shortcuts
      switch (e.key) {
        case 'd':
          return this.handleDuplicateObject(e)
        default:
          return null
      }
    } else {
      switch (e.key) {
        case 'Backspace':
          return this.handleBackspace(e)
        case 'Escape':
          return this.handleEscape(e)
        default:
          return null
      }
    }
  }

  handleEscape = (e: KeyboardEvent) => {
    const fabricCanvas = this.liveEditor?.fabricCanvas
    if (!fabricCanvas) return
    const hasSelection = fabricCanvas.getActiveObject()
    if (hasSelection) {
      fabricCanvas
        .discardActiveObject()
        .requestRenderAll()
    }
  }

  handleStartInsertImageRequest = (e: RequestInsertImageEventTypes) => {
    console.log('handleStartInsertImageRequest', e)
    this.onInsertImageFunction = e.detail.onInsert
    return this.setState({
      mediaPickerState: {
        open: true
      }
    })
  }

  handleInsertImage = (insertImageObject: any) => {
    console.log('ProjectController handleInsertImage', { insertImageObject })
    return this.setState({
      mediaPickerState: { open: false }
    }, () => {
      this.onInsertImageFunction?.(insertImageObject)
      this.onInsertImageFunction = undefined
    })
  }

  handleCancelMediaPicker = () => {
    return this.setState({
      mediaPickerState: { open: false }
    }, () => {
      // this.onInsertImageFunction?.(insertImageObject)
      this.onInsertImageFunction = undefined
    })
  }

  setActiveSceneIndex = (sceneIndex: number) => this.handleSetNewActiveScene(sceneIndex)

  handleSetNewActiveScene = (newActiveSceneIndex: number, saveExisting = true) => {
    console.log('handleSetNewActiveScene', { newActiveSceneIndex, saveExisting, asi: this.activeSceneIndex })
    const fabricCanvas = this.liveEditor?.fabricCanvas
    if (!fabricCanvas) return
    if (newActiveSceneIndex === this.activeSceneIndex) {
      // We've clicked on the currently selected scene
      console.log(`// We've clicked on the currently selected scene`)
      if (fabricCanvas.getActiveObject()) {
        fabricCanvas.discardActiveObject().requestRenderAll()
        return
      } else {
        return
      }
    }
    let leavingSceneObject: SceneType | null = null
    if (saveExisting) {
      leavingSceneObject = this.getSaveableCurrentSceneState()
    }

    fabricCanvas.tempDeselect()
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
          fabricCanvas.remove(obj)
        } else if (isObjectInNewScene && !isObjectInCanvasMemory) {
          fabricCanvas.add(obj)
        }

        // Now for any obects that are in this scene
        // apply their new positions
        // Here we need to make sure that we aren't resetting values
        // that will become invalid
        if (isObjectInNewScene) {
          object
            .set({ scaleX: 1, scaleY: 1 })
            .set(isObjectInNewScene)
            .setCoords()
          object.parentID = (isObjectInNewScene as CustomFabricOptions)?.parentID || undefined
        }
      })

    // Now run all the updates
    fabricCanvas
      .handleReorderObjectArrayToObjectTreeIndexOrder()
      .tempReselect()
      .requestRenderAll()

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

  // SHOULD BE ON EDITOR PROBABLY WITH ONLY CALLS TO PROJECTCONTROLLER WHEN NEEDED
  handleGroupObjects = () => {
    if (!this.liveEditor || !this.liveEditor?.fabricCanvas) return
    const orderedSelectedGUIDs = Array.from(this.liveEditor.orderedSelectionGUIDs)
    const orderedSelectedIndexs = orderedSelectedGUIDs.map(guid => this.liveObjectsDict[guid].treeIndex)
    this.liveEditor.fabricCanvas
      .groupSelectedByObjectIndexes(orderedSelectedIndexs, this.activeSceneIndex)
      .requestRenderAll()
    this.liveEditor.fabricCanvas.logFlatVisual()
  }
  handleArrowKeys = (e: KeyboardEvent) => {
    if (!this.liveEditor || !this.liveEditor?.fabricCanvas) return
    const activeObject = this.liveEditor.fabricCanvas.getActiveObject() as CustomFabricObject | fabric.ActiveSelection | null
    if (!activeObject) return

    const shift = e.shiftKey
    const meta = e.metaKey

    if (shift && meta) {
      // move to alignment within scene canvas
      console.log('SHIFT META ARROW')
      return
    }
    if (meta) {
      console.log('META ARROW')
      // Move up or down in the scenesArray
      return
    }

    if (shift) {
      // SHIFT MOVES TO NEXT GRID ALIGNMENT
      const currentGridAspectGreatestCommonDenom = greatestCommonDenominator(this.state.project.settings.dimensions.width, this.state.project.settings.dimensions.height)
      const currentGridWidth = this.state.project.settings.dimensions.width / currentGridAspectGreatestCommonDenom
      const currentGridHeight = this.state.project.settings.dimensions.height / currentGridAspectGreatestCommonDenom
      if (e.key === 'ArrowUp') {
        const currentTop = activeObject?.top ?? 0
        const newRounded = roundXToNearestDivisbleY(currentTop, currentGridHeight, 'down')
        activeObject.set({ top: newRounded })
      }
      if (e.key === 'ArrowDown') {
        const currentTop = activeObject?.top ?? 0
        const newRounded = roundXToNearestDivisbleY(currentTop, currentGridHeight, 'up')
        activeObject.set({ top: newRounded })
      }
      if (e.key === 'ArrowLeft') {
        const currentLeft = activeObject?.left ?? 0
        const newRounded = roundXToNearestDivisbleY(currentLeft, currentGridWidth, 'down')
        activeObject.set({ left: newRounded })
      }
      if (e.key === 'ArrowRight') {
        const currentLeft = activeObject?.left ?? 0
        const newRounded = roundXToNearestDivisbleY(currentLeft, currentGridWidth, 'up')
        activeObject.set({ left: newRounded })
      }
      activeObject.setCoords()
      this.liveEditor.fabricCanvas.requestRenderAll()
      return
    }

    function roundXToNearestDivisbleY(x: number, y: number, type = 'down'): number {
      if (type === 'down') {
        x -= 1
        return Math.floor(x / y) * y
      } else if (type === 'up') {
        x += 1
        return Math.ceil(x / y) * y
      }
      return 0
    }

    // Normal arrow
    let newAttrs: Partial<CustomFabricOptions> = {}
    switch (e.key) {
      case 'ArrowUp':
        newAttrs['top'] = (activeObject?.top || 0) - 1;
        break;
      case 'ArrowDown':
        newAttrs['top'] = (activeObject?.top || 0) + 1;
        break;
      case 'ArrowLeft':
        newAttrs['left'] = (activeObject?.left || 0) - 1;
        break;
      case 'ArrowRight':
        newAttrs['left'] = (activeObject?.left || 0) + 1;
        break;
      default:
        break;
    }
    const useActiveObject = activeObject as CustomFabricObject
    useActiveObject.set(newAttrs)
    this.liveEditor.fabricCanvas.requestRenderAll()
    return
  }
  handleDuplicateObject = (e: KeyboardEvent) => {
    console.log('DUPLICATE OBJECT')
    const activeObject = this.liveEditor?.fabricCanvas?.getActiveObject() as CustomFabricObject | fabric.ActiveSelection | undefined
    if (!activeObject) return Modal.warn({ content: 'Nothing to duplicate' })
    if (activeObject instanceof fabric.ActiveSelection) {
      console.log('Duplicate active selection', { activeObject })
    } else {
      activeObject.clone((newObject: CustomFabricObject) => {
        // add it to the project?
        const liveObject = this.handleAddObject(
          newObject,
          undefined,
          null,
          activeObject.treeIndex! + 1
        )
        this.liveEditor?.fabricCanvas?.setActiveObject((liveObject as fabric.Object))
        this.liveEditor?.fabricCanvas?.requestRenderAll()
      }, customAttributesToIncludeInFabricCanvasToObject)
    }
  }
  handleBackspace = (e: KeyboardEvent) => {
    const activeObject: CustomFabricObject = (this.liveEditor?.fabricCanvas?.getActiveObject() as CustomFabricObject)
    if (!activeObject) return
    const hasObjectHandledDelete = activeObject.handleDeleteKeyPress()
    if (hasObjectHandledDelete) {
      return
    }
    // const isObjectInEditingMode = activeObject?.isFillEditing
    console.log('hasObjectHandledDelete: ', hasObjectHandledDelete)
    return this.handleRequestDeleteObject(e)
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
    userSetName: string | null = null,
    insertAtIndex: number | null = null
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
    // console.log('handle add single object to current scene')

    const newGUID = uuidv4()
    // Apply custom settings to object
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
    if (insertAtIndex !== null) {
      this.liveEditor?.fabricCanvas?.insertAt(useAsCustom, insertAtIndex, false)
    } else {
      this.liveEditor?.fabricCanvas?.add(useAsCustom)
    }

    this.liveEditor?.fabricCanvas?.updatePaths()
    this.liveEditor?.fabricCanvas?.setActiveObject(useAsCustom)
    this.liveEditor?.fabricCanvas?.requestRenderAll()
    return objectToAdd
  }

  handleDuplicateScene = (newPosition = 'below') => {
    console.log('handleDuplicateScene: ', this.activeSceneIndex)
    if (this.activeSceneIndex === null) return Modal.warn({ content: 'No active scene to duplicate' })
    // We need to update our objectscrenerefs if the objects are present in the duplicated scene

    const newActiveSceneObject = this.getSaveableCurrentSceneState()
    if (!newActiveSceneObject) return
    console.log({ newActiveSceneObject })
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
      newScenesArray.push(JSON.parse(JSON.stringify(newActiveSceneObject)))
      newScenesArray.push(JSON.parse(JSON.stringify(newActiveSceneObject)))
    })
    const newActiveSceneIndex = newPosition === 'below' ? this.activeSceneIndex + 1 : this.activeSceneIndex
    const newProjectObject = {
      ...this.state.project,
      scenes: JSON.parse(JSON.stringify(newScenesArray))
    }
    return this.setState({
      project: newProjectObject,
      activeSceneIndexs: [newActiveSceneIndex]
    }, () => {
      console.log({ newScenesArray, newProjectObject })
      console.log(this.state.project)
    })
  }

  handleDeleteScene = () => {
    console.log('handleDeleteScene')
  }

  setOnGlobalObject = (obj: CustomFabricObject, settings: {}) => {
    if (obj && this.activeSceneIndex !== null) {
      // get active scene and options for object in active scene then add/modify corresponding setting to value
      const activeScene = this.state.project.scenes[this.activeSceneIndex];
      let currentOptions = activeScene.activeSceneObjects[obj.guid];
      let newSettings = { ...currentOptions, ...settings };

      const newSceneActiveObjectsObject = {
        ...activeScene.activeSceneObjects,
        [obj.guid]: newSettings,
      };

      return this.setState({
        project: {
          ...this.state.project,
          scenes: this.state.project.scenes.map(
            (currSceneObject: SceneType, currScreenIndex: number) => {
              if (currScreenIndex !== this.activeSceneIndex)
                return currSceneObject;
              return {
                ...currSceneObject,
                activeSceneObjects: newSceneActiveObjectsObject,
              };
            }
          ),
        },
      });
    }
  };

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
      projectPreviewOpen,
      mediaPickerState
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
            projectParaStylesController={this.projectParaStylesController}
            setActiveSceneIndex={this.setActiveSceneIndex}
            handleAddObject={this.handleAddObject}
            handleDuplicateScene={this.handleDuplicateScene}
            handleDeleteScene={this.handleDeleteScene}
            handleOpenProjectPreview={this.handleOpenProjectPreview}
            setOnGlobalObject={this.setOnGlobalObject}
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
          {
            <MediaPickerContainer
              open={mediaPickerState.open}
              onCancel={this.handleCancelMediaPicker}
              storageHandlerClass={this.storageHandlerClass}
              handleInsertImage={this.handleInsertImage}
            />
          }
        </>
      )
    } else {
      return <p>Loading project data</p>;
    }
  }
}


export {
  ProjectController, ImageStorageHandler
}

interface IProjectPreviewRendererContainerProps {
  project: ProjectDataTypes
}

class ProjectPreviewRendererContainer extends React.Component<IProjectPreviewRendererContainerProps, {}> {
  ca1: HTMLCanvasElement | null
  ca2: HTMLCanvasElement | null
  c1: fabric.StaticCanvas | undefined
  c2: fabric.Canvas | undefined
  projectParaStylesController: ProjectParaStylesController
  renderEngine: RenderEngine | undefined
  constructor(props: IProjectPreviewRendererContainerProps) {
    super(props)
    this.ca1 = null
    this.ca2 = null
    this.projectParaStylesController = new ProjectParaStylesController(props.project)
  }

  componentDidMount() {
    const { project } = this.props
    if (!this.ca1 || !this.ca2) return console.error('Dom canvases not present in ProjectPreviewRendererContainer didMount')
    this.c1 = new fabric.StaticCanvas(this.ca1)
    this.c2 = new fabric.Canvas(this.ca2)
    //@ts-ignore
    this.c2.projectParaStylesController = this.projectParaStylesController
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
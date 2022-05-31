import { Gradient, IObjectOptions, Pattern } from "fabric/fabric-impl";
import React, { MouseEventHandler } from "react";
import { LinearGradientControls } from "../Utils/CustomControls/LinearGradient";

type PathPointValue = (string | number)[]

interface CustomControl extends fabric.Control {
  pointIndex?: number
}

type SelectedPointIndexesDict = Record<number, boolean>


interface OurCustomFabricOptions {
  guid: string,
  userSetName: string,
  firstOccurrenceIndex?: number,
  parentID?: string,
  members?: Array<string>,
  objects?: Array<CustomFabricObject>,
  radius?: number,
  objectIndex?: number,
  treeIndex?: number,
  topLevelIndex?: number,
  depth?: number,
  structurePath?: Array<string>,
  text?: string
  widthEquation?: string,
  heightEquation?: string,
  fill?: string | Pattern | Gradient | Array<string> | undefined,
  userLocked?: boolean
  handleChildrenMode?: string | boolean
  isEditing?: boolean
  editingType?: string
  editingLocation?: string
  editingIndex?: number
  activeFillValue?: IObjectOptions['fill'],
  path?: PathPointValue[] | string,
  hoveredControl?: CustomControl,
  selectedPointIndexes?: SelectedPointIndexesDict,
  handleDeleteKeyPress(): boolean,
  totalPath?: Path2D
}

interface CustomFabricOptions extends SimpleSpread<IObjectOptions, OurCustomFabricOptions> { }
type FabricObjectWithoutSet = Exclude<fabric.Object, 'set'>

interface CustomFabricObject extends SimpleSpread<CustomFabricOptions, FabricObjectWithoutSet> {
  // set<K extends keyof CustomFabricOptions>(key: K, value: CustomFabricOptions[K] | ((value: CustomFabricOptions[K]) => CustomFabricOptions[K])): this;
  set(options: Partial<CustomFabricOptions>): this
  toggleUserLocked(): this
  toggleVisibility(): this
  linearGradientControls?: LinearGradientControls
  activeStopIndex?: number | null
  isFillEditing?: boolean
  enterFillEditingMode(arg0: IEnterFillEditingArgs): this
  handleChangeFillMode(arg0: IhandleChangeFillMode): this
  afterManualPathUpdate(): this
  resetControls?(): this
  enterPathEditingMode?(): this
  exitPathEditingMode?(): this
}

interface IEnterFillEditingArgs {
  location: string,
  index?: number
}
interface IhandleChangeFillMode {
  location: string,
  index?: number,
  newValue: CustomFabricObject['fill']
}

type SimpleSpread<L, R> = R & Pick<L, Exclude<keyof L, keyof R>>;

interface CustomFabricCircle extends SimpleSpread<CustomFabricObject, fabric.Circle> { }
interface CustomFabricGroup extends SimpleSpread<CustomFabricObject, fabric.Group> { }



export type {
  CustomFabricObject,
  CustomFabricCircle,
  CustomFabricGroup,
  SimpleSpread,
  CustomFabricOptions
}
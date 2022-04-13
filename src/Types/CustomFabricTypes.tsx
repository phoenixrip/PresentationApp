import { Gradient, IObjectOptions, Pattern } from "fabric/fabric-impl";
import React, { MouseEventHandler } from "react";


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
}

interface CustomFabricOptions extends SimpleSpread<IObjectOptions, OurCustomFabricOptions> { }

type FabricObjectWithoutSet = Exclude<fabric.Object, 'set'>
interface CustomFabricObject extends SimpleSpread<CustomFabricOptions, FabricObjectWithoutSet> {
  // set<K extends keyof CustomFabricOptions>(key: K, value: CustomFabricOptions[K] | ((value: CustomFabricOptions[K]) => CustomFabricOptions[K])): this;
  set(options: Partial<CustomFabricOptions>): this
  toggleUserLocked(): this
  toggleVisibility(): this
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
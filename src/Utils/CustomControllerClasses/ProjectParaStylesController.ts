import { fabric } from 'fabric'
import { TextOptions } from "fabric/fabric-impl";
import { ProjectDataTypes } from "../../Types/ProjectDataTypes";

export interface IParaStyleOptions extends TextOptions {
  paraTopMargin: number,
  paraBottomMargin: number,
  paraTopPadding: number,
  paraBottomPadding: number
}

interface IProjectParaStylesSettings {
  defaultParaStyle: string,
  paraStyles: Record<string, {
    displayName: string,
    styles: Partial<IParaStyleOptions>
  }>,
}

const defaults: Partial<IParaStyleOptions> = {
  overline: false,
  linethrough: false,
  underline: false,
  fontStyle: 'normal',
  fontWeight: 'normal',
  fontFamily: 'Helvetica',
  fontSize: 22,
  textAlign: 'left',
  fill: 'white',
  paraTopPadding: 0,
  paraBottomPadding: 0,
  paraTopMargin: 0,
  paraBottomMargin: 0
}

const defaultParaStylesSettings: IProjectParaStylesSettings = {
  defaultParaStyle: 'd',
  paraStyles: {
    'd': {
      displayName: 'Body',
      styles: {
        ...defaults,
        paraTopMargin: 0,
        paraBottomMargin: 10
      },
    },
    't': {
      displayName: 'Title',
      styles: {
        ...defaults,
        textAlign: 'center',
        fontWeight: 'bold',
        // @ts-ignore
        fill: {
          type: 'linear',
          colorStops: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 1, color: '#929292' },
          ],
          coords: { x1: 0, y1: 0, x2: 200, y2: 200 }
        },
        fontSize: 32,
        paraTopMargin: 0,
        paraBottomMargin: 0
      }
    },
    'ta': {
      displayName: 'Title alt',
      styles: {
        ...defaults,
        textAlign: 'center',
        fontWeight: 'bold',
        // @ts-ignore
        fill: {
          type: 'linear',
          colorStops: [
            { offset: 0, color: '#00E8FF' },
            { offset: 1, color: '#FF00F7' },
          ],
          coords: { x1: 0, y1: 0, x2: 200, y2: 200 }
        },
        fontSize: 32,
        paraTopMargin: 0,
        paraBottomMargin: 0
      },
    },
    '1': {
      displayName: 'Sub title',
      styles: {
        ...defaults,
        fill: 'grey',
        fontSize: 20,
        paraTopMargin: 2,
        paraBottomMargin: 5
      }
    }
  }
}

class ProjectParaStylesController {
  paraStyles: IProjectParaStylesSettings['paraStyles']
  defaultParaStyle: IProjectParaStylesSettings['defaultParaStyle']
  constructor(project: ProjectDataTypes) {
    this.paraStyles = defaultParaStylesSettings.paraStyles
    this.defaultParaStyle = defaultParaStylesSettings.defaultParaStyle
    this.enlivenParaStyles()
  }
  enlivenParaStyles() {
    // Iterate thru all avail para styles and enliven the fill options
    // to be used by textboxs when rendering
    Object.entries(this.paraStyles)
      .forEach(([paraStyleKey, paraStyleObject]) => {
        if (typeof paraStyleObject.styles.fill === 'object') {
          this.paraStyles[paraStyleKey].styles.fill = new fabric.Gradient(paraStyleObject.styles.fill)
        }
      })
  }
}

export {
  ProjectParaStylesController
}
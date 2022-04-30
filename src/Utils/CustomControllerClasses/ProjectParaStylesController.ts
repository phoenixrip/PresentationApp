import { TextOptions } from "fabric/fabric-impl";
import { ProjectDataTypes } from "../../Types/ProjectDataTypes";

interface IParaStyleOptions extends TextOptions {
  paraMarginBottom?: number,
  paraMarginTop?: number
}

interface IProjectParaStylesSettings {
  defaultParaStyle: string,
  paraStyles: Record<string, {
    displayName: string,
    styles: Partial<IParaStyleOptions>
  }>
}

const defaultParaStylesSettings: IProjectParaStylesSettings = {
  defaultParaStyle: 'd',
  paraStyles: {
    'd': {
      displayName: 'Default',
      styles: {
        textAlign: 'center',
        fontFamily: 'Helvetica',
        fill: 'white',
        fontSize: 22
      }
    },
    '1': {
      displayName: 'Title',
      styles: {
        textAlign: 'center',
        fontFamily: 'Helvetica',
        fill: 'grey',
        fontSize: 28
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
  }

}

export {
  ProjectParaStylesController
}
import React, { Component, ReactNode } from "react";
import { Editor } from './Editor'
import { SceneType } from "./Types/sceneType";
import { SizeType } from 'antd/lib/config-provider/SizeContext'

// interface globalAppStateType {
//     tick: Boolean,
//     isInitted: Boolean,
//     project: {
//       settings: {
//         theme: String,
//         dimensions: {
//           width: number,
//           height: number,
//         }
//       },
//       globalObjects: Object,
//       scenes: Array<SceneType>
//     },
//     editorState: {
//       activeSceneIndex: number,
//       antdSize: SizeType
//     },
//     userSettings: {
//       name: String
//     }
//   }
  


class AppController extends Component {
    render(): ReactNode {
        return <Editor />
    }
}


export { AppController }
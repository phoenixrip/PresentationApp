import React, { Component, ReactNode } from "react";
import { Editor } from "./Editor";
import { SizeType } from "antd/lib/config-provider/SizeContext";
import { ProjectDataTypes } from "./Types/ProjectDataTypes";

// const dummyProjectData: ProjectDataTypes = {
//   settings: {
//     dimensions: {
//       width: 896,
//       height: 504,
//     },
//   },
//   globalObjects: {
//     "2131-eww2w-2312-dadaa": {
//       uniqueGlobalId: "2131-eww2w-2312-dadaa",
//       angle: 0,
//       clipTo: null,
//       fill: "#29477F",
//       flipX: false,
//       flipY: false,
//       height: 150,
//       left: 300,
//       opacity: 1,
//       overlayFill: null,
//       rx: 0,
//       ry: 0,
//       scaleX: 1,
//       scaleY: 1,
//       shadow: {
//         blur: 5,
//         color: "rgba(94, 128, 191, 0.5)",
//         offsetX: 10,
//         offsetY: 10,
//       },
//       stroke: null,
//       strokeDashArray: null,
//       strokeLineCap: "butt",
//       strokeLineJoin: "miter",
//       strokeMiterLimit: 10,
//       strokeWidth: 1,
//       top: 150,
//       type: "rect",
//       visible: true,
//       width: 150,
//       x: 0,
//       y: 0,
//       firstOccurenceIndex: 1,
//     },
//     "wda1-ew21-dhftft-2313": {
//       uniqueGlobalId: "wda1-ew21-dhftft-2313",
//       angle: 0,
//       clipTo: null,
//       fill: "rgb(166,111,213)",
//       flipX: false,
//       flipY: false,
//       height: 200,
//       left: 300,
//       opacity: 1,
//       overlayFill: null,
//       radius: 100,
//       scaleX: 1,
//       scaleY: 1,
//       shadow: {
//         blur: 20,
//         color: "#5b238A",
//         offsetX: -20,
//         offsetY: -10,
//       },
//       stroke: null,
//       strokeDashArray: null,
//       strokeLineCap: "butt",
//       strokeLineJoin: "miter",
//       strokeMiterLimit: 10,
//       strokeWidth: 1,
//       top: 400,
//       type: "circle",
//       visible: true,
//       width: 200,
//       firstOccurenceIndex: 1,
//     },
//   },
//   scenes: [
//     {
//       sceneSettings: {},
//       activeSceneObjects: {
//         "2131-eww2w-2312-dadaa": { top: 0, left: 0 } as fabric.IObjectOptions,
//         "wda1-ew21-dhftft-2313": { top: 100, left: 100 } as fabric.IObjectOptions,
//       },
//       undoHistory: [
//         {
//           "2131-eww2w-2312-dadaa": { top: 0, left: 0 } as fabric.IObjectOptions,
//           "wda1-ew21-dhftft-2313": { top: 100, left: 100 } as fabric.IObjectOptions,
//         },
//       ],
//       redoHistory: [],
//     },
//     {
//       sceneSettings: {},
//       activeSceneObjects: {
//         "2131-eww2w-2312-dadaa": {
//           top: 400,
//           left: 400,
//         } as fabric.IObjectOptions,
//         "wda1-ew21-dhftft-2313": {
//           top: 500,
//           left: 500,
//         } as fabric.IObjectOptions,
//       },
//       undoHistory: [],
//       redoHistory: [],
//     },
//   ],
// };

const dummyProjectData: ProjectDataTypes = {
  settings: {
    dimensions: {
      width: 896,
      height: 504,
    },
  },
  globalObjects: {
    "2131-eww2w-2312-dadaa": {
      uniqueGlobalId: "2131-eww2w-2312-dadaa",
      fill: "#29477F",
      height: 150,
      left: 300,
      shadow: {
        blur: 5,
        color: "rgba(94, 128, 191, 0.5)",
        offsetX: 10,
        offsetY: 10,
        affectStroke: false,
        nonScaling: false
      },
      top: 150,
      type: "rect",
      width: 150,
      firstOccurrenceIndex: 1,
      version: "5.2.1"
    },
    "wda1-ew21-dhftft-2313": {
      uniqueGlobalId: "wda1-ew21-dhftft-2313",
      fill: "rgb(166,111,213)",
      startAngle:0,
      endAngle: 360,
      height: 200,
      left: 300,
      radius: 100,
      shadow: {
        blur: 20,
        color: "#5b238A",
        offsetX: -20,
        offsetY: -10,
        affectStroke: false,
        nonScaling: false
      },
      top: 400,
      type: "circle",
      width: 200,
      firstOccurrenceIndex: 1,
      version: "5.2.1"
    },
  },
  scenes: [
    {
      sceneSettings: {},
      activeSceneObjects: {
        "2131-eww2w-2312-dadaa": { top: 0, left: 0 } as fabric.IObjectOptions,
        "wda1-ew21-dhftft-2313": { top: 100, left: 100 } as fabric.IObjectOptions,
      },
      undoHistory: [
        {
          "2131-eww2w-2312-dadaa": { top: 0, left: 0 } as fabric.IObjectOptions,
          "wda1-ew21-dhftft-2313": { top: 100, left: 100 } as fabric.IObjectOptions,
        },
      ],
      redoHistory: [],
    },
    {
      sceneSettings: {},
      activeSceneObjects: {
        "2131-eww2w-2312-dadaa": {
          top: 400,
          left: 400,
        } as fabric.IObjectOptions,
        "wda1-ew21-dhftft-2313": {
          top: 500,
          left: 500,
        } as fabric.IObjectOptions,
      },
      undoHistory: [],
      redoHistory: [],
    },
  ],
};
const dummyAppControllerState: AppControllerStateTypes = {
  userSettings: {
    name: "Inspector Payne",
  },
  project: dummyProjectData,
};

interface AppControllerStateTypes {
  userSettings: {
    name: String;
  };
  project?: ProjectDataTypes;
}

class AppController extends Component<{}, AppControllerStateTypes> {
  constructor(props: Object) {
    super(props);
    this.state = dummyAppControllerState;
  }
  render(): ReactNode {
    if (this.state?.project) {
      return <Editor project={this.state.project} />;
    } else {
      return <p>NO DATA TO OPEN EDITOR WITH</p>;
    }
  }
}

export { AppController };

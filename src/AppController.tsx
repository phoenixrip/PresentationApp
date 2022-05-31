import React, { Component, ReactNode } from "react";
import { ProjectDataTypes } from "./Types/ProjectDataTypes";
import { ProjectController } from "./ProjectController";
import { setFabricDefaults } from "./Utils/SetFabricDefaults";
import { ContextMenu } from "./ContextMenu"
import { MediaPickerContainer, UploadNewImageArgs } from "./MediaPicker/MediaPickerContainer";
import { LocalStorage } from "./PlugIns/MediaUploadController/LocalStorage";
import { RequestInsertImageEventTypes } from "./Events/RequestInsertImage";
import { ICustomMediaStorageApi } from "./PlugIns/ImageStorageHandler/ImageStorageHandlerClass";
import { Gradient } from "fabric/fabric-impl";

setFabricDefaults()

const dummyProjectData: ProjectDataTypes = {
	settings: {
		dimensions: {
			width: 896,
			height: 504,
		},
	},
	globalObjects: {
		//@ts-ignore
		'swordPath': {
			scaleX: 1.2,
			scaleY: 1.2,
			userSetName: 'Sword',
			guid: 'sword',
			"type": "path",
			"left": 348.98,
			"top": 163.88,
			"width": 167.83,
			"height": 103.13,
			"fill": "rgb(0, 255, 0)",
			"strokeWidth": 1,
			"strokeDashArray": [2],
			"strokeLineCap": "round",
			"strokeLineJoin": "round",
			"path": "m 40 80 l 60 -70 l 30 -10 l -10 30 l -70 60 c 10 10 10 20 20 10 c 0 10 10 20 0 20 a 14.2 14.2 90 0 1 -10 10 a 50 50 90 0 0 -20 -30 q -5 -1 -5 5 t -15 13 t -8 -8 t 13 -15 t 5 -5 a 50 50 90 0 0 -30 -20 a 14.2 14.2 90 0 1 10 -10 c 0 -10 10 0 20 0 c -10 10 0 10 10 20 m 60 -70 l 0 20 l 20 0 l -18 -2 l -2 -18"
		},
		// //@ts-ignore
		'piePath': {
			scaleX: 1.2,
			scaleY: 1.2,
			userSetName: 'Pie',
			guid: 'pie',
			stroke: 'rgba(255, 255, 255, 1)',
			strokeWidth: 20,
			"type": "path",
			"left": 348.98,
			"top": 163.88,
			"width": 167.83,
			"height": 103.13,
			"fill": "green",
			"strokeDashArray": [2],
			"strokeLineCap": "round",
			"strokeLineJoin": "round",
			"path": "M 562.199 313.457 A 127 127 0 1 1 435.199 186.457 L 435.199 313.457 Z"
		},
		'newPath': {
			userSetName: 'newPath',
			guid: 'newPath',
			"type": "path",
			"left": 200,
			"top": 200,
			"fill": "rgba(55, 69, 50, 1)",
			"strokeWidth": 20,
			stroke: 'rgb(0, 0, 255)',
			// "strokeDashArray": [2],
			// "strokeLineCap": "round",
			// "strokeLineJoin": "round",
			"path": "M 0 0 L 200 0 L 500 100 L 0 100 Z"
		}
		// "rectangle1": {
		// 	guid: "rectangle1",
		// 	type: "CRect",
		// 	top: 0,
		// 	left: 0,
		// 	width: 100,
		// 	height: 100,
		// 	fill: undefined,
		// 	firstOccurrenceIndex: 1,
		// 	userSetName: 'My red rect'
		// }
	},
	scenes: [
		{
			sceneSettings: {},
			activeSceneObjects: {
				'piePath': {
					top: 0,
					left: 0,
					userSetName: 'Pie',
					guid: 'path'
				},
				'swordPath': {
					top: 0,
					left: 0,
					userSetName: 'Sword',
					guid: 'path'
				},
				'newPath': {
					top: 0,
					left: 0,
					userSetName: 'newPath',
					guid: 'newPath'
				},
				// 	"rectangle1": {
				// 		guid: "rectangle1",
				// 		top: 0,
				// 		left: 0,
				// 		width: 100,
				// 		height: 100,
				// 		userSetName: 'My red rect'
				// 	}
				// },
				//@ts-ignore
				undoHistory: [],
				//@ts-ignore
				redoHistory: [],
			},
		}
	],
}

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

const customMediaStorageApi: ICustomMediaStorageApi = {
	// Upload an image and then load and return a valid element to make a mediaObject out of
	handleUploadImage: async function (uploadArgs) {
		console.log('CUSTOM mediaStorageApi handleUploadImage')
		return uploadArgs.exportVersions.small
	}
}

class AppController extends Component<{}, AppControllerStateTypes> {
	constructor(props: Object) {
		super(props);
		// console.clear()
		this.state = dummyAppControllerState
	}

	handleUploadImage = async (uploadArgs: UploadNewImageArgs) => {
		console.log('APP CONTROLLER: handleUploadImage', { uploadArgs })
		// return
	}
	render(): ReactNode {
		if (this.state?.project) {
			return <>
				{/* {<ContextMenu />
				} */}
				<ProjectController
					project={this.state.project}
					customMediaStorageApi={customMediaStorageApi}
				/>
			</>
		} else {
			return <p>NO DATA TO OPEN EDITOR WITH</p>;
		}
	}
}

export { AppController };
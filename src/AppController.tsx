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
		"rectangle1": {
			guid: "rectangle1",
			type: "CRect",
			top: 0,
			left: 0,
			width: 100,
			height: 100,
			fill: undefined,
			// fill: {
			// 	type: 'linear',
			// 	coords: {
			// 		x1: 0, y1: 0, x2: 75, y2: 75
			// 	},
			// 	colorStops: [
			// 		{ offset: 0.2, color: 'rgba(0, 255, 0, 1)' },
			// 		{ offset: 0.8, color: 'rgba(0, 0, 255, 1)' }
			// 	]
			// } as Gradient,
			firstOccurrenceIndex: 1,
			userSetName: 'My red rect'
		}
	},
	scenes: [
		{
			sceneSettings: {},
			activeSceneObjects: {
				"rectangle1": {
					guid: "rectangle1",
					top: 0,
					left: 0,
					width: 100,
					height: 100,
					userSetName: 'My red rect'
				}
			},
			undoHistory: [],
			redoHistory: [],
		},
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
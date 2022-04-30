import React, { Component, ReactNode } from "react";
import { ProjectDataTypes } from "./Types/ProjectDataTypes";
import { ProjectController } from "./ProjectController";
import { setFabricDefaults } from "./Utils/SetFabricDefaults";
import { ContextMenu } from "./ContextMenu"
import { MediaPickerContainer, UploadNewImageArgs } from "./MediaPicker/MediaPickerContainer";
import { LocalStorage } from "./PlugIns/MediaUploadController/LocalStorage";
import { RequestInsertImageEventTypes } from "./Events/RequestInsertImage";
import { ICustomMediaStorageApi } from "./PlugIns/ImageStorageHandler/ImageStorageHandlerClass";

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
			width: 160,
			height: 90,
			fill: ["red", 'rgba(0, 0, 0, 0.75)'],
			firstOccurrenceIndex: 1,
			userSetName: 'My red rect'
		},
		"rectangle2": {
			guid: "rectangle2",
			type: "CRect",
			top: 0,
			left: 160,
			width: 160,
			height: 90,
			fill: 'green',
			firstOccurrenceIndex: 1,
			userSetName: 'My green rect'
		},
		"rectangle3": {
			guid: "rectangle3",
			type: "CRect",
			top: 0,
			left: 320,
			width: 160,
			height: 90,
			fill: 'purple',
			firstOccurrenceIndex: 1,
			userSetName: 'My purple rect'
		},
		"rectangle4": {
			guid: "rectangle4",
			type: "CRect",
			top: 0,
			left: 480,
			width: 160,
			height: 90,
			fill: 'black',
			firstOccurrenceIndex: 1,
			userSetName: 'My black rect'
		},
		"rectangle5": {
			guid: "rectangle5",
			type: "CRect",
			top: 0,
			left: 640,
			width: 160,
			height: 90,
			fill: 'blue',
			firstOccurrenceIndex: 1,
			userSetName: 'My blue rect'
		},
	},
	scenes: [
		{
			sceneSettings: {},
			activeSceneObjects: {
				"rectangle1": {
					guid: "rectangle1",
					// type: "CRect",
					top: 0,
					left: 0,
					width: 160,
					height: 90,
					// fill: ["red", 'rgba(0, 0, 0, 0.75)'],
					// firstOccurrenceIndex: 1,
					userSetName: 'My red rect'
				},
				"rectangle2": {
					guid: "rectangle2",
					// type: "CRect",
					top: 0,
					left: 160,
					width: 160,
					height: 90,
					// fill: 'green',
					// firstOccurrenceIndex: 1,
					userSetName: 'My green rect'
				},
				"rectangle3": {
					guid: "rectangle3",
					// type: "CRect",
					top: 0,
					left: 320,
					width: 160,
					height: 90,
					// fill: 'purple',
					// firstOccurrenceIndex: 1,
					userSetName: 'My purple rect'
				},
				"rectangle4": {
					guid: "rectangle4",
					// type: "CRect",
					top: 0,
					left: 480,
					width: 160,
					height: 90,
					// fill: 'black',
					// firstOccurrenceIndex: 1,
					userSetName: 'My black rect'
				},
				"rectangle5": {
					guid: "rectangle5",
					// type: "CRect",
					top: 0,
					left: 640,
					width: 160,
					height: 90,
					// fill: 'blue',
					// firstOccurrenceIndex: 1,
					userSetName: 'My blue rect'
				},
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
				{<ContextMenu />
				}
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
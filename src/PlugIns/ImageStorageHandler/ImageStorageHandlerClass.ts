import { UploadNewImageArgs } from "../../MediaPicker/MediaPickerContainer"
import { fabric } from 'fabric'

export interface ICustomMediaStorageApi {
  handleUploadImage(uploadArgs: UploadNewImageArgs): Promise<UsableMediaElement>
}



export type UsableMediaElement = string | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement

class ImageStorageHandler {
  storageApi: ICustomMediaStorageApi
  constructor(storageApi: ICustomMediaStorageApi) {
    this.storageApi = storageApi
  }
  handleUploadImage = async (uploadArgs: UploadNewImageArgs) => {
    console.log('ImageStorageHandler: handleUploadImage', { uploadArgs })
    try {
      const responseFromCustom = await this.storageApi.handleUploadImage.call(this, uploadArgs)
      const liveObject = await this.handleCreateLiveImage(responseFromCustom)
      console.log({ liveObject })
      return liveObject
    } catch (error) {
      console.log('ImageStorageHandler handleUploadImage error', { error })
    }
  }
  handleCreateLiveImage = (responseFromCustom: UsableMediaElement) => {
    return new Promise((resolve, reject) => {
      if (typeof responseFromCustom === 'string') {
        fabric.Image.fromURL(responseFromCustom, img => {
          console.log('handleCreateLiveImage', { img })
          resolve(img)
        })
      }
    })
  }
}

export { ImageStorageHandler }
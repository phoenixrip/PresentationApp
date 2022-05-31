import React, { Component } from 'react'
import { fabric } from 'fabric'
// import TagsContainer from './TagsContainer'
// import TagAndAltAddContainer from './TagAndAltAddContainer'
import { Spin, Input, Select, Typography, Button } from 'antd'
import c from './CropTagContainer.module.scss'

const l = (message) => console.log(message)

export default class CropTagContainer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentStep: 'cropping',
      exportData: null,
      format: props.selectedImageOption.formatString,
      altText: '',
      currentImageTags: props.selectedImageOption?.tags || []
    }
  }

  componentDidMount() {
    const { selectedImageOption } = this.props
    this.fabricCanvas = new fabric.Canvas(this.c)
    this.fabricCanvas.renderOnAddRemove = false
    this.fabricCanvas.setDimensions({ width: 896, height: 504 })
    this.fabricCanvas.add(new fabric.Textbox('Loading image', {
      width: 896,
      top: 504 * .5,
      textAlign: 'center',
      fontSize: 12,
      fontFamily: 'Arial',
      fill: 'white',
      objectCaching: false
    }))
    fabric.Image.fromURL(selectedImageOption.largeImageURL, (img) => {
      this.img = img
      this.img.set({
        left: 896 * 0.5,
        top: 504 * 0.5,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      })
      if (img.height > 504 || img.width > 896) {
        img.scaleToWidth(896)
        if (img.height * img.scaleY > 504) {
          img.scaleToHeight(504)
        }
      }
      this.fabricCanvas.add(img)
      img.setCoords()
      this.addCropRect()
      this.fabricCanvas.on('before:render', this.handleBeforeRender)

    }, { crossOrigin: 'Anonymous' })
  }

  addCropRect = () => {
    const bgRectSettings = {
      width: 896,
      height: 504,
      fill: 'rgba(0, 0, 0, 0.75)',
      top: 0,
      left: 0,
      stroke: 'rgba(0, 0, 0, 0.75)',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      objectCaching: false
    }
    this.top = new fabric.Rect(bgRectSettings)
    this.right = new fabric.Rect(bgRectSettings)
    this.bottom = new fabric.Rect(bgRectSettings)
    this.left = new fabric.Rect(bgRectSettings)

    this.cropRect = new fabric.Rect({
      width: this.img.width * this.img.scaleX,
      height: this.img.height * this.img.scaleY,
      left: 896 * 0.5,
      top: 504 * 0.5,
      fill: 'transparent',
      stroke: 'red',
      strokeWidth: 2,
      selectable: true,
      originX: 'center', originY: 'center',
      strokeDashArray: [4, 4],
      objectCaching: false
    })
    this.fabricCanvas
      .add(this.cropRect)
      .add(this.top)
      .add(this.right)
      .add(this.bottom)
      .add(this.left)
      .setActiveObject(this.cropRect)
      .requestRenderAll()
  }

  handleBeforeRender = () => {
    // const isLeftLeftOfImage = this.cropRect.aCoords.tl.x - this.img.aCoords.tl.x
    // console.log({ isLeftLeftOfImage })
    this.top.set({
      width: this.cropRect.getScaledWidth(),
      left: Math.floor(this.cropRect.left - (this.cropRect.getScaledWidth() / 2)),
      height: 0 + (this.cropRect.top - (this.cropRect.getScaledHeight() / 2))
    })
    this.bottom.set({
      width: this.cropRect.getScaledWidth(),
      left: this.cropRect.left - (this.cropRect.getScaledWidth() / 2),
      height: Math.max(0, 504 - this.cropRect.aCoords.bl.y),
      top: this.cropRect.aCoords.bl.y,
    })
    this.left.set({
      width: Math.ceil(Math.max(0, this.cropRect.aCoords.tl.x)),
      height: 504,
    })
    this.right.set({
      width: Math.max(0, 896 - this.cropRect.aCoords.tr.x),
      left: this.cropRect.aCoords.tr.x,
    })
  }

  handleCropConfirmed = () => {
    this.setState(
      (prev) => ({ currentStep: 'uploading' }),
      this.handleConfirmAndUploadCrops
    )
  }

  handleConfirmAndUploadCrops = async () => {
    const { format } = this.state
    const { exportVersions } = this.getExportVersions()

    const hasLarge = exportVersions.large !== undefined

    const smallUploadApiResponse = await this.props.appDataLayer.handleUploadNewImageSmall({
      dataURL: exportVersions.small,
      hasLarge,
      format
    })
    const imageID = smallUploadApiResponse
    if (hasLarge) {
      const largeUploadApiResponse = await this.props.appDataLayer.handleUploadLargeImageVersion({
        imageID,
        dataURL: exportVersions.large,
        format
      })
      console.log(largeUploadApiResponse)
    }
    return this.props.handleNewImageUploadCompleted(imageID)
  }

  getExportVersions = () => {
    const imgPreviewWidth = this.img.width * this.img.scaleX
    const imgPreviewHeight = this.img.height * this.img.scaleY

    const cropWidth = this.cropRect.width * this.cropRect.scaleX
    const cropHeight = this.cropRect.height * this.cropRect.scaleY
    const cropWidthP = cropWidth / imgPreviewWidth
    const cropHeightP = cropHeight / imgPreviewHeight

    const imageLeftOffset = (896 - imgPreviewWidth) / 2
    const cropRectLeft = this.cropRect.left - (cropWidth / 2)
    const imgRelativeLeft = cropRectLeft - imageLeftOffset
    const cropLeftP = imgRelativeLeft / imgPreviewWidth
    const sx = this.img.width * cropLeftP

    const imageTopOffset = (504 - imgPreviewHeight) / 2
    const cropRectTop = this.cropRect.top - (cropHeight / 2)
    const imgRelativeTop = cropRectTop - imageTopOffset
    const cropTopP = imgRelativeTop / imgPreviewHeight
    const sy = this.img.height * cropTopP

    const croppedRawImageDimensions = {
      width: this.img.width * cropWidthP,
      height: this.img.height * cropHeightP
    }

    const largestImageMaxDimensions = {
      width: (896 - 40) * 2,
      height: (504 - 40) * 2
    }

    const smallestImageMaxDimensions = {
      width: 896 - 40,
      height: 504 - 40
    }

    let format
    let quality
    if (this.state.format === 'jpg') {
      format = 'image/jpeg'
      quality = 0.8
    } else {
      format = 'image/png'
      quality = 0.92
    }

    let exportCanvas = document.createElement('canvas')
    const ctx = exportCanvas.getContext('2d')
    let exportVersions = {}

    // Large crop
    l('Checking for large export')
    if (croppedRawImageDimensions.height > largestImageMaxDimensions.height || croppedRawImageDimensions.width > largestImageMaxDimensions.width) {
      // Image is larger than largest allowed size
      // Lets compress and shrink to largest needed
      l('Crop from super large')
      const newWidthSubRatio = largestImageMaxDimensions.width / croppedRawImageDimensions.width
      const newHeightSubRatio = largestImageMaxDimensions.height / croppedRawImageDimensions.height
      const useScaleRatio = Math.min(newWidthSubRatio, newHeightSubRatio)

      const exportCanvasWidth = croppedRawImageDimensions.width * useScaleRatio
      exportCanvas.width = exportCanvasWidth
      const exportCanvasHeight = croppedRawImageDimensions.height * useScaleRatio
      exportCanvas.height = exportCanvasHeight

      ctx.drawImage(this.img._element, sx, sy, this.img.width * cropWidthP, this.img.height * cropHeightP, 0, 0, exportCanvasWidth, exportCanvasHeight)
      const dataURL = exportCanvas.toDataURL(format, quality)
      // console.log(dataURL)
      exportVersions.large = dataURL
    }
    // If we didn't just compress to large lets check if we can even make a large from this image
    if (!exportVersions.large) {
      // Image is smaller than largest needed size
      // Let's check that it's bigger than the min
      const largeAvailiable = croppedRawImageDimensions.width > smallestImageMaxDimensions.width || croppedRawImageDimensions.height > smallestImageMaxDimensions.height
      if (largeAvailiable) {
        // It is bigger than the min so we can just use the original size as large
        l('Use original as large')
        exportCanvas.width = croppedRawImageDimensions.width
        exportCanvas.height = croppedRawImageDimensions.height
        ctx.drawImage(this.img._element, sx, sy, this.img.width * cropWidthP, this.img.height * cropHeightP, 0, 0, croppedRawImageDimensions.width, croppedRawImageDimensions.height)
        const dataURL = exportCanvas.toDataURL(format, quality)
        // console.log(dataURL)
        exportVersions.large = dataURL
      }
    }

    // Now let's make a small image
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height)
    if (!exportVersions.large) {
      l('No Large, original as small')
      exportCanvas.width = croppedRawImageDimensions.width
      exportCanvas.height = croppedRawImageDimensions.height
      ctx.drawImage(this.img._element, sx, sy, this.img.width * cropWidthP, this.img.height * cropHeightP, 0, 0, croppedRawImageDimensions.width, croppedRawImageDimensions.height)
      const dataURL = exportCanvas.toDataURL(format, quality)
      // console.log(dataURL)
      exportVersions.small = dataURL
      // If there isn't already a large export that means that the original image
      // is smaller than our small size setting so we can just export the original image as the small
    } else {
      l('Cropping original to small')
      const newWidthSubRatio = smallestImageMaxDimensions.width / croppedRawImageDimensions.width
      const newHeightSubRatio = smallestImageMaxDimensions.height / croppedRawImageDimensions.height
      const useScaleRatio = Math.min(newWidthSubRatio, newHeightSubRatio)

      const exportCanvasWidth = croppedRawImageDimensions.width * useScaleRatio
      exportCanvas.width = exportCanvasWidth
      const exportCanvasHeight = croppedRawImageDimensions.height * useScaleRatio
      exportCanvas.height = exportCanvasHeight

      ctx.drawImage(this.img._element, sx, sy, this.img.width * cropWidthP, this.img.height * cropHeightP, 0, 0, exportCanvasWidth, exportCanvasHeight)
      const dataURL = exportCanvas.toDataURL(format, quality)
      // console.log(dataURL)
      exportVersions.small = dataURL
      // Else there is a largeexport and therefore we need to compress the image down
      // to our small size export
    }

    let infoObject = {}
    if (exportVersions.large) {
      const largeBytes = Math.round(exportVersions.large.length * 3 / 4)
      const largeKB = parseFloat((largeBytes / 1000).toFixed(1))
      infoObject.largeKB = largeKB
    }
    if (exportVersions.small) {
      const smallBytes = Math.round(exportVersions.small.length * 3 / 4)
      const smallKB = parseFloat((smallBytes / 1000).toFixed(1))
      infoObject.smallKB = smallKB
    }
    return { exportVersions, infoObject }
  }

  handleUploadAndInsert = async () => {

    const exportVersions = this.getExportVersions()
    const useUploadedImageObject = await this.props.handleUploadImage({
      ...exportVersions,
      currentImageTags: this.state.currentImageTags,
      altText: this.state.altText,
      format: this.state.format
    })
    console.log({ useUploadedImageObject })
  }

  handleTagsChange = (value) => {
    this.setState({ currentImageTags: value })
  }

  handleChangeAltText = (e) => {
    const newAltText = e.target.value
    return this.setState({ altText: newAltText })
  }

  render() {
    // const { currentStep, format } = this.state
    return (
      <div className={c.container}>
        <div className={c.centerContainer}>
          <div className={c.canvasContainer} style={{ height: 504, width: 896, backgroundColor: 'black' }}>
            <canvas ref={c => this.c = c} />
          </div>
          <div className={c.imageInfoContainer}>
            <Typography.Title level={5}>Alt text</Typography.Title>
            <Input.TextArea value={this.state.altText || ''} onChange={this.handleChangeAltText} />
            <Typography.Title level={5}>Tags</Typography.Title>
            <Select value={this.state.currentImageTags || []} mode="tags" style={{ width: '100%' }} placeholder="Enter image tags" onChange={this.handleTagsChange}>
            </Select>
          </div>
        </div>
        <div className={c.footerContainer}>
          <Button onClick={this.handleUploadAndInsert} type='primary'>Upload & add</Button>
        </div>
      </div>
    )
  }
}

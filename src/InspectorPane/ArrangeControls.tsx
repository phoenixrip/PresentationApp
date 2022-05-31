import { Button } from "antd"
import React, { useContext } from "react"
import { editorContext } from "../EditorContext"
import { CustomFabricObject } from "../Types/CustomFabricTypes"
import { fabric } from 'fabric'
import c from './ArrangeControls.module.scss'

interface IArrangeControlsProps {
  selection: CustomFabricObject
}

const commonButtonProps = {
  tabIndex: -1
}

const ArrangeControls = (props: IArrangeControlsProps) => {
  const context = useContext(editorContext)
  function handleCenterCenter(e: React.MouseEvent) {
    const object = props.selection
    const canvas = context.fabricCanvas!
    const projectDimensions = context.project.settings.dimensions
    const HCenter = Math.round(projectDimensions.width / 2)
    const VCenter = Math.round(projectDimensions.height / 2)
    const centerPoint = new fabric.Point(HCenter, VCenter)
    object.setPositionByOrigin(centerPoint, 'center', 'center');
    object.setCoords()
    canvas.requestRenderAll()
  }
  function handleVCenter(e: React.MouseEvent) {
    const object = props.selection
    const canvas = context.fabricCanvas!
    const projectDimensions = context.project.settings.dimensions
    // const HCenter = Math.round(projectDimensions.width / 2)
    const VCenter = Math.round(projectDimensions.height / 2)
    const centerPoint = new fabric.Point(object.left!, VCenter)
    object.setPositionByOrigin(centerPoint, object.originX!, 'center');
    object.setCoords()
    canvas.requestRenderAll()
  }
  function handleHCenter(e: React.MouseEvent) {
    const object = props.selection
    const canvas = context.fabricCanvas!
    const projectDimensions = context.project.settings.dimensions
    const HCenter = Math.round(projectDimensions.width / 2)
    // const VCenter = Math.round(projectDimensions.height / 2)
    const centerPoint = new fabric.Point(HCenter, object.top!)
    object.setPositionByOrigin(centerPoint, 'center', object.originY!);
    object.setCoords()
    canvas.requestRenderAll()
  }
  return (
    <div className={c.container}>
      {/* Center both */}
      <Button {...commonButtonProps} onClick={handleCenterCenter}>
        <svg
          style={{ fill: 'white' }}
          height='100%'
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path
            // fill="inherit"
            fillOpacity="0.2"
            stroke="inherit"
            strokeOpacity="0.9"
            strokeWidth="9.368"
            d="M81.117 19.226c-21.069.186-41.953.251-62.652.193v62.055h62.652V19.226z"
          ></path>
          <path
            // fill="inherit"
            fillOpacity="0.9"
            strokeWidth="9"
            d="M0 47a29.49 29.49 0 01.323 6H100v-6H0z"
          ></path>
          <path
            // fill="inherit"
            fillOpacity="0.9"
            strokeWidth="9"
            d="M0 47.093v5.937L100 53v-6L0 47.093z"
            transform="rotate(90 50 50)"
          ></path>
          <path
            strokeWidth="0.895"
            d="M18.303 18.268h63.404v63.404H18.303zm6.969 56.768h49.467V25.569H25.272z"
          ></path>
        </svg>
      </Button>
      <Button {...commonButtonProps} onClick={handleHCenter}>
        <svg height='100%' preserveAspectRatio="none" viewBox="0 0 100 100" style={{ fill: 'white' }}>
          <path
            fill="inherit"
            fillOpacity="0.2"
            stroke="inherit"
            strokeOpacity="0.9"
            strokeWidth="9.368"
            d="M81.117 19.226c-21.069.186-41.953.251-62.652.193v62.055h62.652V19.226z"
          ></path>
          <path
            fill="inherit"
            fillOpacity="0.9"
            strokeWidth="9"
            d="M0 47a29.49 29.49 0 01.323 6H100v-6H0z"
            transform="rotate(90 50 50)"
          ></path>
          <path
            strokeWidth="0.895"
            d="M18.303 18.268h63.404v63.404H18.303zm6.969 56.768h49.467V25.569H25.272z"
          ></path>
        </svg>
      </Button>
      <Button {...commonButtonProps} onClick={handleVCenter}>
        <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ fill: 'white' }}>
          <path
            fill="inherit"
            fillOpacity="0.2"
            stroke="inherit"
            strokeOpacity="0.9"
            strokeWidth="9.368"
            d="M81.117 19.226c-21.069.186-41.953.251-62.652.193v62.055h62.652V19.226z"
          ></path>
          <path
            fill="inherit"
            fillOpacity="0.9"
            strokeWidth="9"
            d="M0 47a29.49 29.49 0 01.323 6H100v-6H0z"
          ></path>
          <path
            strokeWidth="0.895"
            d="M18.303 18.268h63.404v63.404H18.303zm6.969 56.768h49.467V25.569H25.272z"
          ></path>
        </svg>
      </Button>
    </div>
  )
}

export {
  ArrangeControls
}
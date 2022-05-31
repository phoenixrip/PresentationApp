// import { fabric } from "fabric";
import { faC } from "@fortawesome/free-solid-svg-icons";
import React, { Component } from "react";
import { Editor } from "../Editor";
import { editorContext, EditorContextTypes } from "../EditorContext";
import { debounce } from "../Utils/debounce";


// import { editorContext, EditorContextTypes } from "../Editor";
import c from './CanvasPane.module.css'

type CanvasPanePropsTypes = {
  initFabricCanvas: Editor['initFabricCanvas'];
  updateCanvasPaneDimensions: Function,
  dimensions: {
    width: number;
    height: number;
  };
};

type CanvasPaneStateTypes = {
  localTick: Boolean
}

class CanvasPane extends Component<CanvasPanePropsTypes, CanvasPaneStateTypes> {
  static contextType = editorContext
  domCanvas: HTMLCanvasElement | null;
  div: HTMLDivElement | null;
  constructor(props: CanvasPanePropsTypes) {
    super(props);
    this.domCanvas = null;
    this.div = null
    this.state = {
      localTick: false
    }
  }
  componentDidMount() {
    const width = this.div?.offsetWidth || 0
    const height = this.div?.offsetHeight || 0
    this.props.initFabricCanvas(
      (this.domCanvas as HTMLCanvasElement),
      { width, height },
      this.attatchLocalEvents
    )
  }

  componentDidUpdate(prevProps: CanvasPanePropsTypes, prevState: Object) {
    if (
      prevProps.dimensions.width !== this.props.dimensions.width ||
      prevProps.dimensions.height !== this.props.dimensions.height
    ) {
      return this.props.updateCanvasPaneDimensions(this.props.dimensions)
    }
  }

  fireLocalTick = () => this.setState(prev => ({ localTick: !prev.localTick }))

  attatchLocalEvents = (fabricCanvas: fabric.Canvas) => {
    const { fireLocalTick } = this
    const debouncedSetAllCoords = debounce(() => {
      fabricCanvas.forEachObject(obj => obj?.setCoords?.())
    }, 300, false)
    // Mouse wheel zoom
    fabricCanvas.on("mouse:wheel", function (this: any, opt) {
      opt.e.preventDefault()
      opt.e.stopPropagation()
      if (opt.e.ctrlKey) { // console.log('mouse:wheel PINCH')
        const delta = opt.e.deltaY
        let zoom = fabricCanvas.getZoom() || 1
        zoom *= 0.999 ** delta
        if (zoom > 20) zoom = 20 // MAX ZOOM
        if (zoom < 0.1) zoom = 0.1 // MIN ZOOM
        fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
        fireLocalTick()
        debouncedSetAllCoords()
        // var vpt = c?.viewportTransform || []
        // console.log({ vpt, zoom })
      } else {
        // TODO: Add a user setting option for wether they want mouseWheel scrolling to be natural like iPhone of old school
        const e = opt.e
        let vpt = this.viewportTransform
        vpt[4] -= e.deltaX // vpt[4] += e.deltaX FOR UN-NATURAL SCROLLING
        vpt[5] -= e.deltaY // vpt[5] += e.deltaY FOR UN-NATURAL SCROLLING
        fabricCanvas.requestRenderAll()
        fireLocalTick()
        debouncedSetAllCoords()
      }
      // if (zoom < 400 / 1000) {
      //    vpt[4] = 200 - 1000 * zoom / 2
      //    vpt[5] = 200 - 1000 * zoom / 2
      //  } else {
      //    if (vpt[4] >= 0) {
      //      vpt[4] = 0
      //    } else if (vpt[4] < c.getWidth() - 1000 * zoom) {
      //      vpt[4] = c.getWidth() - 1000 * zoom
      //    }
      //    if (vpt[5] >= 0) {
      //      vpt[5] = 0
      //    } else if (vpt[5] < c.getHeight() - 1000 * zoom) {
      //      vpt[5] = c.getHeight() - 1000 * zoom
      //    }
      //  }
    });

    // SNAP TO GRID
    const gridWidth = this.context.state.gridCoords.width
    const gridHeight = this.context.state.gridCoords.height
    fabricCanvas.on('object:moving', function (options: any) {
      const { target } = options
      if (target?.type === 'group') return
      target.set({
        left: Math.round(options.target.left / gridWidth) * gridWidth,
        top: Math.round(options.target.top / gridHeight) * gridHeight
      });
    })

    fabricCanvas.on('object:scaling', (event: any) => {
      const { transform } = event
      const { target } = transform

      console.log('scaling ', target.type)
      if (target.type !== 'CRect' && target.type !== 'CustomMediaObject') return
      console.log('snapping')
      const targetWidth = target.width * target.scaleX;
      const targetHeight = target.height * target.scaleY;

      const snap = {
        // closest width to snap to
        width: Math.round(targetWidth / gridWidth) * gridWidth,
        height: Math.round(targetHeight / gridHeight) * gridHeight,
      };
      // function Snap(value: number) {
      //   return Math.round(value / snapSize) * snapSize;
      // }

      // const threshold = gridSize;

      const dist = {
        // distance from current width to snappable width
        width: Math.abs(targetWidth - snap.width),
        height: Math.abs(targetHeight - snap.height),
      };

      const centerPoint = target.getCenterPoint();

      const anchorY = transform.originY;
      const anchorX = transform.originX;

      const anchorPoint = target.translateToOriginPoint(
        centerPoint,
        anchorX,
        anchorY,
      );

      const attrs = {
        scaleX: target.scaleX,
        scaleY: target.scaleY,
      };

      // eslint-disable-next-line default-case
      switch (transform.corner) {
        case 'tl':
        case 'br':
        case 'tr':
        case 'bl':
          if (dist.width < gridWidth) {
            attrs.scaleX = snap.width / target.width;
          }
          if (dist.height < gridWidth) {
            attrs.scaleY = snap.height / target.height;
          }
          break;
        case 'mt':
        case 'mb':
          if (dist.height < gridHeight) {
            attrs.scaleY = snap.height / target.height;
          }
          break;
        case 'ml':
        case 'mr':
          if (dist.width < gridHeight) {
            attrs.scaleX = snap.width / target.width;
          }
          break;
      }

      if (attrs.scaleX !== target.scaleX || attrs.scaleY !== target.scaleY) {
        target.set(attrs);
        target.setPositionByOrigin(anchorPoint, anchorX, anchorY);
      }
    })

    // Alt key canvas pan
    // fabricCanvas.on('mouse:down', function (this: any, opt) {
    //   var evt = opt.e;
    //   if (evt.altKey === true) {
    //     this.isDragging = true;
    //     this.selection = false;
    //     this.lastPosX = evt.clientX;
    //     this.lastPosY = evt.clientY;
    //   }
    // });
    // fabricCanvas.on('mouse:move', function (this: any, opt) {
    //   if (this.isDragging) {
    //     var e = opt.e;
    //     var vpt = this.viewportTransform;
    //     vpt[4] += e.clientX - this.lastPosX;
    //     vpt[5] += e.clientY - this.lastPosY;
    //     this.requestRenderAll();
    //     this.lastPosX = e.clientX;
    //     this.lastPosY = e.clientY;
    //     fireLocalTick()
    //   }
    // });
    // fabricCanvas.on('mouse:up', function (this: any, opt) {
    //   // on mouse up we want to recalculate new interaction
    //   // for all objects, so we call setViewportTransform
    //   this.setViewportTransform(this.viewportTransform);
    //   this.isDragging = false;
    //   this.selection = true;
    // });
  }
  render() {
    const totalLines = 200
    const linesArray = Array.from({ length: totalLines })
    const useTransformMatrix = this?.context?.fabricCanvas?.viewportTransform?.toString?.() || `0, 0, 0, 0, 0, 0`
    return (
      <div
        className={c.paneContainer}
        style={{ width: '100%', height: '100%' }} ref={d => this.div = d}>
        <div className={c.svgUnderlayContainer}>
          <svg width={this.props.dimensions.width} height={this.props.dimensions.height}>
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" x1="448" y1="0" x2="448" y2="504" id="gradient-0">
                <stop offset="0" style={{ stopColor: '#000000' }}></stop>
                <stop offset="1" style={{ stopColor: '#3B3B3B' }}></stop>
              </linearGradient>
            </defs>
            <g transform={`matrix(${useTransformMatrix})`}>
              <rect
                width={this.context.project.settings.dimensions.width}
                height={this.context.project.settings.dimensions.height}
                // fill='rgb(255, 255, 255)'
                fill='url(#gradient-0)'
              />
            </g>
          </svg>
        </div>
        <canvas ref={(c) => (this.domCanvas = c)} />
        <div className={c.svgOverlayContainer}>
          <svg width={this.props.dimensions.width} height={this.props.dimensions.height}>
            <defs>
              <mask id='clipper'>
                <rect
                  width='100%'
                  height='100%'
                  fill='white' />
                <rect
                  transform={`matrix(${useTransformMatrix})`}
                  width={this.context.project.settings.dimensions.width}
                  height={this.context.project.settings.dimensions.height}
                  fill='black'
                />
              </mask>
            </defs>
            <rect
              mask="url(#clipper)"
              width='100%'
              height='100%'
              fill='rgba(0, 0, 0, 0.3)' />
            <g transform={`matrix(${useTransformMatrix})`}>
              {
                linesArray
                  .map((_, i) => {
                    const y = (this.context.state.gridCoords.height * (i - (totalLines / 2)))/*  + (this.context.state.project.settings.dimensions.height * .5) */
                    return (
                      <line
                        key={`h${i}`}
                        className={c.line}
                        x1='-99999'
                        x2='99999'
                        y1={y}
                        y2={y}
                      />)
                  })
              }
              {
                linesArray
                  .map((_, i) => {
                    const x = (this.context.state.gridCoords.width * (i - (totalLines / 2)))/*  + (this.context.state.project.settings.dimensions.width * .5) */
                    return (
                      <line
                        key={`v${i}`}
                        className={c.line}
                        y1='-99999'
                        y2='99999'
                        x1={x}
                        x2={x}
                      />)
                  })
              }
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

var snapSize = 20;
var gridSize = 20;

export default CanvasPane;

// import { fabric } from "fabric";
import React, { Component } from "react";
import { editorContext, EditorContextTypes } from "../Editor";
import c from './CanvasPane.module.css'

type CanvasPanePropsTypes = {
  initFabricCanvas: Function;
  updateCanvasPaneDimensions: Function,
  dimensions: {
    width: number;
    height: number;
  };
};

class CanvasPane extends Component<CanvasPanePropsTypes> {
  static contextType = editorContext
  // context!: React.ContextType<typeof EditorContextTypes>
  // declare context: React.ContextType<typeof EditorContextTypes>

  domCanvas: HTMLCanvasElement | null;
  div: HTMLDivElement | null;
  constructor(props: CanvasPanePropsTypes) {
    super(props);
    this.domCanvas = null;
    this.div = null
  }
  componentDidMount() {
    const width = this.div?.offsetWidth
    const height = this.div?.offsetHeight
    this.props.initFabricCanvas(this.domCanvas, { width, height }, this.attatchLocalEvents)
  }

  componentDidUpdate(prevProps: CanvasPanePropsTypes, prevState: Object) {
    if (
      prevProps.dimensions.width !== this.props.dimensions.width ||
      prevProps.dimensions.height !== this.props.dimensions.height
    ) {
      return this.props.updateCanvasPaneDimensions(this.props.dimensions)
    }
  }

  attatchLocalEvents = (fabricCanvas: fabric.Canvas) => {
    // Mouse wheel zoom
    fabricCanvas.on("mouse:wheel", function (opt) {
      var delta = opt.e.deltaY;
      var zoom = fabricCanvas.getZoom() || 1;
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      var vpt = c?.viewportTransform || [];
      console.log({ vpt, zoom })
      // if (zoom < 400 / 1000) {
      //   vpt[4] = 200 - 1000 * zoom / 2;
      //   vpt[5] = 200 - 1000 * zoom / 2;
      // } else {
      //   if (vpt[4] >= 0) {
      //     vpt[4] = 0;
      //   } else if (vpt[4] < c.getWidth() - 1000 * zoom) {
      //     vpt[4] = c.getWidth() - 1000 * zoom;
      //   }
      //   if (vpt[5] >= 0) {
      //     vpt[5] = 0;
      //   } else if (vpt[5] < c.getHeight() - 1000 * zoom) {
      //     vpt[5] = c.getHeight() - 1000 * zoom;
      //   }
      // }
    });

    // Alt key canvas pan
    fabricCanvas.on('mouse:down', function (this: any, opt) {
      var evt = opt.e;
      if (evt.altKey === true) {
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    });
    fabricCanvas.on('mouse:move', function (this: any, opt) {
      if (this.isDragging) {
        var e = opt.e;
        var vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
      }
    });
    fabricCanvas.on('mouse:up', function (this: any, opt) {
      // on mouse up we want to recalculate new interaction
      // for all objects, so we call setViewportTransform
      this.setViewportTransform(this.viewportTransform);
      this.isDragging = false;
      this.selection = true;
    });
  }
  render() {
    const totalLines = 200
    const linesArray = Array.from({ length: totalLines })
    return (
      <div
        className={c.paneContainer}
        style={{ width: '100%', height: '100%' }} ref={d => this.div = d}>
        <canvas ref={(c) => (this.domCanvas = c)} />
        <div className={c.svgOverlayContainer}>
          <svg width={this.props.dimensions.width} height={this.props.dimensions.height}>
            <g transform={`matrix(${this?.context?.fabricCanvas?.viewportTransform?.toString?.() || `0, 0, 0, 0, 0, 0`})`}>
              {
                linesArray
                  .map((_, i) => {
                    return (
                      <line
                        key={`h${i}`}
                        className={c.line}
                        x1='-99999'
                        x2='99999'
                        y1={this.context.state.gridCoords.height * (i - (totalLines / 2))}
                        y2={this.context.state.gridCoords.height * (i - (totalLines / 2))}
                        stroke='orange'

                      />)
                  })
              }
              {
                linesArray
                  .map((_, i) => {
                    return (
                      <line
                        key={`v${i}`}
                        className={c.line}
                        y1='-99999'
                        y2='99999'
                        x1={this.context.state.gridCoords.width * (i - (totalLines / 2))}
                        x2={this.context.state.gridCoords.width * (i - (totalLines / 2))}
                        stroke='orange'
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

export default CanvasPane;

import { fabric } from "fabric";
import React, { Component } from "react";

type CanvasPanePropsTypes = {
  initFabricCanvas: Function;
  updateCanvasPaneDimensions: Function,
  dimensions: {
    width: number;
    height: number;
  };
};

class CanvasPane extends Component<CanvasPanePropsTypes> {
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
    this.props.initFabricCanvas(this.domCanvas, { width, height })
  }

  componentDidUpdate(prevProps: CanvasPanePropsTypes, prevState: Object) {
    if (
      prevProps.dimensions.width !== this.props.dimensions.width ||
      prevProps.dimensions.height !== this.props.dimensions.height
    ) {
      return this.props.updateCanvasPaneDimensions(this.props.dimensions)
    }
  }
  render() {
    return (
      <div style={{ width: '100%', height: '100%' }} ref={d => this.div = d}>
        <canvas ref={(c) => (this.domCanvas = c)} />
      </div>
    );
  }
}

export default CanvasPane;

import { fabric } from "fabric";
import React, { Component } from "react";

type FabricCamvasContainerProps = {
  dimensions: {
    width: number;
    height: number;
  };
};

class FabricCanvasContainer extends Component<FabricCamvasContainerProps> {
  fabricCanvas: fabric.Canvas | null;
  constructor(props: FabricCamvasContainerProps) {
    super(props);
    this.fabricCanvas = null;
  }
  componentDidMount() {
    console.log(`Mount - `, this.props.dimensions);
    this.fabricCanvas = new fabric.Canvas("c");
    this.fabricCanvas.setDimensions({
      width: 400,
      height: 400
    });
    this.fabricCanvas.add(
      new fabric.Rect({
        width: 200,
        height: 200,
        fill: "orange"
      })
    );
  }

  componentDidUpdate(prevProps: FabricCamvasContainerProps, prevState: Object) {
    if (
      prevProps.dimensions.width !== this.props.dimensions.width ||
      prevProps.dimensions.width !== this.props.dimensions.width
    ) {
      console.log("raw update size - ", this.props.dimensions);
      this.fabricCanvas?.setDimensions({
        width: this.props.dimensions.width,
        height: this.props.dimensions.height
      });
    }
  }
  render() {
    return (
      <div>
        <canvas id="c" />
      </div>
    );
  }
}

export default FabricCanvasContainer;

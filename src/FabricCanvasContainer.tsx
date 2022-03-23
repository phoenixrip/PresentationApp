import { fabric } from "fabric";
import React, { Component } from "react";

type FabricCamvasContainerProps = {
  initFabricCanvas: Function;
  dimensions: {
    width: number;
    height: number;
  };
};

class FabricCanvasContainer extends Component<FabricCamvasContainerProps> {
  domCanvas: HTMLCanvasElement | null;
  constructor(props: FabricCamvasContainerProps) {
    super(props);
    this.domCanvas = null;
  }
  componentDidMount() {
    this.props.initFabricCanvas(this.domCanvas);
  }

  // componentDidUpdate(prevProps: FabricCamvasContainerProps, prevState: Object) {
  //   if (
  //     prevProps.dimensions.width !== this.props.dimensions.width ||
  //     prevProps.dimensions.height !== this.props.dimensions.height
  //   ) {
  //     console.log("raw update size - ", this.props.dimensions);
  //     this.fabricCanvas?.setDimensions({
  //       width: this.props.dimensions.width,
  //       height: this.props.dimensions.height
  //     });
  //   }
  // }
  render() {
    return (
      <div>
        <canvas ref={(c) => (this.domCanvas = c)} />
      </div>
    );
  }
}

export default FabricCanvasContainer;

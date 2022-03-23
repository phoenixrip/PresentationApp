class SizeAwareElement extends React.Component {
  fitBounds(value, min, max) {
    return Math.max(Math.min(value, max), min);
  }

  rgbGradient(color1, color2, weight) {
    const w1 = weight;

    const w2 = 1 - w1;

    const rgb = [
      Math.round(color1[0] * w1 + color2[0] * w2),
      Math.round(color1[1] * w1 + color2[1] * w2),
      Math.round(color1[2] * w1 + color2[2] * w2)
    ];

    return rgb.map((c) => this.fitBounds(c, 0, 255));
  }

  render() {
    const { width, height } = this.props.dimensions;

    const maxWidth = window.innerWidth - 100;

    const maxHeight = 280;

    const weight = (width * height) / (maxWidth * maxHeight);

    const rgb = this.rgbGradient([0, 255, 0], [255, 0, 0], weight);

    const style = {
      background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
      color: "whitesmoke"
    };

    return (
      <div className="pane-content" style={style}>
        <label>
          I am so Size-Aware!
          <br />
          <br />
          Width: {width} px
          <br />
          x
          <br />
          Height: {height} px
        </label>
      </div>
    );
  }
}

export default SizeAwareElement;

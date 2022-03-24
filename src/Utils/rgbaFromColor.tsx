import { fabric } from 'fabric'

const rgbaFromColor = (color: string) => {
    const colorString = (new fabric.Color(color))
    const [r, g, b, a] = colorString.toRgba()
        .replace("rgba(", "")
        .replace(")", "")
        .split(",")

    return {
        r: parseInt(r),
        g: parseInt(g),
        b: parseInt(b),
        a: parseInt(a)
    }
}

export { rgbaFromColor }
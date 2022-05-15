import { InputNumber, InputNumberProps } from "antd"

function SkinnyNumberInput(props: InputNumberProps) {
  return <InputNumber style={{ ...props?.style ?? {}, width: 66 }} {...props} />
}

export { SkinnyNumberInput }
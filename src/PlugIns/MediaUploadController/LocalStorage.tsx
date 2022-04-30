import { Modal } from "antd"
import { MediaUploadControllerProps } from "./Common/types"

const LocalStorage = (props: MediaUploadControllerProps) => {
  return (
    <>
      Local storage
      <pre>{JSON.stringify(props.selectedImageOption, null, 4)}</pre>
    </>
  )
}

export { LocalStorage }
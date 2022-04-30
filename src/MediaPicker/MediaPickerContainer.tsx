import { enumStringMember } from "@babel/types"
import { faAdd, faBackward, faChevronLeft, faImage, faSearch } from "@fortawesome/free-solid-svg-icons"
import { Modal, Input, Tag, Button, Typography } from "antd"
import { useEffect, useState } from "react"
import { AppController } from "../AppController"
import { MediaUploadControllerProps } from "../PlugIns/MediaUploadController/Common/types"
import { ImageStorageHandler } from "../ProjectController"
import { useDebounce } from "../Utils/CustomHooks/useDebounce"
import { UseFaIcon } from "../Utils/UseFaIcon"
import CropTagContainer from "./CropTag/CropTagContainer"
import c from './MediaPickerContainer.module.scss'
import { ImageOptionObject, SearchContainer, SearchParams } from "./Search/SearchContainer"

interface Props {
  open: boolean,
  onCancel(): void,
  storageHandlerClass: ImageStorageHandler,
  handleInsertImage: Function
}

export interface UploadNewImageArgs {
  currentImageTags: string[],
  altText?: string,
  format: string,
  infoObject: {
    smallKB: number,
    largeKB?: number
  },
  exportVersions: {
    small: string,
    large?: string
  }
}

const MediaPickerContainer = (props: Props) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImageOption, setSelectedImageOption] = useState<ImageOptionObject | undefined>(undefined)
  const [mode, setMode] = useState('search')
  useEffect(() => {
    if (selectedImageOption && mode !== 'selected') {
      setMode('selected')
    }
  }, [selectedImageOption])

  async function handleUploadImage(uploadArgs: UploadNewImageArgs) {
    const insertableResponse = await props.storageHandlerClass.handleUploadImage(uploadArgs)
    props.handleInsertImage(insertableResponse)
  }

  function onCancel() {
    setMode('search')
    setSearchTerm('')
    return props.onCancel()
  }
  return (
    <>
      <Modal
        visible={props.open}
        width={1200}
        bodyStyle={{ height: 700 }}
        maskClosable
        onCancel={onCancel}
        footer={null}
      >
        {mode === 'search' &&
          <SearchContainer
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedImageOption={selectedImageOption}
            setSelectedImageOption={setSelectedImageOption}
          />
        }
        {mode === 'selected' &&
          <div className={c.handleSelectedWrapper}>
            <div className={c.navBarWrapper}>
              <Button
                key={'backButton'}
                type='primary'
                icon={<UseFaIcon key={'back'} icon={faChevronLeft} />}
                onClick={() => setMode('search')}
              />
              <span className={c.modeHeader}>
                Crop & tag image
              </span>
            </div>
            <div className={c.previewWrapper}>
              <CropTagContainer
                selectedImageOption={selectedImageOption}
                handleUploadImage={handleUploadImage}
              />
            </div>
          </div>
        }
      </Modal>
    </>
  )
}

// Avail apis
const apis = [
  {
    sourceApiName: 'Pixabay',
    getSearchURL(searchParams: SearchParams): string {
      return `https://pixabay.com/api/?key=8435795-313810eee26eebfe9f5501a01&q=${encodeURI(searchParams.searchString)}&per_page=${searchParams?.perPage ?? 40}`
    },
    handleResponse(response: any): ImageOptionObject[] {
      return response.hits.map((imageObject: any) => ({
        ...imageObject,
        tags: imageObject.tags.split(', '),
        previewURL: imageObject.webformatURL
      }))
    }
  }
]

export {
  MediaPickerContainer
}
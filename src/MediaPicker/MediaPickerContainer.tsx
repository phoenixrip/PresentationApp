import { faSearch } from "@fortawesome/free-solid-svg-icons"
import { Modal, Input } from "antd"
import { useEffect, useState } from "react"
import { useDebounce } from "../Utils/CustomHooks/useDebounce"
import { UseFaIcon } from "../Utils/UseFaIcon"
import c from './MediaPickerContainer.module.scss'

interface Props {
  open: boolean
}
const MediaPickerContainer = (props: Props) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<ImageOptionObject[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [currentPage, setCurrentPage] = useState(0)
  const [perPage, setPerPage] = useState(40)
  // Use effect for all avail apis
  useEffect(() => {
    if (debouncedSearchTerm) {
      console.log('SEARCH APIS EFFECT')
      setIsSearching(true);
      apis.forEach(apiObject => {
        const useURL = apiObject.getSearchURL({
          searchString: debouncedSearchTerm,
          perPage,
          page: currentPage
        })
        const fetchData = async () => {
          try {
            const response = await fetch(useURL)
            if (!response.ok) throw new Error(response.statusText)
            const data = (await response.json())
            const compiledImagesArray = apiObject.handleResponse(data)
            setResults(compiledImagesArray)
            console.log(apiObject.sourceApiName, { compiledImagesArray })
          } catch (error) {
            console.log('FETCH API ERROR')
          }
        }
        fetchData()
      })
    } else {
      console.log('RESET SEARCH APIS EFFECT')
      setResults([]);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm])

  return (
    <Modal
      visible={props.open}
      width={1200}
      maskClosable
    >
      <div className={c.bodyWrapper}>
        <div className={c.headerWrapper}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={'Enter search term'}
            addonBefore={<UseFaIcon icon={faSearch} />}
          />
        </div>
        <div className={c.optionsWrapper}>
          {results.map(imageObject => (
            <div className={c.imageOptionContainer}>
              <img key={imageObject.fullSizeURL} src={imageObject.previewURL} />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

interface SearchParams {
  searchString: string,
  perPage?: number,
  page?: number
}

interface ImageOptionObject {
  previewURL: string,
  fullSizeURL: string,
  previewWidth?: number,
  previewHeight?: number,
  imageWidth?: number,
  imageHeight?: number,
  imageSize?: number,
  tags?: Array<string>
}

// Avail apis
const apis = [
  {
    sourceApiName: 'Pixabay',
    getSearchURL(searchParams: SearchParams): string {
      return `https://pixabay.com/api/?key=8435795-313810eee26eebfe9f5501a01&q=${encodeURI(searchParams.searchString)}&per_page=${searchParams?.perPage ?? 40}`
    },
    handleResponse(response: any): ImageOptionObject[] {
      console.log('Pixabay, handleResponseToArrayOfImageObjects', response)
      return response.hits.map((imageObject: any) => ({
        ...imageObject,
        tags: imageObject.tags.split(', ')
      }))
    }
  }
]

export {
  MediaPickerContainer
}
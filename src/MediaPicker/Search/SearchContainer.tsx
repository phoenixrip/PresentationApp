import { faSearch, faSitemap } from "@fortawesome/free-solid-svg-icons"
import { Modal, Input, Tag, Popover } from "antd"
import { Button } from "antd/lib/radio"
import { useEffect, useState } from "react"
import { useDebounce } from "../../Utils/CustomHooks/useDebounce"
import { UseFaIcon } from "../../Utils/UseFaIcon"
import c from './SearchContainer.module.scss'

interface Props {
  setSelectedImageOption: React.Dispatch<React.SetStateAction<ImageOptionObject | undefined>>,
  selectedImageOption?: ImageOptionObject,
  searchTerm: string,
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>
}
const SearchContainer = (props: Props) => {
  // const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<ImageOptionObject[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(props.searchTerm, 500)
  const [currentPage, setCurrentPage] = useState(0)
  const [perPage, setPerPage] = useState(40)
  // Use effect to show search updating
  useEffect(() => {
    if (!props.searchTerm) {
      setIsSearching(false)
      setResults([])
    } else {
      setIsSearching(true)
    }
  }, [props.searchTerm])

  // debounced use effect for all avail apis
  useEffect(() => {
    if (debouncedSearchTerm) {
      apis.forEach(apiObject => {
        const useURL = apiObject.getSearchURL({
          searchString: debouncedSearchTerm,
          perPage,
          page: currentPage
        })
        const fetchData = async () => {
          try {
            console.log('fetchData')
            const response = await fetch(useURL)
            if (!response.ok) throw new Error(response.statusText)
            const data = (await response.json())
            const compiledImagesArray = apiObject.handleResponse(data)
            setResults(compiledImagesArray)
            setIsSearching(false);
            console.log(apiObject.sourceApiName, { compiledImagesArray })
          } catch (error) {
            console.log('FETCH API ERROR')
            setIsSearching(false);
          }
        }
        fetchData()
      })
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm])

  return (
    <>
      <div className={c.bodyWrapper}>
        <div className={c.headerWrapper}>
          <div className={c.searchInputWrapper}>
            <Input.Search
              allowClear
              loading={isSearching}
              size='large'
              value={props.searchTerm}
              onChange={(e) => props.setSearchTerm(e.target.value)}
              placeholder={'Search for an image...'}
              addonBefore={
                <Popover
                  trigger={['click']}
                  content={
                    <>
                      {apis.map(apiObject => (
                        <Tag key={apiObject.sourceApiName}>{apiObject.sourceApiName}</Tag>
                      ))}
                    </>
                  }>
                  <UseFaIcon icon={faSitemap} style={{ cursor: 'pointer' }} />
                </Popover>
              }
            />
          </div>
          {/* <div className={c.sourcesSelectorWrapper}>
            <span className={c.sourcesTitleSpan}>
              Sources
            </span>

          </div> */}
        </div>
        <div className={c.optionsWrapper}>
          {results.map(imageObject => (
            <div
              onClick={() => props.setSelectedImageOption(imageObject)}
              className={c.imageOptionContainer}
              key={imageObject.largeImageURL}>
              <img width='100%' key={imageObject.largeImageURL} src={imageObject.previewURL} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export interface SearchParams {
  searchString: string,
  perPage?: number,
  page?: number
}

export interface ImageOptionObject {
  previewURL: string,
  largeImageURL: string,
  previewWidth?: number,
  previewHeight?: number,
  imageWidth?: number,
  imageHeight?: number,
  imageSize?: number,
  tags?: Array<string>,
  type: string,
  formatString: string
}

// Avail apis
const apis = [
  {
    sourceApiName: 'Pixabay',
    getSearchURL(searchParams: SearchParams): string {
      return `https://pixabay.com/api/?key=8435795-313810eee26eebfe9f5501a01&q=${encodeURI(searchParams.searchString)}&per_page=${searchParams?.perPage ?? 40}`
    },
    handleResponse(response: any): ImageOptionObject[] {
      var re = /([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif|svg))/i
      // const formatString = re.exec(event.detail.prepRawImageURL)[2]
      return response.hits.map((imageObject: any) => ({
        ...imageObject,
        tags: imageObject.tags.split(', '),
        previewURL: imageObject.webformatURL,
        //@ts-ignore
        formatString: re.exec(imageObject.webformatURL)[2]
      }))
    }
  }
]

export {
  SearchContainer
}
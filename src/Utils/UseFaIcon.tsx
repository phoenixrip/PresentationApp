import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export interface UseFaIconPropTypes {
  icon: IconDefinition,
  style?: React.CSSProperties,
  // All other props
  [x: string]: any;
}
const UseFaIcon: React.FC<UseFaIconPropTypes> = (props: UseFaIconPropTypes) => {
  return (
    // <div style={props?.style || {}}>
    <FontAwesomeIcon  {...props} />
    // </div>

  )
}

export {
  UseFaIcon
}
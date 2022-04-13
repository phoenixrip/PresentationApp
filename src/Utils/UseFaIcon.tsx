import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface UseFaIconPropTypes {
  icon: IconDefinition,
  style?: React.CSSProperties
}
const UseFaIcon: React.FC<UseFaIconPropTypes> = (props: UseFaIconPropTypes) => {
  return (
    // <div style={props?.style || {}}>
    <FontAwesomeIcon icon={props.icon} />
    // </div>

  )
}

export {
  UseFaIcon
}
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface UseFaIconPropTypes {
  icon: IconDefinition
}
const UseFaIcon: React.FC<UseFaIconPropTypes> = (props: UseFaIconPropTypes) => {
  return (
    <FontAwesomeIcon icon={props.icon} />
  )
}

export {
  UseFaIcon
}
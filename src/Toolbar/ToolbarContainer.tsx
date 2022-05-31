import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

import { faChevronDown, faFont, faImage, faPlay, faPlus, faRandom, faRedo, faSquare, faTag, faTextHeight, faTextWidth, faUndo } from "@fortawesome/free-solid-svg-icons"
import { Menu, Button, ButtonProps, Dropdown } from "antd"
// import Menu from 'rc-menu/lib/Menu'

import { useContext } from "react"
import { editorContext } from "../Editor"
import { UseFaIcon } from "../Utils/UseFaIcon"
import c from './ToolbarContainer.module.css'

const ToolbarContainer = () => {
  const context = useContext(editorContext)

  return (
    <div className={c.toolbarContainer}>
      {/* <Button.Group size='small'>
        <Button onClick={(e) => context.handleUndo()}>
          <UseFaIcon icon={faUndo} />
        </Button>
        <Button onClick={(e) => context.handleRedo()}>
          <UseFaIcon icon={faRedo} />
        </Button>
      </Button.Group> */}
      <Dropdown
        trigger={['click']}
        overlay={(
          <Menu style={{ width: 300 }}>
            <Menu.Item key={'rect'}
              icon={<RectIcon />}
              onClick={e => context.addRect()}
            >Rect</Menu.Item>
            <Menu.Item key={'roundedRect'}
              icon={<RoundedRect />}
              onClick={e => context.addRoundedRect()}
            >Rounded rect</Menu.Item>
            <Menu.Item key={'ellipse'}
              icon={<EllipseIcon />}
            >!!Ellipse</Menu.Item>
            <Menu.Divider></Menu.Divider>
            <Menu.Item key={'text'}
              icon={<UseFaIcon icon={faFont} />}
              onClick={e => context.addText()}
            >Text</Menu.Item>
            <Menu.Item key={'image'}
              icon={<UseFaIcon icon={faImage} />}
              onClick={e => context.addImageFromPicker()}
            >Image</Menu.Item>
            <Menu.Item key={'svg'}
              icon={<SVGIcon />}
              onClick={e => context.addSVG()}
            >!!SVG</Menu.Item>
            <Menu.Divider></Menu.Divider>
            <Menu.SubMenu key='others' title='Others' icon={<UseFaIcon icon={faRandom} />}>
              <Menu.Item icon={<UseFaIcon icon={faTag} />} key='cLabel' onClick={e => context.addLabel()}>
                Label
              </Menu.Item>
            </Menu.SubMenu>
          </Menu>
        )}
      >
        <Button>
          <div style={{ display: 'flex' }}>
            <UseFaIcon icon={faPlus} />
            <div style={{ fontSize: 9, marginLeft: 5 }}>
              <UseFaIcon icon={faChevronDown} />
            </div>
          </div>
        </Button>
      </Dropdown>

      <CustomIconButton
        type={'primary'}
        icon={faPlay}
        onClick={e => context.handleOpenProjectPreview()}>
        Preview
      </CustomIconButton>
      <div className={c.rightContainer}></div>
    </div>
  )
}

const RectIcon = () => (
  <svg
    height="1em"
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
    style={{
      fill: 'white',
      marginRight: 8
    }}>
    <path
      fill="inherit"
      fillOpacity="0.2"
      stroke="inherit"
      strokeOpacity="0.9"
      strokeWidth="9.368"
      d="M81.117 19.226c-21.069.186-41.953.251-62.652.193v62.055h62.652V19.226z"
    ></path>
    <path
      strokeWidth="0.895"
      d="M18.303 18.268h63.404v63.404H18.303zm6.969 56.768h49.467V25.569H25.272z"
    ></path>
  </svg>
)

const RoundedRect = () => (
  <svg
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
    // width={0}
    height={'1em'}
    xmlns="http://www.w3.org/2000/svg"
    style={{
      fill: 'white',
      marginRight: 8
    }}
  // xmlns:bx="https://boxy-svg.com"
  // {...props}
  >
    <path
      d="M18.667 19.024c.186 21.069.251 41.953.193 62.652h62.055V19.024H18.667Z"
      style={{
        fill: "inherit",
        fillOpacity: 0.2,
        stroke: "inherit",
        strokeWidth: 9.368,
        strokeOpacity: 0.9,
      }}
      transform="rotate(90 49.791 50.35)"
    // bx:origin="0.5 0.5"
    />
    <rect
      x={17.5}
      y={17.5}
      width={65}
      height={65}
      rx={10}
      ry={10}
      style={{
        fill: "none",
        stroke: "white",
        strokeOpacity: 0.9,
        strokeWidth: 11,
      }}
    />
  </svg>
)
const EllipseIcon = () => (
  <svg
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
    // width={0}
    height={'1em'}
    xmlns="http://www.w3.org/2000/svg"
    style={{
      fill: 'white',
      marginRight: 8
    }}
  >
    <rect
      x={17.5}
      y={17.5}
      width={65}
      height={65}
      rx={32.5}
      ry={32.5}
      style={{
        fill: "inherit",
        fillOpacity: 0.2,
        // stroke: "inherit",
        // strokeWidth: 9.368,
        // strokeOpacity: 0.9,
      }}
    />
    <rect
      x={17.5}
      y={17.5}
      width={65}
      height={65}
      rx={32.5}
      ry={32.5}
      style={{
        fill: "none",
        stroke: "white",
        strokeOpacity: 0.9,
        strokeWidth: 11,
      }}
    />
  </svg>
)

const SVGIcon = () => (
  <svg
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
    height={'1em'}
    xmlns="http://www.w3.org/2000/svg"
    style={{
      fill: 'white',
      marginRight: 8
    }}
  >
    <rect
      x={2.5}
      y={23.5}
      width={93}
      height={55}
      rx={10}
      ry={10}
      style={{
        stroke: "#fff",
        strokeWidth: 4,
        fill: "rgb(22, 22, 22)",
      }}
    />
    <text
      style={{
        fill: "#fff",
        fontFamily: "Arial,sans-serif",
        fontSize: 37,
        letterSpacing: 1,
        // strokeWidth: "1.47684px",
        textAnchor: "middle",
        whiteSpace: "pre",
      }}
      x={50}
      y={62.831}
    >
      {"SVG"}
    </text>
  </svg>
)

interface ICustomIconButtonProps extends ButtonProps {
  icon: IconDefinition | IconDefinition[]
}
const CustomIconButton = (props: ICustomIconButtonProps) => {
  if (Array.isArray(props.icon)) {
    return (
      <Button
        {...props}
        tabIndex={-1}
        icon={<span>
          {props.icon.map(icon => <UseFaIcon icon={icon} />)}
        </span>}>
        {props.children}
      </Button>
    )
  } else {
    return (
      <Button
        {...props}
        tabIndex={-1}
        icon={<span style={{ marginRight: 6 }}><UseFaIcon icon={props.icon} /> </span>}>
        {props.children}
      </Button>
    )
  }
}

export {
  ToolbarContainer
}
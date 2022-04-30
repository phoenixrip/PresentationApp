import React, { forwardRef, HTMLAttributes, MutableRefObject, useContext, useRef, useState } from 'react';
import classNames from 'classnames';
// import { UseFaIcon } from '../Utils/UseFaIcon'
import { faBezierCurve, faCircle, faDrawPolygon, faEyeSlash, faFileText, faFolder, faFont, faImage, faLayerGroup, faLock, faMitten, faPuzzlePiece, faSlash, faTag, faTags, faTextWidth, faVectorSquare } from '@fortawesome/free-solid-svg-icons'
// import { faFolder, faVectorSquare } from '@fortawesome/free'
import { Action, Handle, Remove } from './Item/';
import styles from './TreeItem.module.css';
import { editorContext } from '../../../../EditorContext';
import { UseFaIcon } from '../../../../Utils/UseFaIcon';
import { Input } from 'antd';
import { UserSetNameInput } from './UserSetNameInput';
interface ObjIconTypes {
  [key: string]: any
}
const objIcons: ObjIconTypes = {
  'default': faMitten,
  'CRect': faVectorSquare,
  'InteractionCreatorRect': faPuzzlePiece,
  'rect': faVectorSquare,
  'FakeGroup': faFolder,
  'LabelAndTargetsGroup': faFolder,
  'group': faLayerGroup,
  'textbox': faFont,
  'text': faFont,
  'BodyTextbox': faFont,
  'path': faBezierCurve,
  'ellipse': faCircle,
  'circle': faCircle,
  'line': faSlash,
  'polyline': faDrawPolygon,
  'polygon': faDrawPolygon,
  'LabelElement': faTag,
  'ObjectLabelGroup': faTags,
  'image': faImage,
  'CustomMediaObject': faImage,
}

export interface Props extends HTMLAttributes<HTMLLIElement> {
  childCount?: number;
  clone?: boolean;
  collapsed?: boolean;
  depth: number;
  disableInteraction?: boolean;
  disableSelection?: boolean;
  ghost?: boolean;
  handleProps?: any;
  indicator?: boolean;
  indentationWidth: number;
  value: string;
  onCollapse?(): void;
  onRemove?(): void;
  wrapperRef?(node: HTMLLIElement): void;
}

export const TreeItem = forwardRef<HTMLDivElement, Props>(
  (
    {
      childCount,
      clone,
      depth,
      disableSelection,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth,
      indicator,
      collapsed,
      onCollapse,
      onRemove,
      style,
      value,
      wrapperRef,
      ...props
    },
    ref
  ) => {
    const context = useContext(editorContext)
    const inputRef = useRef(null)
    const guid = value
    const liveObject = context.liveObjectsDict[guid]
    const objectTypeKey = liveObject?.type || 'default'
    const isSelected = context.state.selectedGUIDsDict[guid]
    const isUserLocked = liveObject?.userLocked
    const isHidden = (liveObject?.visible !== undefined && liveObject?.visible !== true)

    const [editableUserSetNameValue, setEditableUserSetNameValue] = useState(liveObject?.text || liveObject.userSetName)
    const [isInEditingNameMode, setIsInEditingNameMode] = useState(false)
    // const [timeout, set] = useRef(null)
    function handleBlurUserSetNameInput() {
      liveObject.set({ userSetName: editableUserSetNameValue })
      setIsInEditingNameMode(false)
      document.body.focus()
    }
    function handleMouseDown(e: any) {
      console.log('TreeItem handleMouseDown')
      if (e.shiftKey) {
        console.log('**shift click')
      }
      // setTimeout(() => {
      //   console.log({ isInEditingNameMode })
      //   if (isInEditingNameMode) return
      //   window.focus()
      //   if (document.activeElement) {
      //     // @ts-ignore
      //     document?.activeElement?.blur()
      //   }
      // }, 600)
      context.handleSelectElementByGUID(liveObject.guid)
    }

    // function handleDoubleClick(e: any) {
    //   console.log('input double')
    //   setIsInEditingNameMode(true)
    //   // clearTimeout()
    //   //@ts-ignore
    //   inputRef.current.select()
    // }

    return (
      <li
        className={classNames(
          styles.Wrapper,
          clone && styles.clone,
          ghost && styles.ghost,
          indicator && styles.indicator,
          disableSelection && styles.disableSelection,
          disableInteraction && styles.disableInteraction
        )}
        ref={wrapperRef}
        style={
          {
            '--spacing': `${indentationWidth * depth}px`,
          } as React.CSSProperties
        }
        {...props}
      >
        <div
          className={classNames(
            styles.TreeItem,
            isSelected && styles.TreeItemSelected
          )}
          ref={ref}
          style={style}>
          {/* <Handle {...handleProps} /> */}
          <div className={styles.iconContainer} {...handleProps} onMouseDown={handleMouseDown}>
            <UseFaIcon icon={objIcons[objectTypeKey]} />
          </div>
          {onCollapse && (
            <Action
              onClick={onCollapse}
              className={classNames(
                styles.Collapse,
                collapsed && styles.collapsed
              )}
            >
              {collapseIcon}
            </Action>
          )}
          <UserSetNameInput
            liveObject={liveObject}
            triggerSelect={handleMouseDown}
            isEditable={liveObject?.text === undefined}
          />
          {/* <Input
            ref={inputRef}
            size={'small'}
            onChange={(e) => setEditableUserSetNameValue(e.target.value)}
            onBlur={handleBlurUserSetNameInput}
            onPressEnter={handleBlurUserSetNameInput}
            value={editableUserSetNameValue}
            style={{
              padding: '0px 4px',
              border: 0,
              cursor: isInEditingNameMode ? 'text' : 'pointer',
              userSelect: isInEditingNameMode ? 'text' : 'none',
            }}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            readOnly={!isInEditingNameMode}
          /> */}
          <div className={styles.actionsContainer}>
            <div className={classNames(
              styles.rightActionContainer,
              (isUserLocked ? styles.active : styles.inactive),
              styles.lockContainer
            )}
              onClick={() => liveObject.toggleUserLocked()}
            >
              <UseFaIcon icon={faLock} />
            </div>
            <div className={classNames(
              styles.rightActionContainer,
              (isHidden ? styles.active : styles.inactive),
              styles.visibilityContainer
            )}
              onClick={() => liveObject.toggleVisibility()}
            >
              <UseFaIcon icon={faEyeSlash} />
            </div>
          </div>
          {/* <span
            onMouseDown={handleMouseDown}
            className={styles.Text}>{
              liveObject?.text || liveObject.userSetName
            }</span> */}
          {/* {!clone && onRemove && <Remove onClick={onRemove} />} */}
          {clone && childCount && childCount > 1 ? (
            <span className={styles.Count}>{childCount}</span>
          ) : null}
        </div>
      </li>
    );
  }
);

const collapseIcon = (
  <svg width="10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 41">
    <path d="M30.76 39.2402C31.885 40.3638 33.41 40.995 35 40.995C36.59 40.995 38.115 40.3638 39.24 39.2402L68.24 10.2402C69.2998 9.10284 69.8768 7.59846 69.8494 6.04406C69.822 4.48965 69.1923 3.00657 68.093 1.90726C66.9937 0.807959 65.5106 0.178263 63.9562 0.150837C62.4018 0.123411 60.8974 0.700397 59.76 1.76024L35 26.5102L10.24 1.76024C9.10259 0.700397 7.59822 0.123411 6.04381 0.150837C4.4894 0.178263 3.00632 0.807959 1.90702 1.90726C0.807714 3.00657 0.178019 4.48965 0.150593 6.04406C0.123167 7.59846 0.700153 9.10284 1.75999 10.2402L30.76 39.2402Z" />
  </svg>
);

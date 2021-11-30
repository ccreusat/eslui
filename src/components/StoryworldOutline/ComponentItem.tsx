import React, { useContext } from 'react'

import { ElementId, ELEMENT_TYPE } from '../../data/types'
import {
  OnAddComponent,
  OnEditComponentTitle,
  OnRemoveComponent,
  OnSelectComponent
} from '.'

import { EditorContext } from '../../contexts/EditorContext'

import { RenderItemParams } from '@atlaskit/tree'

import { Badge, Button, Typography } from 'antd'
import {
  AlignLeftOutlined,
  DownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  PartitionOutlined,
  QuestionOutlined,
  RightOutlined
} from '@ant-design/icons'

import ContextMenu from './ContextMenu'

import styles from './styles.module.less'

const { Text } = Typography

const ComponentItem = ({
  item: { item, provided, onExpand, onCollapse, snapshot },
  onSelect,
  onAdd,
  onRemove,
  OnEditComponentTitle
}: {
  item: RenderItemParams
  onSelect: OnSelectComponent
  onAdd: OnAddComponent
  onRemove: OnRemoveComponent
  OnEditComponentTitle: OnEditComponentTitle
}) => {
  const { editor } = useContext(EditorContext)

  const componentType: ELEMENT_TYPE = item.data.type,
    componentTitle: string = item.data.title

  const componentIconClassNames = `${styles.itemIcon} ${styles.component}`

  let ExpandedIcon = () =>
      item.isExpanded ? (
        <DownOutlined className={`${styles.itemIcon}`} />
      ) : (
        <RightOutlined className={`${styles.itemIcon}`} />
      ),
    ComponentIcon =
      componentType === ELEMENT_TYPE.FOLDER
        ? () =>
            item.isExpanded ? (
              <FolderOpenOutlined className={componentIconClassNames} />
            ) : (
              <FolderOutlined className={componentIconClassNames} />
            )
        : componentType === ELEMENT_TYPE.SCENE
        ? () => <PartitionOutlined className={componentIconClassNames} />
        : componentType === ELEMENT_TYPE.PASSAGE
        ? () => (
            <AlignLeftOutlined
              className={`${componentIconClassNames} ${styles.passage}`}
            />
          )
        : () => <QuestionOutlined className={componentIconClassNames} />

  let compositeSelectionStyles: string[] = []

  if (item.data.selected && !snapshot.isDragging)
    compositeSelectionStyles.push(styles.selected)
  if (item.id === editor.selectedComponentEditorSceneViewPassage)
    compositeSelectionStyles.push(styles.sceneComponentSelected)

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`${styles.itemRow} ${compositeSelectionStyles.join(' ')}`}
      onClick={(event) => {
        event.stopPropagation()
        if (!item.data.renaming) onSelect(item.id as ElementId)
      }}
      onContextMenu={(event) => event.stopPropagation()}
    >
      {snapshot.isDragging && (
        <div className={styles.dragging}>
          <span className={styles.draggingTitle}>{componentTitle}</span>
        </div>
      )}

      {!snapshot.isDragging && (
        <ContextMenu
          component={{
            id: item.id as string,
            title: componentTitle,
            type: componentType,
            disabled: item.data.renaming || false,
            onAdd,
            onRemove,
            OnEditComponentTitle: () =>
              OnEditComponentTitle(item.id as string, undefined, false)
          }}
        >
          <div>
            {componentType !== ELEMENT_TYPE.PASSAGE && (
              <Button
                type="text"
                size="small"
                onClick={(event) => {
                  event.stopPropagation()
                  if (!item.data.renaming)
                    item.isExpanded ? onCollapse(item.id) : onExpand(item.id)
                }}
              >
                <ExpandedIcon />
              </Button>
            )}
            <ComponentIcon />
            {item.data.renaming && (
              <Text
                editable={{
                  editing: item.data.renaming,
                  onChange: (title) =>
                    OnEditComponentTitle(item.id as string, title, true)
                }}
              >
                {componentTitle || `New ${componentType}`}
              </Text>
            )}
            {!item.data.renaming && (
              <Text ellipsis className={styles.title}>
                {componentTitle}
              </Text>
            )}{' '}
            {!item.isExpanded && !item.data.renaming && (
              <Badge
                count={item.children.length}
                size="small"
                className={styles.badge}
              />
            )}
          </div>
        </ContextMenu>
      )}
    </div>
  )
}

export default ComponentItem

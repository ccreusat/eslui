import React from 'react'

import { ElementId, ELEMENT_TYPE } from '../../data/types'
import { OnAddComponent } from '.'
import { OnEditComponentTitle, OnRemoveComponent } from '.'

import { Dropdown, Menu } from 'antd'

const ContextMenu: React.FC<{
  component: {
    id: ElementId
    type: ELEMENT_TYPE
    title: string
    disabled: boolean
    onAdd: OnAddComponent
    onRemove: OnRemoveComponent
    OnEditComponentTitle: OnEditComponentTitle
  }
}> = ({
  children,
  component: {
    id,
    type,
    title,
    disabled,
    onAdd,
    onRemove,
    OnEditComponentTitle
  }
}) => {
  const menuItems: React.ReactElement[] = []

  switch (type) {
    case ELEMENT_TYPE.GAME:
      menuItems.push(
        <Menu.Item
          key={`${id}-add-folder`}
          onClick={() => onAdd(id, ELEMENT_TYPE.FOLDER)}
        >
          Add Folder to '{title}'
        </Menu.Item>
      )

      break
    case ELEMENT_TYPE.FOLDER:
      menuItems.push(
        <Menu.Item
          key={`${id}-add-folder`}
          onClick={() => onAdd(id, ELEMENT_TYPE.FOLDER)}
        >
          Add Folder to '{title}'
        </Menu.Item>
      )

      menuItems.push(
        <Menu.Item
          key={`${id}-add-scene`}
          onClick={() => onAdd(id, ELEMENT_TYPE.SCENE)}
        >
          Add Scene to '{title}'
        </Menu.Item>
      )

      break
    case ELEMENT_TYPE.SCENE:
      menuItems.push(
        <Menu.Item
          key={`${id}-add`}
          onClick={() => onAdd(id, ELEMENT_TYPE.PASSAGE)}
        >
          Add Event to '{title}'
        </Menu.Item>
      )

      break
    case ELEMENT_TYPE.PASSAGE:
      break
    default:
      break
  }

  if (type !== ELEMENT_TYPE.GAME) {
    menuItems.push(
      <Menu.Item
        key={`${id}-rename`}
        onClick={() => OnEditComponentTitle(id, undefined, false)}
      >
        Rename '{title}'
      </Menu.Item>
    )

    menuItems.push(
      <Menu.Item key={`${id}-remove`} onClick={() => onRemove(id)}>
        Remove '{title}'
      </Menu.Item>
    )
  }

  return (
    <>
      {!disabled && (
        <Dropdown
          overlay={
            <Menu onClick={(event) => event.domEvent.stopPropagation()}>
              {menuItems.map((item) => item)}
            </Menu>
          }
          trigger={['contextMenu']}
        >
          {children}
        </Dropdown>
      )}

      {disabled && <>{children}</>}
    </>
  )
}

export default ContextMenu

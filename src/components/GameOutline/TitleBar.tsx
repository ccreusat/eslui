import logger from '../../lib/logger'
import getGameDataJSON from '../../lib/getGameDataJSON'

import React, { useContext, useState } from 'react'
import { useHistory } from 'react-router'

import { COMPONENT_TYPE, Game, GameId, StudioId } from '../../data/types'

import { AppContext, APP_LOCATION } from '../../contexts/AppContext'
import { EditorContext, EDITOR_ACTION_TYPE } from '../../contexts/EditorContext'

import { Button, Tooltip } from 'antd'
import {
  EditOutlined,
  ExportOutlined,
  LeftOutlined,
  PlusOutlined
} from '@ant-design/icons'

import { ExportJSONModal, SaveGameModal } from '../Modal'

import styles from './styles.module.less'

const TitleBar: React.FC<{
  studioId: StudioId
  game: Game
  onAdd: (gameId: GameId) => void
}> = ({ studioId, game, onAdd }) => {
  const history = useHistory()

  const { app } = useContext(AppContext),
    { editor, editorDispatch } = useContext(EditorContext)

  const [editGameModalVisible, setEditGameModalVisible] = useState(false),
    [exportJSONModalVisible, setExportJSONModalVisible] = useState(false)

  async function onExportGameDataAsJSON() {
    if (game.id) {
      setExportJSONModalVisible(true)

      const json = await getGameDataJSON(studioId, game.id, app.version),
        element = document.createElement('a'),
        file = new Blob([json], { type: 'text/json' })

      element.href = URL.createObjectURL(file)
      element.download = `${game.title.trim()}.json`

      setTimeout(() => {
        element.click()

        setExportJSONModalVisible(false)
      }, 1000)
    }
  }

  return (
    <>
      <SaveGameModal
        visible={editGameModalVisible}
        onSave={({ id, title }) => {
          if (id && title) {
            logger.info('EDITOR_ACTION_TYPE.COMPONENT_RENAME dispatch')

            editorDispatch({
              type: EDITOR_ACTION_TYPE.COMPONENT_RENAME,
              renamedComponent: {
                id,
                newTitle: title,
                type: COMPONENT_TYPE.GAME
              }
            })
          }
        }}
        onCancel={() => setEditGameModalVisible(false)}
        afterClose={() => setEditGameModalVisible(false)}
        studioId={studioId}
        game={game}
        edit
      />

      <ExportJSONModal visible={exportJSONModalVisible} />

      <div className={styles.TitleBar}>
        <Tooltip
          title="Back to Dashboard"
          placement="right"
          align={{ offset: [-10, 0] }}
          mouseEnterDelay={1}
        >
          <Button
            onClick={() => history.push(APP_LOCATION.DASHBOARD)}
            type="link"
            className={styles.dashboardButton}
          >
            <LeftOutlined />
          </Button>
        </Tooltip>

        <span>{game.title}</span>

        <div className={styles.gameButtons}>
          <Tooltip
            title="Export game as JSON"
            placement="right"
            align={{ offset: [-6, 0] }}
            mouseEnterDelay={1}
          >
            <Button onClick={onExportGameDataAsJSON} type="link">
              <ExportOutlined />
            </Button>
          </Tooltip>

          <Tooltip
            title="Edit Game Details..."
            placement="right"
            align={{ offset: [-6, 0] }}
            mouseEnterDelay={1}
          >
            <Button onClick={() => setEditGameModalVisible(true)} type="link">
              <EditOutlined />
            </Button>
          </Tooltip>

          <Tooltip
            title="Add Chapter"
            placement="right"
            align={{ offset: [-6, 0] }}
            mouseEnterDelay={1}
          >
            <Button onClick={() => onAdd(game.id as GameId)} type="link">
              <PlusOutlined />
            </Button>
          </Tooltip>
        </div>
      </div>
    </>
  )
}

export default TitleBar

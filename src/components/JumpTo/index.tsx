import logger from '../../lib/logger'

import React, { useContext, useEffect, useState } from 'react'

import {
  ElementId,
  ELEMENT_TYPE,
  WorldId,
  Event,
  Scene,
  StudioId
} from '../../data/types'

import { useJump, usePassagesBySceneRef, useScenes } from '../../hooks'

import { EditorContext, EDITOR_ACTION_TYPE } from '../../contexts/EditorContext'

import { Button, Divider, Select } from 'antd'
import { RollbackOutlined } from '@ant-design/icons'

import styles from './styles.module.less'

import api from '../../api'

const JumpSelect: React.FC<{
  studioId: StudioId
  gameId?: WorldId
  sceneId?: ElementId
  selectedId: ElementId | undefined
  onChangeRoutePart: (
    componentType: ELEMENT_TYPE,
    componentId: ElementId | null
  ) => Promise<void>
}> = ({ studioId, gameId, sceneId, selectedId, onChangeRoutePart }) => {
  let scenes: Scene[] | undefined = gameId
      ? useScenes(studioId, gameId, [gameId])
      : undefined,
    passages: Event[] | undefined = sceneId
      ? usePassagesBySceneRef(studioId, sceneId, [sceneId])
      : undefined

  const [selectedSceneId, setSelectedSceneId] = useState<ElementId | undefined>(
      undefined
    ),
    [selectedPassageId, setSelectedPassageId] = useState<ElementId | undefined>(
      undefined
    )

  async function onChange(componentId: string) {
    gameId && (await onChangeRoutePart(ELEMENT_TYPE.SCENE, componentId))

    sceneId && (await onChangeRoutePart(ELEMENT_TYPE.PASSAGE, componentId))
  }

  useEffect(() => {
    logger.info(`JumpSelect->scenes->useEffect`)

    scenes &&
      setSelectedSceneId(scenes.find((scene) => scene.id === selectedId)?.id)
  }, [scenes, selectedId])

  useEffect(() => {
    logger.info(`JumpSelect->passages->useEffect`)

    passages &&
      setSelectedPassageId(
        passages.find((passage) => passage.id === selectedId)?.id
      )
  }, [passages, selectedId])

  // TODO: abstract
  return (
    <div className={styles.JumpSelect}>
      {scenes && scenes.length > 0 && (
        <>
          <Divider>
            <h2>Scene</h2>
          </Divider>

          <div className={`${styles.selectWrapper} nodrag`}>
            {selectedSceneId && (
              <>
                <Select value={selectedSceneId} onChange={onChange}>
                  {scenes.map(
                    (scene) =>
                      scene.id && (
                        <Select.Option value={scene.id} key={scene.id}>
                          {scene.title}
                        </Select.Option>
                      )
                  )}
                </Select>

                <Button className={styles.rollBackBtn}>
                  <RollbackOutlined
                    onClick={() => onChangeRoutePart(ELEMENT_TYPE.SCENE, null)}
                  />
                </Button>
              </>
            )}
          </div>
        </>
      )}

      {passages && passages.length > 0 && (
        <>
          <Divider>
            <h2>Event</h2>
          </Divider>

          <div className={`${styles.selectWrapper} nodrag`}>
            {selectedPassageId && (
              <>
                <Select value={selectedPassageId} onChange={onChange}>
                  {passages.map(
                    (passage) =>
                      passage.id && (
                        <Select.Option value={passage.id} key={passage.id}>
                          {passage.title}
                        </Select.Option>
                      )
                  )}
                </Select>

                <Button className={styles.rollBackBtn}>
                  <RollbackOutlined
                    onClick={() =>
                      onChangeRoutePart(ELEMENT_TYPE.PASSAGE, null)
                    }
                  />
                </Button>
              </>
            )}

            {!selectedPassageId && (
              <Button
                onClick={async () => {
                  if (passages) {
                    const scene = await api().scenes.getScene(
                      studioId,
                      passages[0].sceneId
                    )

                    onChange(scene.children[0][1])
                  }
                }}
                className={`${styles.jumpToBtn} nodrag`}
              >
                Jump to Event
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const JumpTo: React.FC<{
  studioId: StudioId
  jumpId: ElementId
  onRemove?: (jumpId: ElementId) => Promise<void>
}> = ({ studioId, jumpId, onRemove }) => {
  const jump = useJump(studioId, jumpId, [studioId, jumpId])

  const { editor, editorDispatch } = useContext(EditorContext)

  async function onChangeRoutePart(
    componentType: ELEMENT_TYPE,
    componentId: ElementId | null
  ) {
    if (jump?.id) {
      switch (componentType) {
        case ELEMENT_TYPE.SCENE:
          componentId &&
            (await api().jumps.saveJumpRoute(studioId, jump.id, [componentId]))

          if (!componentId) {
            if (editor.selectedComponentEditorSceneViewJump) {
              editorDispatch({
                type:
                  EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_TOTAL_SELECTED_JUMPS,
                totalComponentEditorSceneViewSelectedJumps: 0
              })

              editorDispatch({
                type:
                  EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_JUMP,
                selectedComponentEditorSceneViewJump: null
              })
            }

            await api().worlds.saveJumpRefToGame(studioId, jump.gameId, null)

            await api().jumps.removeJump(studioId, jump.id)

            onRemove && (await onRemove(jumpId))
          }
          break
        case ELEMENT_TYPE.PASSAGE:
          await api().jumps.saveJumpRoute(
            studioId,
            jump.id,
            componentId ? [jump.route[0], componentId] : [jump.route[0]]
          )
          break
        default:
          break
      }
    }
  }

  return (
    <div className={styles.JumpTo}>
      {jump && (
        <>
          {/* Scene */}
          {jump.route[0] && (
            <JumpSelect
              studioId={studioId}
              gameId={jump.gameId}
              selectedId={jump.route[0]}
              onChangeRoutePart={onChangeRoutePart}
            />
          )}

          {/* Passage */}
          {jump.route[0] && (
            <JumpSelect
              studioId={studioId}
              sceneId={jump.route[0]}
              selectedId={jump.route[1]}
              onChangeRoutePart={onChangeRoutePart}
            />
          )}
        </>
      )}
    </div>
  )
}

export default JumpTo

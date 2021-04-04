import logger from '../../../lib/logger'

import React, { memo, useContext, useEffect, useState } from 'react'
import { cloneDeep } from 'lodash'
import { v4 as uuid } from 'uuid'

import { useStoreState, useStoreActions } from 'react-flow-renderer'

import { Choice, ComponentId, Route, StudioId } from '../../../data/types'

import {
  useChoice,
  useChoicesByPassageRef,
  usePassage,
  useRoutesByChoiceRef,
  useRoutesBySceneRef
} from '../../../hooks'

import {
  uniqueNamesGenerator,
  adjectives,
  animals,
  colors
} from 'unique-names-generator'

import { Handle, Position, NodeProps, Connection } from 'react-flow-renderer'

import { Dropdown, Menu } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

import styles from './styles.module.less'

import api from '../../../api'
import {
  EditorContext,
  EDITOR_ACTION_TYPE
} from '../../../contexts/EditorContext'

const ChoiceRow: React.FC<{
  studioId: StudioId
  choiceId: ComponentId
  title: string
  showDivider: boolean
  handle: JSX.Element
  selected: boolean
  onSelect: (passageId: ComponentId, choiceId: ComponentId) => void
  onDelete: (choiceId: ComponentId, outgoingRoutes: Route[]) => void
}> = ({
  studioId,
  choiceId,
  title,
  showDivider = true,
  handle,
  selected = false,
  onSelect,
  onDelete
}) => {
  const choice = useChoice(studioId, choiceId),
    outgoingRoutes = useRoutesByChoiceRef(studioId, choiceId)

  return (
    <div
      className={`${styles.choiceRow} nodrag ${
        selected && styles.choiceSelected
      }`}
      style={{
        borderBottom: showDivider ? '1px solid hsl(0, 0%, 15%)' : 'none'
      }}
      onClick={() => {
        choice &&
          choice.passageId &&
          choice.id &&
          onSelect(choice.passageId, choice.id)
      }}
    >
      <Dropdown
        trigger={['contextMenu']}
        overlay={
          <Menu>
            <Menu.Item
              onClick={(event) => {
                event.domEvent.stopPropagation()

                onDelete(choiceId, outgoingRoutes || [])
              }}
            >
              Remove Choice...
            </Menu.Item>
          </Menu>
        }
      >
        <div>{title}</div>
      </Dropdown>
      {handle}
    </div>
  )
}

const PassageHandle: React.FC<{
  studioId: StudioId
  sceneId: ComponentId
  passageId: ComponentId
}> = ({ studioId, sceneId, passageId }) => {
  // TODO: do we really need to get access to routes on every passage?
  const routes = useRoutesBySceneRef(studioId, sceneId)

  return (
    <Handle
      type="target"
      id={passageId}
      className={styles.passageHandle}
      style={{ top: '50%', bottom: '50%' }}
      position={Position.Left}
      isValidConnection={(connection: Connection): boolean => {
        logger.info('isValidConnection')

        if (
          routes &&
          !routes.find(
            (route) =>
              route.choiceId === connection.sourceHandle &&
              route.destinationId === connection.target
          )
        ) {
          logger.info(
            `Route possible from choice: ${connection.sourceHandle} to passage: ${connection.target}`
          )
          return true
        } else {
          logger.info('Duplicate route not possible.')
          return false
        }
      }}
    ></Handle>
  )
}

const ChoiceHandle: React.FC<{
  studioId: StudioId
  sceneId: ComponentId
  choiceId: ComponentId
}> = ({ studioId, sceneId, choiceId }) => {
  // TODO: do we really need to get access to routes on every choice?
  const routes = useRoutesBySceneRef(studioId, sceneId)

  return (
    <Handle
      key={choiceId}
      type="source"
      className={styles.choiceHandle}
      style={{ top: '50%', bottom: '50%' }}
      position={Position.Right}
      id={choiceId}
      isValidConnection={(connection: Connection): boolean => {
        logger.info('isValidConnection')

        if (
          routes &&
          !routes.find(
            (route) =>
              route.choiceId === connection.sourceHandle &&
              route.destinationId === connection.target
          )
        ) {
          logger.info(
            `Route possible from choice: ${connection.sourceHandle} to passage: ${connection.target}`
          )
          return true
        } else {
          logger.info('Duplicate route not possible.')
          return false
        }
      }}
    ></Handle>
  )
}

const PassageNode: React.FC<NodeProps<{
  studioId: StudioId
  sceneId: ComponentId
  passageId: ComponentId
}>> = ({ data }) => {
  const passage = usePassage(data.studioId, data.passageId),
    choicesByPassageRef = useChoicesByPassageRef(data.studioId, data.passageId)

  const passageNodes = useStoreState((state) => state.nodes),
    setSelectedElement = useStoreActions(
      (actions) => actions.setSelectedElements
    )

  const { editor, editorDispatch } = useContext(EditorContext)

  const [choices, setChoices] = useState<
    { id: ComponentId; title: string; handle: JSX.Element }[]
  >([])

  useEffect(() => {
    if (choicesByPassageRef) {
      setChoices(
        // @ts-ignore
        choicesByPassageRef
          .filter(
            (choice): choice is Choice => choice && choice.id !== undefined
          )
          .map((choice) => {
            if (!choice.id)
              throw new Error('Unable to generate handle. Missing choice ID.')

            return {
              id: choice.id,
              title: choice.title,
              handle: (
                <ChoiceHandle
                  studioId={data.studioId}
                  sceneId={data.sceneId}
                  choiceId={choice.id}
                />
              )
            }
          })
      )
    }
  }, [choicesByPassageRef])

  return (
    <div className={styles.passageNode} key={passage?.id}>
      {passage && passage.id ? (
        <>
          <div
            onMouseDown={() => {
              logger.info(`onClick: passage: ${passage.id}`)

              passage.id &&
                editorDispatch({
                  type:
                    EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_PASSAGE,
                  selectedComponentEditorSceneViewPassage: passage.id
                })

              if (
                passage.id !== editor.selectedComponentEditorSceneViewPassage
              ) {
                editorDispatch({
                  type:
                    EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_CHOICE,
                  selectedComponentEditorSceneViewChoice: null
                })
              }
            }}
          >
            <PassageHandle
              studioId={data.studioId}
              sceneId={data.sceneId}
              passageId={passage.id}
            />

            <h1>{passage.title}</h1>
          </div>

          <div className={styles.choices}>
            {choices
              .sort(
                (a, b) =>
                  passage.choices.findIndex((choiceId) => a.id === choiceId) -
                  passage.choices.findIndex((choiceId) => b.id === choiceId)
              )
              .map((choice, index) => {
                return (
                  <>
                    {choice.id && (
                      <ChoiceRow
                        key={choice.id}
                        studioId={data.studioId}
                        choiceId={choice.id}
                        title={choice.title}
                        showDivider={choices.length - 1 !== index}
                        handle={choice.handle}
                        selected={
                          editor.selectedComponentEditorSceneViewChoice ===
                          choice.id
                        }
                        onSelect={(passageId, choiceId) => {
                          if (
                            !editor.selectedComponentEditorComponents.find(
                              (selectedComponent) => {
                                selectedComponent.id === choiceId
                              }
                            )
                          ) {
                            logger.info(
                              `PassageNode->onClick: choice: ${choiceId}`
                            )

                            setSelectedElement([
                              cloneDeep(
                                passageNodes.find(
                                  (passageNode) => passageNode.id === passageId
                                )
                              )
                            ])

                            editorDispatch({
                              type:
                                EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_PASSAGE,
                              selectedComponentEditorSceneViewPassage: passageId
                            })

                            editor.selectedComponentEditorSceneViewPassage ===
                              passageId &&
                              editorDispatch({
                                type:
                                  EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_CHOICE,
                                selectedComponentEditorSceneViewChoice:
                                  editor.selectedComponentEditorSceneViewChoice !==
                                  choice.id
                                    ? choiceId
                                    : null
                              })
                          }
                        }}
                        onDelete={async (choiceId, outgoingRoutes) => {
                          try {
                            editor.selectedComponentEditorSceneViewChoice ===
                              choice.id &&
                              editorDispatch({
                                type:
                                  EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_CHOICE,
                                selectedComponentEditorSceneViewChoice: null
                              })

                            const clonedChoices = cloneDeep(choices),
                              foundChoiceIndex = clonedChoices.findIndex(
                                (clonedChoice) => clonedChoice.id === choiceId
                              )

                            if (foundChoiceIndex !== -1) {
                              await Promise.all(
                                outgoingRoutes.map(async (outgoingRoute) => {
                                  if (!outgoingRoute.id)
                                    throw new Error(
                                      'Unable to remove route. Missing ID'
                                    )

                                  await api().routes.removeRoute(
                                    data.studioId,
                                    outgoingRoute.id
                                  )
                                })
                              )

                              await api().choices.removeChoice(
                                data.studioId,
                                clonedChoices[foundChoiceIndex].id
                              )

                              clonedChoices.splice(foundChoiceIndex, 1)

                              await api().passages.saveChoiceRefsToPassage(
                                data.studioId,
                                data.passageId,
                                clonedChoices.map(
                                  (clonedChoice) => clonedChoice.id
                                )
                              )
                            }
                          } catch (error) {
                            throw new Error(error)
                          }
                        }}
                      />
                    )}
                  </>
                )
              })}
          </div>

          <div
            className={`${styles.addChoiceButton} nodrag`}
            onClick={async () => {
              if (
                editor.selectedComponentEditorSceneViewPassage === passage.id
              ) {
                try {
                  const choiceId = uuid()

                  passage.id &&
                    setSelectedElement([
                      { id: passage.id, type: 'passageNode' }
                    ])

                  await api().passages.saveChoiceRefsToPassage(
                    data.studioId,
                    data.passageId,
                    [...passage.choices, choiceId]
                  )

                  await api().choices.saveChoice(data.studioId, {
                    id: choiceId,
                    gameId: passage.gameId,
                    passageId: data.passageId,
                    title: uniqueNamesGenerator({
                      dictionaries: [adjectives, animals, colors],
                      separator: ' ',
                      length: 2
                    }),
                    goto: [],
                    conditions: [],
                    tags: []
                  })

                  editorDispatch({
                    type:
                      EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_CHOICE,
                    selectedComponentEditorSceneViewChoice: choiceId
                  })
                } catch (error) {
                  throw new Error(error)
                }
              } else {
                passage.id &&
                  setSelectedElement([
                    { id: passage.id, type: 'passageNode' }
                  ]) &&
                  editorDispatch({
                    type:
                      EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_PASSAGE,
                    selectedComponentEditorSceneViewPassage: passage.id
                  }) &&
                  editorDispatch({
                    type:
                      EDITOR_ACTION_TYPE.COMPONENT_EDITOR_SCENE_VIEW_SELECT_CHOICE,
                    selectedComponentEditorSceneViewChoice: null
                  })
              }
            }}
          >
            <PlusOutlined />
          </div>
        </>
      ) : (
        <div>...</div>
      )}
    </div>
  )
}

export default memo(PassageNode)

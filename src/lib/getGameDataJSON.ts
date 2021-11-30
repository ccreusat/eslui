import {
  ElementId,
  WorldId,
  StudioId,
  GameDataJSON,
  GameChildRefs,
  FolderChildRefs,
  FolderParentRef,
  ELEMENT_TYPE,
  EVENT_TYPE,
  SceneChildRefs,
  SceneParentRef
} from './transport/types/0.5.1'

import api from '../api'

export default async (
  studioId: StudioId,
  gameId: WorldId,
  schemaVersion: string
): Promise<string> => {
  try {
    const studio = await api().studios.getStudio(studioId),
      game = await api().worlds.getGame(studioId, gameId)

    const choices = await api().choices.getChoicesByGameRef(studioId, gameId),
      conditions = await api().conditions.getConditionsByGameRef(
        studioId,
        gameId
      ),
      effects = await api().effects.getEffectsByGameRef(studioId, gameId),
      folders = await api().folders.getFoldersByGameRef(studioId, gameId),
      inputs = await api().inputs.getInputsByGameRef(studioId, gameId),
      jumps = await api().jumps.getJumpsByGameRef(studioId, gameId),
      routes = await api().routes.getRoutesByGameRef(studioId, gameId),
      passages = await api().passages.getPassagesByGameRef(studioId, gameId),
      scenes = await api().scenes.getScenesByGameRef(studioId, gameId),
      variables = await api().variables.getVariablesByGameRef(studioId, gameId)

    let gameData: GameDataJSON = {
      _: {
        children: game.children as GameChildRefs,
        copyright: game.copyright,
        description: game.description,
        designer: game.designer,
        engine: schemaVersion,
        id: game.id as ElementId,
        jump: game.jump,
        schema: `https://elmstory.com/schema/elm-story-${schemaVersion}.json`,
        studioId: studioId,
        studioTitle: studio?.title as string,
        tags: game.tags,
        title: game.title,
        updated: game.updated as number,
        version: game.version,
        website: game.website
      },
      choices: {},
      conditions: {},
      effects: {},
      folders: {},
      inputs: {},
      jumps: {},
      passages: {},
      routes: {},
      scenes: {},
      variables: {}
    }

    choices.map(
      ({ id, passageId, tags, title, updated }) =>
        (gameData.choices[id as string] = {
          id: id as string,
          passageId,
          tags,
          title,
          updated: updated as number
        })
    )

    conditions.map(
      ({ compare, id, routeId, tags, title, updated, variableId }) =>
        (gameData.conditions[id as string] = {
          compare: [compare[0], compare[1], compare[2]],
          id: id as string,
          routeId,
          tags,
          title,
          updated: updated as number,
          variableId
        })
    )

    effects.map(
      ({ id, routeId, set, tags, title, updated, variableId }) =>
        (gameData.effects[id as string] = {
          id: id as string,
          routeId,
          set,
          tags,
          title,
          updated: updated as number,
          variableId
        })
    )

    folders.map(
      ({ children, id, parent, tags, title, updated }) =>
        (gameData.folders[id as string] = {
          children: children as FolderChildRefs,
          id: id as string,
          parent: parent as FolderParentRef,
          tags,
          title,
          updated: updated as number
        })
    )

    inputs.map(
      ({ id, passageId, tags, title, updated, variableId }) =>
        (gameData.inputs[id as string] = {
          id: id as string,
          passageId,
          tags,
          title,
          updated: updated as number,
          variableId
        })
    )

    jumps.map(
      ({ editor, id, route, sceneId, tags, title, updated }) =>
        (gameData.jumps[id as string] = {
          editor,
          id: id as string,
          route,
          sceneId,
          tags,
          title,
          updated: updated as number
        })
    )

    passages.map(
      ({
        choices,
        content,
        editor,
        gameOver,
        id,
        input,
        sceneId,
        tags,
        title,
        type,
        updated
      }) =>
        (gameData.passages[id as string] = {
          choices,
          content,
          editor,
          gameOver,
          id: id as string,
          input,
          sceneId,
          tags,
          title,
          type,
          updated: updated as number
        })
    )

    routes.map(
      ({
        choiceId,
        destinationId,
        destinationType,
        id,
        inputId,
        originId,
        originType,
        sceneId,
        tags,
        title,
        updated
      }) =>
        (gameData.routes[id as string] = {
          choiceId,
          destinationId,
          destinationType: destinationType as ELEMENT_TYPE,
          id: id as string,
          inputId,
          originId,
          originType: originType as ELEMENT_TYPE | EVENT_TYPE,
          sceneId,
          tags,
          title,
          updated: updated as number
        })
    )

    scenes.map(
      ({ children, editor, id, jumps, parent, tags, title, updated }) =>
        (gameData.scenes[id as string] = {
          children: children as SceneChildRefs,
          editor,
          id: id as string,
          jumps,
          parent: parent as SceneParentRef,
          tags,
          title,
          updated: updated as number
        })
    )

    variables.map(
      ({ id, initialValue, tags, title, type, updated }) =>
        (gameData.variables[id as string] = {
          id: id as string,
          initialValue,
          tags,
          title,
          type,
          updated: updated as number
        })
    )

    return JSON.stringify(gameData, null, 2)
  } catch (error) {
    throw error
  }
}

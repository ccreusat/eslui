import { LibraryDatabase, LIBRARY_TABLE } from '../db'
import { v4 as uuid } from 'uuid'

import { Descendant } from 'slate'
import {
  Event,
  ElementId,
  StudioId,
  WorldId,
  EVENT_TYPE,
  CharacterRefs,
  CharacterMask,
  CHARACTER_MASK_TYPE
} from '../data/types'

import api from '.'

export async function getPassage(studioId: StudioId, passageId: ElementId) {
  try {
    return await new LibraryDatabase(studioId).getPassage(passageId)
  } catch (error) {
    throw error
  }
}

export async function savePassage(
  studioId: StudioId,
  passage: Event
): Promise<Event> {
  if (!passage.id) passage.id = uuid()

  try {
    return await new LibraryDatabase(studioId).savePassage(passage)
  } catch (error) {
    throw error
  }
}

export async function removePassage(studioId: StudioId, passageId: ElementId) {
  try {
    await new LibraryDatabase(studioId).removePassage(passageId)
  } catch (error) {
    throw error
  }
}

export async function getPassagesByGameRef(
  studioId: StudioId,
  gameId: WorldId
): Promise<Event[]> {
  try {
    return await new LibraryDatabase(studioId).getPassagesByGameRef(gameId)
  } catch (error) {
    throw error
  }
}

export async function savePassageTitle(
  studioId: StudioId,
  passageId: ElementId,
  title: string
) {
  try {
    await new LibraryDatabase(studioId).saveComponentTitle(
      passageId,
      LIBRARY_TABLE.PASSAGES,
      title
    )
  } catch (error) {
    throw error
  }
}

export async function savePassageType(
  studioId: StudioId,
  passageId: ElementId,
  type: EVENT_TYPE
) {
  try {
    await new LibraryDatabase(studioId).savePassageType(passageId, type)
  } catch (error) {
    throw error
  }
}

export async function savePassageInput(
  studioId: StudioId,
  passageId: ElementId,
  inputId?: ElementId
) {
  try {
    await new LibraryDatabase(studioId).savePassageInput(passageId, inputId)
  } catch (error) {
    throw error
  }
}

export async function savePassageContent(
  studioId: StudioId,
  passageId: ElementId,
  contentObject: Descendant[]
) {
  try {
    await new LibraryDatabase(studioId).savePassageContent(
      passageId,
      JSON.stringify(contentObject)
    )
  } catch (error) {
    throw error
  }
}

export async function saveSceneRefToPassage(
  studioId: StudioId,
  sceneId: ElementId,
  passageId: ElementId
) {
  try {
    await new LibraryDatabase(studioId).saveSceneRefToPassage(
      sceneId,
      passageId
    )
  } catch (error) {
    throw error
  }
}

export async function saveChoiceRefsToPassage(
  studioId: StudioId,
  passageId: ElementId,
  choices: ElementId[]
) {
  try {
    await new LibraryDatabase(studioId).saveChoiceRefsToPassage(
      passageId,
      choices
    )
  } catch (error) {
    throw error
  }
}

export async function switchPassageFromChoiceToInputType(
  studioId: StudioId,
  passage: Event
) {
  if (passage && passage.id) {
    try {
      const foundPassthroughRoutes = await api().routes.getPassthroughRoutesByPassageRef(
        studioId,
        passage.id
      )

      await Promise.all([
        foundPassthroughRoutes.map(async (foundRoute) => {
          foundRoute.id &&
            foundRoute.choiceId === undefined &&
            api().routes.removeRoute(studioId, foundRoute.id)
        }),
        passage.choices.map(
          async (choiceId) =>
            await api().choices.removeChoice(studioId, choiceId)
        ),
        api().passages.saveChoiceRefsToPassage(studioId, passage.id, []),
        api().passages.savePassageType(studioId, passage.id, EVENT_TYPE.INPUT)
      ])

      const input = await api().inputs.saveInput(studioId, {
        gameId: passage.gameId,
        passageId: passage.id,
        tags: [],
        title: 'Untitled Input',
        variableId: undefined
      })

      input.id &&
        (await api().passages.savePassageInput(studioId, passage.id, input.id))
    } catch (error) {
      throw error
    }
  } else {
    throw new Error(
      'Unable to switch passage type from choice to input. Missing passage or passage ID.'
    )
  }
}

export async function switchPassageFromInputToChoiceType(
  studioId: StudioId,
  passage: Event
) {
  if (passage && passage.id && passage.input) {
    try {
      await Promise.all([
        api().inputs.removeInput(studioId, passage.input),
        api().passages.savePassageInput(studioId, passage.id, undefined),
        api().passages.savePassageType(studioId, passage.id, EVENT_TYPE.CHOICE)
      ])
    } catch (error) {
      throw error
    }
  } else {
    throw new Error(
      'Unable to switch passage type from input to choice. Missing passage, passage ID or input ID.'
    )
  }
}

export async function setPassageGameEnd(
  studioId: StudioId,
  passageId: ElementId,
  gameOver: boolean
) {
  try {
    await new LibraryDatabase(studioId).setPassageGameEnd(passageId, gameOver)
  } catch (error) {
    throw error
  }
}

// receive new references and remove dead
export async function removeDeadPersonaRefsFromEvent(
  studioId: StudioId,
  characterId: ElementId,
  newRefs: CharacterRefs
) {
  const db = new LibraryDatabase(studioId)

  try {
    const passages = await db.passages
      .where('persona')
      .equals(characterId)
      .toArray()

    await Promise.all(
      passages.map(async (passage) => {
        if (!passage.persona) return

        let clearRef = true

        newRefs.map((newRef) => {
          if (newRef[0] === passage.persona?.[2]) {
            clearRef = false
            return
          }
        })

        if (clearRef && passage.id) {
          try {
            await db.passages.update(passage.id, {
              ...passage,
              persona: [passage.persona[0], passage.persona[1], undefined],
              updated: Date.now()
            })
          } catch (error) {
            throw error
          }
        }
      })
    )
  } catch (error) {
    throw error
  }
}

// when characters are removed
export async function removeDeadPersonasFromEvent(
  studioId: StudioId,
  characterId: ElementId
) {
  const db = new LibraryDatabase(studioId)

  try {
    const passages = await db.passages
      .where('persona')
      .equals(characterId)
      .toArray()

    await Promise.all([
      passages.map(async (passage) => {
        try {
          passage.id &&
            (await db.passages.update(passage.id, {
              ...passage,
              persona: undefined,
              updated: Date.now()
            }))
        } catch (error) {
          throw error
        }
      })
    ])
  } catch (error) {
    throw error
  }
}

// when mask is disabled, reset to NEUTRAL
export async function resetPersonaMaskFromEvent(
  studioId: StudioId,
  characterId: ElementId,
  newMasks: CharacterMask[]
) {
  const db = new LibraryDatabase(studioId)

  try {
    const passages = await db.passages
      .where('persona')
      .equals(characterId)
      .toArray()

    await Promise.all(
      passages.map(async (passage) => {
        if (!passage.persona) return

        let resetMask = true

        newMasks.map((newMask) => {
          if (newMask.type === passage.persona?.[1] && newMask.active) {
            resetMask = false
            return
          }
        })

        if (resetMask && passage.id) {
          try {
            await db.passages.update(passage.id, {
              ...passage,
              persona: [
                passage.persona[0],
                CHARACTER_MASK_TYPE.NEUTRAL,
                passage.persona[2]
              ],
              updated: Date.now()
            })
          } catch (error) {
            throw error
          }
        }
      })
    )
  } catch (error) {
    throw error
  }
}

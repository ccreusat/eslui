import { LibraryDatabase } from '../db'
import { v4 as uuid } from 'uuid'

import { ElementId, WorldId, Jump, JumpPath, StudioId } from '../data/types'

export async function getJump(studioId: StudioId, jumpId: ElementId) {
  try {
    return await new LibraryDatabase(studioId).getJump(jumpId)
  } catch (error) {
    throw error
  }
}

export async function getJumpsByWorldRef(
  studioId: StudioId,
  worldId: WorldId
): Promise<Jump[]> {
  try {
    return await new LibraryDatabase(studioId).getJumpsByWorldRef(worldId)
  } catch (error) {
    throw error
  }
}

export async function getJumpsBySceneRef(
  studioId: StudioId,
  sceneId: ElementId
): Promise<Jump[]> {
  try {
    return await new LibraryDatabase(studioId).getJumpsBySceneRef(sceneId)
  } catch (error) {
    throw error
  }
}

export async function getJumpsByEventRef(
  studioId: StudioId,
  eventId: ElementId
): Promise<Jump[]> {
  try {
    return await new LibraryDatabase(studioId).getJumpsByEventRef(eventId)
  } catch (error) {
    throw error
  }
}

export async function saveJump(studioId: StudioId, jump: Jump): Promise<Jump> {
  if (!jump.id) jump.id = uuid()

  try {
    return await new LibraryDatabase(studioId).saveJump(jump)
  } catch (error) {
    throw error
  }
}

export async function saveJumpRoute(
  studioId: StudioId,
  jumpId: ElementId,
  jumpRoute: JumpPath
): Promise<void> {
  try {
    await new LibraryDatabase(studioId).saveJumpPath(jumpId, jumpRoute)
  } catch (error) {
    throw error
  }
}

export async function removeJump(studioId: StudioId, jumpId: ElementId) {
  try {
    await new LibraryDatabase(studioId).removeJump(jumpId)
  } catch (error) {
    throw error
  }
}

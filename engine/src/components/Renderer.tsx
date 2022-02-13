import React, { useCallback, useContext, useEffect } from 'react'
import { useQuery } from 'react-query'

import { EngineContext, ENGINE_ACTION_TYPE } from '../contexts/EngineContext'

import {
  getBookmarkAuto,
  saveBookmarkLiveEvent,
  saveLiveEventDate
} from '../lib/api'

import {
  AUTO_ENGINE_BOOKMARK_KEY,
  INITIAL_LIVE_ENGINE_EVENT_ORIGIN_KEY
} from '../lib'

import TitleCard from './TitleCard'
import EventStreamTitleBar from './LiveEventStreamTitleBar'
import LiveEventStream from './LiveEventStream'

import EventXRay, { ENGINE_XRAY_CONTAINER_HEIGHT } from './EventXRay'
import ResetNotification from './ResetNotification'

const Renderer: React.FC = () => {
  const { engine, engineDispatch } = useContext(EngineContext)

  const { data: autoBookmark } = useQuery(
    'autoBookmark',
    async () =>
      engine.worldInfo &&
      (await getBookmarkAuto(engine.worldInfo.studioId, engine.worldInfo.id))
  )

  const startWorld = useCallback(async () => {
    if (engine.worldInfo) {
      const updatedBookmark = await saveBookmarkLiveEvent(
        engine.worldInfo.studioId,
        `${AUTO_ENGINE_BOOKMARK_KEY}${engine.worldInfo.id}`,
        `${INITIAL_LIVE_ENGINE_EVENT_ORIGIN_KEY}${engine.worldInfo.id}`
      )

      updatedBookmark &&
        (await saveLiveEventDate(
          engine.worldInfo.studioId,
          `${INITIAL_LIVE_ENGINE_EVENT_ORIGIN_KEY}${engine.worldInfo.id}`,
          updatedBookmark.updated
        ))

      engineDispatch({
        type: ENGINE_ACTION_TYPE.PLAY,
        fromEvent: `${INITIAL_LIVE_ENGINE_EVENT_ORIGIN_KEY}${engine.worldInfo.id}`
      })
    }
  }, [engine.worldInfo])

  const continueWorld = useCallback(() => {
    autoBookmark &&
      engineDispatch({
        type: ENGINE_ACTION_TYPE.PLAY,
        fromEvent: autoBookmark.liveEventId
      })
  }, [autoBookmark])

  useEffect(() => {
    if (engine.worldInfo && engine.isComposer) {
      autoBookmark?.liveEventId ? continueWorld() : startWorld()
    }
  }, [engine.worldInfo, engine.isComposer])

  return (
    <div id="renderer">
      {engine.worldInfo && (
        <>
          {!engine.playing && !engine.isComposer && (
            <TitleCard
              onStartWorld={startWorld}
              onContinueWorld={continueWorld}
            />
          )}

          {engine.playing && (
            <>
              {!engine.isComposer && <EventStreamTitleBar />}
              <LiveEventStream />

              {engine.isComposer && (
                <>
                  {engine.worldInfo && engine.devTools.xrayVisible && (
                    <div
                      style={{
                        height: ENGINE_XRAY_CONTAINER_HEIGHT
                      }}
                      id="engine-xray-wrapper"
                    >
                      {engine.liveEventsInStream.length > 0 && (
                        <EventXRay event={engine.liveEventsInStream[0]} />
                      )}
                    </div>
                  )}

                  <ResetNotification />
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

Renderer.displayName = 'Renderer'

export default Renderer

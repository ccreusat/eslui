import { cloneDeep } from 'lodash-es'

import React, { useContext, useEffect, useRef, useState } from 'react'

import {
  ComponentId,
  COMPONENT_TYPE,
  StudioId,
  VARIABLE_TYPE
} from '../../data/types'

import { EngineContext, ENGINE_ACTION_TYPE } from '../../contexts/EngineContext'

import { useInput, useRoutesByInputRef, useVariable } from '../../hooks'

import { SelectedRouteHandler } from './PassageRenderer'

const VariableInput: React.FC<{
  studioId: StudioId
  inputId: ComponentId
  variableId: ComponentId
  onInput: (
    inputId: ComponentId,
    destinationId: ComponentId,
    destinationType: COMPONENT_TYPE
  ) => void
}> = ({ studioId, inputId, variableId, onInput }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const variable = useVariable(studioId, variableId, [studioId, variableId]),
    routes = useRoutesByInputRef(studioId, inputId, [studioId, inputId])

  const { engine, engineDispatch } = useContext(EngineContext)

  const [value, setValue] = useState<string | undefined>(undefined),
    [selectedRoute, setSelectedRoute] = useState<string | undefined>(undefined)

  useEffect(() => {
    variable &&
      variable.id &&
      setValue(
        engine.gameState[variable.id].currentValue ||
          variable.initialValue ||
          ''
      )
  }, [variable, engine.gameState])

  return (
    <>
      {variable && variable.id && routes && value !== undefined && (
        <>
          <SelectedRouteHandler
            studioId={studioId}
            routes={routes}
            onSelectedRoute={(routeId: ComponentId | undefined) =>
              setSelectedRoute(routeId)
            }
          />

          <form
            onSubmit={(event) => {
              event.preventDefault()

              if (variable.id && value) {
                const foundRoute = routes.find(
                  (route) => route.id === selectedRoute
                )

                if (foundRoute?.id) {
                  const newGameState = cloneDeep(engine.gameState)

                  newGameState[variable.id].currentValue = value

                  engineDispatch({
                    type: ENGINE_ACTION_TYPE.GAME_STATE,
                    gameState: newGameState
                  })

                  onInput(
                    inputId,
                    foundRoute.destinationId,
                    foundRoute.destinationType
                  )
                }
              }
            }}
          >
            {variable.type === VARIABLE_TYPE.BOOLEAN && (
              <>
                <input
                  type="radio"
                  id="false"
                  name="option"
                  value="false"
                  checked={value === 'false'}
                  onChange={(event) => setValue(`${event.target.value}`)}
                />{' '}
                <label htmlFor="false">No</label>{' '}
                <input
                  type="radio"
                  id="true"
                  name="option"
                  value="true"
                  checked={value === 'true'}
                  onChange={(event) => setValue(`${event.target.value}`)}
                />{' '}
                <label htmlFor="true">Yes</label>
              </>
            )}

            {variable.type === VARIABLE_TYPE.NUMBER && (
              <input
                ref={inputRef}
                autoFocus
                type="number"
                className="es-engine-input-number"
                value={value}
                onChange={(event) => setValue(`${event.target.value}`)}
              />
            )}

            {variable.type === VARIABLE_TYPE.STRING && (
              <input
                ref={inputRef}
                autoFocus
                type="text"
                className="es-engine-input-text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            )}

            {value && (
              <button
                type="submit"
                className={`es-engine-input-button ${
                  !selectedRoute ? 'es-engine-input-button-disabled' : ''
                }`}
                style={{ width: '100%' }}
              >
                Save
              </button>
            )}
          </form>
        </>
      )}
    </>
  )
}

const InputRenderer: React.FC<{
  studioId: StudioId
  inputId: ComponentId
  onInput: (inputId: string) => void
}> = ({ studioId, inputId, onInput }) => {
  const input = useInput(studioId, inputId, [studioId, inputId])

  return (
    <>
      {input && (
        <>
          {input.variableId && (
            <>
              <VariableInput
                studioId={studioId}
                inputId={inputId}
                variableId={input.variableId}
                onInput={onInput}
              />
            </>
          )}

          {!input.variableId && (
            <div>Variable is required for passage input.</div>
          )}
        </>
      )}
    </>
  )
}

export default InputRenderer

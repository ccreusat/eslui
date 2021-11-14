import React from 'react'

import { CharacterMood, CHARACTER_MOOD_TYPE } from '../../data/types'

import styles from './styles.module.less'

const CharacterPortrait: React.FC<{
  mood: CharacterMood
  width: string
  overlay?: boolean
  onRemove?: (moodType: CHARACTER_MOOD_TYPE) => void
}> = ({ mood, width, overlay, onRemove }) => {
  return (
    <div
      className={styles.CharacterPortrait}
      style={{
        width
      }}
    >
      <div className={styles.wrapper}>
        <div className={styles.portrait} />
        <div className={`${styles.moodType} ${overlay ? styles.overlay : ''}`}>
          {mood.type}
        </div>
      </div>
    </div>
  )
}

CharacterPortrait.displayName = 'CharacterPortrait'

export default CharacterPortrait

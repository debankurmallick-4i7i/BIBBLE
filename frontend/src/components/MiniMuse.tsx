import { useState } from 'react'
import './MiniMuse.css'

type CharacterPosition = {
  left: number
  top: number
  rotation: number
}

function randomPositions(): CharacterPosition[] {
  return [
    {
      left: 15 + Math.random() * 8,
      top: 25 + Math.random() * 12,
      rotation: -8 + Math.random() * 16,
    },
    {
      left: 43 + Math.random() * 8,
      top: 5 + Math.random() * 12,
      rotation: -5 + Math.random() * 10,
    },
    {
      left: 72 + Math.random() * 8,
      top: 28 + Math.random() * 10,
      rotation: -8 + Math.random() * 16,
    },
  ]
}

function MiniMuse() {
  const [positions] = useState(randomPositions)

  return (
    <div className="mini-muse-area" aria-hidden="true">
      {/* Lavender companion */}
      <div
        className="mini-creature lavender-creature"
        style={{
          left: `${positions[0].left}%`,
          top: `${positions[0].top}%`,
          rotate: `${positions[0].rotation}deg`,
        }}
      >
        <div className="blob-body">
          <div className="blob-face">
            <span className="blob-eye left-eye" />
            <span className="blob-eye right-eye" />
            <span className="blob-mouth tiny-smile" />
          </div>
        </div>
      </div>

      {/* Pink companion */}
      <div
        className="mini-creature pink-creature"
        style={{
          left: `${positions[1].left}%`,
          top: `${positions[1].top}%`,
          rotate: `${positions[1].rotation}deg`,
        }}
      >
        <span className="blob-arm left-arm" />
        <span className="blob-arm right-arm" />
        <div className="blob-body">
          <div className="blob-face">
            <span className="blob-blush left-blush" />
            <span className="blob-blush right-blush" />
            <span className="blob-eye left-eye" />
            <span className="blob-eye right-eye" />
            <span className="blob-mouth happy-mouth" />
          </div>
        </div>
        <span className="blob-foot left-foot" />
        <span className="blob-foot right-foot" />
      </div>

      {/* Yellow companion */}
      <div
        className="mini-creature yellow-creature"
        style={{
          left: `${positions[2].left}%`,
          top: `${positions[2].top}%`,
          rotate: `${positions[2].rotation}deg`,
        }}
      >
        <div className="blob-body">
          <div className="blob-face">
            <span className="blob-eye left-eye" />
            <span className="blob-eye right-eye" />
            <span className="blob-mouth happy-mouth" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MiniMuse
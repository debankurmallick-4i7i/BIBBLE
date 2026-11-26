import './BibbleMuse.css'

type BibbleMuseProps = {
  mood?: 'idle' | 'email' | 'password' | 'error' | 'success'
}

function BibbleMuse({ mood = 'idle' }: BibbleMuseProps) {
  return (
    <div className={`bibble-muse-scene mood-${mood}`} aria-hidden="true">
      <div className="muse-spark muse-spark-1">✦</div>
      <div className="muse-spark muse-spark-2">✧</div>
      <div className="muse-spark muse-spark-3">·</div>
      <div className="muse-spark muse-spark-4">✦</div>

      <div className="muse-floating-note muse-note-one">
        <span>once upon</span>
        <span>an idea...</span>
      </div>

      <div className="muse-floating-note muse-note-two">
        <span>dream</span>
        <span className="note-heart">♡</span>
      </div>

      <div className="muse-orbit orbit-one" />
      <div className="muse-orbit orbit-two" />

      <div className="muse-desk">
        <div className="muse-paper">
          <div className="paper-lines">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="paper-doodle">♡</div>
        </div>

        <div className="muse-character">
          <div className="muse-shadow" />

          <div className="muse-body">
            <div className="muse-blush blush-left" />
            <div className="muse-blush blush-right" />

            <div className="muse-eyes">
              <span className="muse-eye eye-left">
                <span className="eye-pupil" />
              </span>

              <span className="muse-eye eye-right">
                <span className="eye-pupil" />
              </span>
            </div>

            <div className="muse-mouth" />

            <div className="muse-arm arm-left" />
            <div className="muse-arm arm-right" />
          </div>

          <div className="muse-feet">
            <span />
            <span />
          </div>

          <div className="muse-pencil">
            <div className="pencil-wood" />
            <div className="pencil-body" />
            <div className="pencil-band" />
            <div className="pencil-eraser" />
          </div>

          {/* Sunglasses — visible in password mood */}
          <div className="muse-sunglasses">
            <span className="sunglass-lens lens-left" />
            <span className="sunglass-lens lens-right" />
            <span className="sunglass-bridge" />
          </div>
        </div>

        <div className="muse-book">
          <div className="book-cover">
            <span className="book-flower">✿</span>
            <span className="book-title">
              little
              <br />
              ideas
            </span>
          </div>
          <div className="book-pages" />
        </div>

        <div className="muse-teacup">
          <div className="cup-top" />
          <div className="cup-body">
            <span>♡</span>
          </div>
          <div className="cup-handle" />
        </div>
      </div>

      <div className="muse-caption">
        <span className="caption-dot" />
        <span className="caption-text">
          {mood === 'password'
            ? 'shhh... your secret is safe'
            : mood === 'email'
              ? 'oh! a new friend'
              : mood === 'error'
                ? 'oops... let’s try again'
                : mood === 'success'
                  ? 'a new adventure awaits!'
                  : 'little thoughts become big stories'}
        </span>
      </div>
    </div>
  )
}

export default BibbleMuse
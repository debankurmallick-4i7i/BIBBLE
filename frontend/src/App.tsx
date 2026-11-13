import { useState } from 'react';

type QuickAction = {
  title: string;
  description: string;
  prompt: string;
  symbol: string;
};

const quickActions: QuickAction[] = [
  {
    title: 'Write a poem',
    description: 'Turn a feeling into words',
    prompt: 'I have a feeling I want to turn into a poem. Help me explore it first.',
    symbol: '✳',
  },
  {
    title: 'Build a story',
    description: 'Find a story inside an idea',
    prompt: 'I have a rough story idea. Help me develop a few possible directions.',
    symbol: '◌',
  },
  {
    title: 'Write a song',
    description: 'Explore lyrics and a hook',
    prompt: 'Help me brainstorm a song. Let's find its theme and emotional direction.',
    symbol: '♫',
  },
  {
    title: 'Refine a script',
    description: 'Make a scene work harder',
    prompt: 'I want to improve a script. Help me identify what is working and what could be stronger.',
    symbol: '▤',
  },
];

export default function App() {
  const [idea, setIdea] = useState('');
  const [language, setLanguage] = useState('Mix naturally');
  const [notice, setNotice] = useState('This is the first interface preview. AI chat will be connected in the next development step.');

  function chooseAction(action: QuickAction) {
    setIdea(action.prompt);
    setNotice(`${action.title} starter added. Edit the text to make it your own.`);
  }

  function handleSubmit() {
    if (!idea.trim()) {
      setNotice('Start with a thought, even if it is unfinished.');
      return;
    }
    setNotice('Your idea is ready. The AI connection will be added in the next milestone.');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="BIBBLE home">
          <span className="brand-mark">ক</span>
          <span>BIBBLE</span>
          <span className="beta-tag">EARLY PREVIEW</span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a className="active" href="#home">Companion</a>
          <a href="#studio" onClick={(event) => { event.preventDefault(); setNotice('The Creative Studio is planned for a later milestone.'); }}>Creative Studio</a>
        </nav>
        <button className="profile-button" type="button" aria-label="Profile">DM</button>
      </header>

      <section className="hero" id="home">
        <div className="eyebrow"><span className="eyebrow-dot" /> A little space for big ideas</div>
        <h1>Every good creation<br /><em>starts somewhere.</em></h1>
        <p className="hero-copy">Bring a feeling, a half-formed thought, or a story you cannot stop thinking about. We’ll explore it together.</p>

        <div className="composer-card">
          <label className="sr-only" htmlFor="idea-input">Describe your idea</label>
          <textarea
            id="idea-input"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder={'Tell BIBBLE what is on your mind…\nবাংলা, English or Banglish — start anywhere.'}
            rows={4}
          />
          <div className="composer-footer">
            <div className="language-control" aria-label="Preferred language">
              {['বাংলা', 'English', 'Mix naturally'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={language === option ? 'language-chip selected' : 'language-chip'}
                  onClick={() => setLanguage(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button className="send-button" type="button" onClick={handleSubmit}>
              Explore idea <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
        <p className="helper-text" role="status">{notice}</p>
      </section>

      <section className="quick-section" aria-labelledby="quick-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">A PLACE TO BEGIN</p>
            <h2 id="quick-heading">What would you like to make?</h2>
          </div>
          <span className="soft-note">Choose one, or simply start typing above.</span>
        </div>
        <div className="quick-grid">
          {quickActions.map((action) => (
            <button className="quick-card" key={action.title} type="button" onClick={() => chooseAction(action)}>
              <span className="quick-symbol" aria-hidden="true">{action.symbol}</span>
              <span className="quick-title">{action.title}</span>
              <span className="quick-description">{action.description}</span>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="footer-note">
        <span>Made for the curious, the thoughtful and the still-figuring-it-out.</span>
        <span>BIBBLE is a creative partner. Your imagination leads.</span>
      </footer>
    </main>
  );
}

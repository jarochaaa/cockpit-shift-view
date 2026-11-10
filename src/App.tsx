import { useEffect, useReducer, useState } from 'react';
import { Hints } from './board/Hints';
import { Navigator } from './board/Navigator';
import { Cockpit } from './cockpit/Cockpit';
import { CockpitV2 } from './cockpit/v2/CockpitV2';
import i18n from './i18n';
import { codeFor, initialState, reducer } from './state';
import type { Lang } from './state';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'ar', label: 'العربية' },
];

export default function App() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [navOpen, setNavOpen] = useState(true);
  const code = codeFor(s);

  // The language switch changes the Cockpit only; the board stays English.
  useEffect(() => {
    void i18n.changeLanguage(s.lang);
  }, [s.lang]);

  return (
    <div className="stage">
      <Navigator code={code} open={navOpen} onToggle={() => setNavOpen(!navOpen)} onJump={(id) => dispatch({ type: 'jump', preset: id })} />

      <div className="board" onScroll={(e) => e.currentTarget.scrollLeft > 8 && setNavOpen(false)}>
        <section className="board__web" aria-label="Store Management Cockpit">
          <header className="board__title">
            <h2>Store Management Cockpit - Shift View</h2>
            <div className="board__tags">
              <span className="board__tag">Web</span>
              <span className="board__tag">Desktop</span>
              <span className="board__tag board__tag--user">
                User: <b>Store Manager</b>
              </span>
              <span className="board__tag">Shift View</span>
              <span className="board__tag">Version {s.version}</span>
              <span className="board__tag board__tag--view">
                View <b>{code}</b>
              </span>
            </div>
          </header>
          <div className="board__row">
            <div className="product">
              {s.version === 2 ? <CockpitV2 s={s} dispatch={dispatch} /> : <Cockpit s={s} dispatch={dispatch} />}
            </div>
            <div className="side">
              <div className="view-tag">
                View <b>{code}</b>
              </div>
              <button type="button" className="version-switch" onClick={() => dispatch({ type: 'version', version: s.version === 1 ? 2 : 1 })}>
                Switch to Version {s.version === 1 ? 2 : 1}
              </button>
              <div className="lang-switch" role="group" aria-label="App language">
                <span>App language</span>
                <div className="lang-switch__opts">
                  {LANGS.map((l) => (
                    <button key={l.id} type="button" aria-pressed={s.lang === l.id} onClick={() => dispatch({ type: 'lang', lang: l.id })}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <Hints s={s} code={code} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

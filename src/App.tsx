import { useEffect, useReducer, useState } from 'react';
import { Hints } from './board/Hints';
import { Navigator } from './board/Navigator';
import { CockpitLegacy } from './cockpit/legacy/CockpitLegacy';
import { CockpitV2 } from './cockpit/v2/CockpitV2';
import i18n from './i18n';
import { codeFor, presetsFor, initialState, reducer } from './state';
import type { Lang, State } from './state';

/** Deep link: ?view=SM14&version=cape|legacy&lang=en|es|ar opens that preset directly (used by the Figma file). */
function fromUrl(base: State): State {
  const q = new URLSearchParams(window.location.search);
  let s = base;
  const version = q.get('version');
  if (version === 'cape' || version === 'legacy') s = reducer(s, { type: 'version', version });
  const lang = q.get('lang');
  if (lang === 'en' || lang === 'es' || lang === 'ar') s = reducer(s, { type: 'lang', lang });
  const view = q.get('view')?.toUpperCase();
  const preset = presetsFor(s.version).find((p) => p.code === view);
  if (preset) s = reducer(s, { type: 'jump', preset: preset.id });
  return s;
}

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'ar', label: 'العربية' },
];

export default function App() {
  const [s, dispatch] = useReducer(reducer, initialState, fromUrl);
  const [navOpen, setNavOpen] = useState(true);
  const [rationales, setRationales] = useState(true);
  const code = codeFor(s);

  // The language switch changes the Cockpit only; the board stays English.
  useEffect(() => {
    void i18n.changeLanguage(s.lang);
  }, [s.lang]);

  // Keep the address shareable: it always reflects the current view, version and language.
  useEffect(() => {
    const q = new URLSearchParams({ view: code, version: s.version, lang: s.lang });
    window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
  }, [code, s.version, s.lang]);

  return (
    <div className="stage">
      <Navigator code={code} version={s.version} open={navOpen} onToggle={() => setNavOpen(!navOpen)} onJump={(id) => dispatch({ type: 'jump', preset: id })} />

      <div className="board" onScroll={(e) => e.currentTarget.scrollLeft > 8 && setNavOpen(false)}>
        <section className="board__web" aria-label="Store Management Cockpit">
          <header className="board__title">
            <h2>Store Management Cockpit - Shift View</h2>
            <div className="board__tags">
              <span className="board__tag">Web</span>
              <span className="board__tag">Desktop</span>
              <span className="board__tag board__tag--user">
                User: <b>{s.page === 'monitoring' ? 'Area Manager' : 'Store Manager'}</b>
              </span>
              <span className="board__tag">{s.page === 'monitoring' ? 'Country Monitor' : 'Shift View'}</span>
              <span className="board__tag">{s.version === 'cape' ? 'Cape Version' : 'Legacy Version'}</span>
              <span className="board__tag board__tag--view">
                View <b>{code}</b>
              </span>
            </div>
          </header>
          <div className="board__row">
            <div className="product">
              {s.version === 'cape' ? <CockpitV2 s={s} dispatch={dispatch} rationales={rationales} /> : <CockpitLegacy s={s} dispatch={dispatch} />}
            </div>
            <div className="side">
              <div className="view-tag">
                View <b>{code}</b>
              </div>
              <button type="button" className="version-switch" onClick={() => dispatch({ type: 'version', version: s.version === 'cape' ? 'legacy' : 'cape' })}>
                Switch to {s.version === 'cape' ? 'Legacy Version' : 'Cape Version'}
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
              {s.version === 'cape' && s.page === 'monitoring' && (
                <div className="lang-switch" role="group" aria-label="Rationales">
                  <span>Rationales</span>
                  <div className="lang-switch__opts">
                    <button type="button" aria-pressed={rationales} onClick={() => setRationales(true)}>
                      On
                    </button>
                    <button type="button" aria-pressed={!rationales} onClick={() => setRationales(false)}>
                      Off
                    </button>
                  </div>
                </div>
              )}
              <Hints s={s} code={code} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { IATable } from './board/IATable';
import { ROLES } from './board/iaData';
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
  // Expanded: only the product fills the window; a floating button brings the prototype UI back.
  const [expanded, setExpanded] = useState(false);
  const [iaOpen, setIaOpen] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('.pd-layer') && setExpanded(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [expanded]);
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
    <div className={`stage${expanded ? ' stage--expanded' : ''}`}>
      <Navigator code={code} version={s.version} open={navOpen} onToggle={() => setNavOpen(!navOpen)} onJump={(id) => dispatch({ type: 'jump', preset: id })}
        action={
          <button type="button" className="expand-fab" aria-label={expanded ? 'Show prototype UI' : 'Expand prototype'} title={expanded ? 'Show prototype UI' : 'Expand prototype'} aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{expanded ? <path d="M10 14l-7 7M3 15v6h6M14 10l7-7M21 9V3h-6" /> : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}</svg>
          </button>
        }
      />

      <div className="board" onScroll={(e) => e.currentTarget.scrollLeft > 8 && setNavOpen(false)}>
        <section className="board__web" aria-label="Store Management Cockpit">
          <header className="board__title">
            <h2>Store Management Cockpit - Prototype - Direction</h2>
            <div className="board__tags">
              {(s.page === 'monitoring' ? ROLES.filter((r) => r !== 'Store Manager' && r !== 'Shift Lead') : ['Store Manager', 'Shift Lead']).map((r) => (
                <span key={r} className="board__tag board__tag--user">
                  <b>{r}</b>
                </span>
              ))}
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
              <button type="button" className="version-switch ia-switch" onClick={() => setIaOpen(true)}>
                Information Architecture
              </button>
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
      {iaOpen && <IATable onClose={() => setIaOpen(false)} />}
    </div>
  );
}

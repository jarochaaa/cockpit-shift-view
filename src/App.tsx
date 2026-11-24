import { ForceMobile } from './cockpit/v2/useMobile';
import { DarkContext, TierContext } from './cockpit/tier';
import type { Tier } from './cockpit/tier';
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
  const [navOpen, setNavOpen] = useState(false);
  const [tier, setTier] = useState<Tier>('vision');
  const [phone, setPhone] = useState(false);
  const [dark, setDark] = useState(false);
  const [rationales, setRationales] = useState(false);
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

      <div className="board">
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
            <div className={`product${phone ? ' product--phone iphone' : ''}`} data-dark={dark && s.version === 'cape' ? '' : undefined}>
              {(() => {
                const content = (
                  <DarkContext.Provider value={dark && s.version === 'cape'}>
                  <TierContext.Provider value={s.version === 'cape' ? tier : 'vision'}>
                    <ForceMobile.Provider value={phone && s.version === 'cape'}>
                      {s.version === 'cape' ? <CockpitV2 s={s} dispatch={dispatch} rationales={rationales} /> : <CockpitLegacy s={s} dispatch={dispatch} />}
                    </ForceMobile.Provider>
                  </TierContext.Provider>
                  </DarkContext.Provider>
                );
                return phone ? (
                  <div className="iphone__screen">
                    <div className="iphone__status" aria-hidden>
                      <span className="iphone__time">9:41</span>
                      <span className="iphone__island" />
                      <span className="iphone__sys">
                        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
                        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><path d="M8.5 2.3c2.3 0 4.4.9 6 2.4l1-1.1A10.2 10.2 0 0 0 8.5.8 10.2 10.2 0 0 0 1.5 3.6l1 1.1a8.7 8.7 0 0 1 6-2.4Zm0 3.4c1.4 0 2.700.5 3.700 1.400l1-1.100a7.200 7.200 0 0 0-4.700-1.800c-1.800 0-3.500.7-4.700 1.800l1 1.100c1-.9 2.300-1.400 3.700-1.400Zm0 3.300c.7 0 1.300.3 1.800.7L8.500 11.500 6.700 9.700c.5-.4 1.100-.7 1.800-.7Z" /></svg>
                        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.500" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="19" height="9" rx="2" fill="currentColor" /><path d="M24 4.500v4c.8-.3 1.500-1.100 1.500-2s-.7-1.700-1.500-2Z" fill="currentColor" opacity="0.5" /></svg>
                      </span>
                    </div>
                    <div className="iphone__app">{content}</div>
                    <span className="iphone__home" aria-hidden />
                  </div>
                ) : (
                  content
                );
              })()}
            </div>
            <div className="side">
              <div className="view-tag">
                View <b>{code}</b>
              </div>
              <div className="proto-grid" role="group" aria-label="Prototype controls">
                <button type="button" className="version-switch" onClick={() => setNavOpen(true)}>
                  Product Flows
                </button>
                <button type="button" className="version-switch" onClick={() => setIaOpen(true)}>
                  Information Architecture
                </button>
                <button type="button" className="version-switch" aria-pressed={s.version === 'legacy'} onClick={() => (setPhone(false), dispatch({ type: 'version', version: s.version === 'cape' ? 'legacy' : 'cape' }))}>
                  Legacy Version
                </button>
                <button type="button" className="version-switch" aria-pressed={tier === 'mvp'} onClick={() => (s.version === 'legacy' && dispatch({ type: 'version', version: 'cape' }), setTier(tier === 'mvp' ? 'vision' : 'mvp'))}>
                  MVP
                </button>
                <button type="button" className="version-switch" aria-pressed={phone} onClick={() => (s.version === 'legacy' && dispatch({ type: 'version', version: 'cape' }), setPhone(!phone))}>
                  Mobile Version
                </button>
                <button type="button" className="version-switch" aria-pressed={dark} onClick={() => (s.version === 'legacy' && dispatch({ type: 'version', version: 'cape' }), setDark(!dark))}>
                  Dark Mode
                </button>
              </div>
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

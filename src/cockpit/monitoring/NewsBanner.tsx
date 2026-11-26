import { useMobile } from '../v2/useMobile';
import { IconButton } from '../../cape/IconButton';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../cape/Button';
import { Tag } from '../../cape/Tag';
import { CapeIcon } from '../legacy/icons';
import { Drawer } from '../prod/Drawers';
import { AiIcon } from './AiIcon';

/** For now every message uses the branded (purple) tone. */
const BANNER_TONE = 'branded' as const;

type Tone = 'branded' | 'warning' | 'success';

/** One thing happening this week that can move the numbers below. Fictional, built from the interview findings. */
export interface News {
  id: string;
  tone: Tone;
  kind: string;
  range: string;
  title: string;
  text: string;
  context: string;
  impact: { metric: string; expect: string }[];
  doNow: { label: string; why: string }[];
  ai: string[];
}

export const NEWS: News[] = [
  {
    id: 'bf',
    tone: 'branded',
    kind: 'Black Friday',
    range: 'Nov 27 – 30',
    title: 'Black Friday weekend',
    text: 'Orders +35% vs forecast from 18:00. Late orders and Assignment time are expected to rise.',
    context:
      'Black Friday weekend starts Thursday evening. Last year demand peaked between 18:00 and 23:00, with the first late orders about 40 minutes after the peak started. Forecast for this year is +35% orders vs a normal weekend.',
    impact: [
      { metric: 'Late orders', expect: 'Up 4 to 6 pts from 18:00' },
      { metric: 'Assignment time', expect: 'Up about 1.5 min at peak' },
      { metric: 'Active / planned pickers', expect: 'Coverage below 90% in 6 stores' },
      { metric: 'Avg basket', expect: 'Up about 12%' },
    ],
    doNow: [
      { label: 'Call next shift', why: 'Ask the next shift lead to start 60 min early in the 6 stores below 90% coverage.' },
      { label: 'Raise Jira ticket', why: 'Request a higher order cap per slot for stores with high volume.' },
    ],
    ai: [
      'Between 18:00 and 23:00 read Late orders against the forecast-adjusted target, not the usual one.',
      'Active / planned pickers under 90% is the earliest signal; it moves before Assignment time.',
      'A small rise in Fail rate (under 1 pt) is expected: substitutions grow with volume.',
    ],
  },
  {
    id: 'gd',
    tone: 'success',
    kind: 'Groceries Day',
    range: 'Nov 24 – 25',
    title: 'Groceries Day cashback',
    text: 'Cashback 30% from 18:00 to 23:00. Orders +22% vs forecast; Partial fulfilment may rise.',
    context:
      'Groceries Day gives 30% cashback between 18:00 and 23:00 in the UAE. Promo baskets lean on a short list of SKUs, so stock-outs show up quickly in Partial fulfilment and Fail rate.',
    impact: [
      { metric: 'Orders vs forecast', expect: 'Up about 22%' },
      { metric: 'Partial fulfilment', expect: 'Up 1 to 2 pts in high-volume stores' },
      { metric: 'nSFR', expect: 'Can dip if top SKUs run out' },
    ],
    doNow: [{ label: 'Call stores', why: 'Call the highest-volume stores and check stock of the 20 most promoted SKUs before 17:30.' }],
    ai: [
      'If Partial fulfilment rises in several stores at once, check for a shared SKU or a system issue.',
      'Orders above forecast with Prep time on target reflect demand, not a store issue.',
    ],
  },
  {
    id: 'rain',
    tone: 'warning',
    kind: 'Heavy rain',
    range: 'Nov 26 – 27',
    title: 'Heavy rain in Alexandria and Cairo',
    text: 'Heavy rain in Alexandria and Cairo. Rider supply −15%; Rider waiting (AWT) may exceed target.',
    context:
      'Heavy rain is forecast for Alexandria and Cairo on Nov 26 and 27, the first big storm of the Egyptian winter. Rain usually slows deliveries and lowers rider supply by about 15%, so ready orders wait longer at the store.',
    impact: [
      { metric: 'Rider waiting (AWT)', expect: 'Above target in both cities' },
      { metric: 'In-store time', expect: 'Flat if prep is on time' },
      { metric: 'Late orders', expect: 'Up 2 to 3 pts from rider delay' },
      { metric: 'Cancellations', expect: 'Up if waits pass 20 min' },
    ],
    doNow: [
      { label: 'Call logistics', why: 'Ask for a rider rebalance toward the stores with the highest Rider waiting (AWT) in Alexandria and Cairo.' },
    ],
    ai: [
      'If Rider waiting (AWT) rises but Prep time does not, the signal points to rider supply: call logistics.',
      'Late orders with Assignment time on target point to delivery time, not to picker coverage.',
    ],
  },
];

const MAX = 96;
const clip = (s: string) => (s.length > MAX ? `${s.slice(0, MAX - 1).trimEnd()}…` : s);

/** News banner: the text drifts slowly; the pointer pauses it, eases it to the middle and reveals the actions. */
export function NewsBanner() {
  const [i, setI] = useState(0);
  const mobile = useMobile();
  const [hover, setHover] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [open, setOpen] = useState<{ id: string; focus?: 'actions' } | null>(null);
  const paused = hover || open !== null;
  const slides = useRef<(HTMLDivElement | null)[]>([]);
  const state = useRef<{ x: number | null }>({ x: null });
  const pausedRef = useRef(false);
  const playingRef = useRef(true);
  pausedRef.current = paused;
  playingRef.current = playing;
  const go = (k: number) => {
    state.current = { x: null };
    setI((k + NEWS.length) % NEWS.length);
  };

  // Ticker loop: slow drift toward the start edge, a gentle ease to the centre while the pointer is over the banner.
  useEffect(() => {
    slides.current.forEach((sl, k) => {
      if (k !== i) sl?.querySelector<HTMLElement>('.msm-news__main')?.style.removeProperty('transform');
    });
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(250, now - last);
      last = now;
      const slide = slides.current[i];
      const main = slide?.querySelector<HTMLElement>('.msm-news__main');
      if (slide && main) {
        const cs = getComputedStyle(slide);
        const rtl = cs.direction === 'rtl';
        const actions = slide.querySelector<HTMLElement>('.msm-news__actions');
        const gap = parseFloat(cs.columnGap) || 0;
        const inner = slide.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const avail = inner - (pausedRef.current && actions ? actions.offsetWidth + gap : 0);
        const free = Math.max(0, avail - main.offsetWidth);
        const st = state.current;
        if (st.x === null) st.x = free;
        if (pausedRef.current) {
          st.x += (free / 2 - st.x) * Math.min(1, dt * 0.0028);
        } else if (playingRef.current) {
          st.x -= dt * 0.03;
          if (st.x <= -main.offsetWidth * 0.45) go(i + 1);
        }
        main.style.transform = `translateX(${rtl ? -(st.x ?? 0) : st.x ?? 0}px)`;
      }
    };
    const id = window.setInterval(tick, 16);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const current = open ? NEWS.find((n) => n.id === open.id) : undefined;

  return (
    <>
      <div className={`msm-news${paused ? ' is-paused' : ''}`} role="region" aria-roledescription="carousel" aria-label="This week" onMouseEnter={() => !mobile && setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => !mobile && setHover(true)} onBlur={() => setHover(false)}>
        <div className="msm-news__track" style={{ marginInlineStart: `${-i * 100}%` }}>
          {NEWS.map((n, k) => {
            return (
              <div key={n.id} ref={(el) => void (slides.current[k] = el)} className={`msm-news__slide msm-news__slide--${BANNER_TONE}`} aria-hidden={k !== i}>
                <div className="msm-news__main">
                  <Tag size="small" status={BANNER_TONE}>
                    {n.kind}
                  </Tag>
                  <span className="msm-news__range">{n.range}</span>
                  <span className="msm-news__text">{clip(n.text)}</span>
                </div>
                <div className="msm-news__actions">
                  <Button size="small" variant="secondary" status="inverse" className="msm-news__btn" tabIndex={k === i ? 0 : -1} onClick={() => setOpen({ id: n.id })}>
                    See details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {NEWS.length > 1 && (
          <>
            <IconButton className="msm-news__arrow msm-news__arrow--prev" aria-label="Previous" onClick={() => go(i - 1)}>
              <CapeIcon name="chevronLeft" size={18} />
            </IconButton>
            <IconButton className="msm-news__arrow msm-news__arrow--next" aria-label="Next" onClick={() => go(i + 1)}>
              <CapeIcon name="chevronLeft" size={18} />
            </IconButton>
          </>
        )}
        <div className="msm-news__dots">
          <IconButton className="msm-news__play" aria-label={playing ? 'Stop animation' : 'Play animation'} title={playing ? 'Stop animation' : 'Play animation'} onClick={() => setPlaying(!playing)}>
            {playing ? (
              <CapeIcon name="stop" size={12} />
            ) : (
              <CapeIcon name="play" size={12} />
            )}
          </IconButton>
          {NEWS.length > 1 &&
            NEWS.map((n, k) => (
              <button key={n.id} type="button" aria-label={`${n.kind}, ${k + 1} of ${NEWS.length}`} aria-current={k === i} className={`msm-news__dot msm-news__dot--${BANNER_TONE}${k === i ? ' is-on' : ''}`} onClick={() => go(k)} />
            ))}
        </div>
      </div>
      {current && open && <NewsDrawer n={current} focus={open.focus} onClose={() => setOpen(null)} />}
    </>
  );
}

/** More info window: the same right-hand drawer the app uses everywhere else. */
function NewsDrawer({ n, focus, onClose }: { n: News; focus?: 'actions'; onClose: () => void }) {
  const actionsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (focus === 'actions') actionsRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focus]);
  return (
    <Drawer
      title={n.title}
      onClose={onClose}
      footer={
        <Button variant="tertiary" status="inverse" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="msm-modal__body msm-dr">
        <div className="msm-modal__meta">
          <Tag size="small" status={BANNER_TONE}>
            {n.kind}
          </Tag>
          <span className="msm-news__range">{n.range}</span>
        </div>
        <section>
          <h3>What is happening</h3>
          <p>{n.context}</p>
        </section>
        <section>
          <h3>Expected impact on the numbers below</h3>
          <div className="msm-impact">
            {n.impact.map((r) => (
              <div key={r.metric} className="msm-impact__cell">
                <span className="msm-impact__value">{r.expect}</span>
                <span className="msm-impact__label">{r.metric}</span>
              </div>
            ))}
          </div>
        </section>
        {n.doNow.length > 0 && (
        <section ref={actionsRef} className={focus === 'actions' ? 'msm-dr__focus' : undefined}>
          <h3>What you can do</h3>
          <ul className="msm-modal__acts">
            {n.doNow.map((a) => (
              <li key={a.label}>
                <span>
                  <b>{a.label}</b>
                  <small>{a.why}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
        )}
        <section className="msm-modal__ai">
          <h3>
            <AiIcon size={18} /> AI suggestions: how to read the data
            <Tag size="small" status="branded">
              AI agent
            </Tag>
          </h3>
          <ul>
            {n.ai.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </div>
    </Drawer>
  );
}

import { useTranslation } from 'react-i18next';
import { Avatar } from '../cape/Avatar';
import { Indicator } from '../cape/Indicator';
import { Tag } from '../cape/Tag';
import type { FloorOrder, FloorSnapshot, Store } from '../domain/types';
import type { Loaded } from './useMock';

type Tone = 'warning' | 'info' | 'success';
const initials = (name: string) => name.replace('Picker ', 'P');

function StageChip({ value, label, tone, ready }: { value: number; label: string; tone: Tone; ready: boolean }) {
  const on = ready && value > 0;
  return (
    <span className={`stage-chip${on ? ` stage-chip--${tone}` : ''}`}>
      <span className="stage-chip__value">{ready ? value : '–'}</span>
      <span className="stage-chip__label">{label}</span>
    </span>
  );
}

function LateRow({ order, pickerName }: { order: FloorOrder; pickerName: string | null }) {
  const { t } = useTranslation();
  return (
    <li className="late-row">
      <span className="late-row__id">#{order.externalOrderId}</span>
      <span className="late-row__meta">{t('now.inStage', { stage: t(`now.stage.${order.stage}`), items: t('now.items', { count: order.items }) })}</span>
      <span className="late-row__spacer" />
      <span className="late-row__picker">{pickerName ?? t('now.notAssigned')}</span>
      <span className="late-row__late">{t('now.late', { minutes: order.lateByMinutes })}</span>
    </li>
  );
}

/**
 * Live state in one bar (Cockpit Polish 1B): stage counts, late orders and who is
 * working now. With nothing late and nobody on an order, both lists collapse and
 * the bar carries the whole live state in one line.
 */
export function NowBar({ store, floor }: { store: Loaded<Store>; floor: Loaded<FloorSnapshot> }) {
  const { t } = useTranslation();
  const f = floor.status === 'ready' ? floor.data : null;
  const closed = store.status === 'ready' && store.data.status === 'closed';
  const failed = store.status === 'error' || floor.status === 'error';
  const ready = f != null && !failed;

  const count = (stage: FloorOrder['stage']) => f?.orders.filter((o) => o.stage === stage).length ?? 0;
  const late = (f?.orders.filter((o) => o.lateByMinutes != null) ?? []).sort((a, b) => b.lateByMinutes! - a.lateByMinutes!);
  const pickers = new Map(f?.pickers.map((p) => [p.pickerId, p]));
  const working = (f?.orders.filter((o) => o.pickerId && o.stage !== 'unassigned') ?? []).sort((a, b) => b.minutesInStage - a.minutesInStage);
  const idle = f?.pickers.filter((p) => p.status === 'idle').length ?? 0;
  // The live dot turns red only while there are open orders; an idle store keeps it neutral.
  const live = ready && !closed && f.orders.length > 0;
  const showLists = ready && !closed && (late.length > 0 || working.length > 0);

  return (
    <section className="nowbar" aria-label={t('now.live')}>
      <div className="nowbar__strip">
        <span className={`nowbar__live${live ? ' nowbar__live--on' : ''}`}>
          <Indicator status={live ? 'error' : 'neutral'} size="small" />
          {floor.status === 'loading' && !failed ? t('now.loading') : closed || failed ? t('now.offline') : t('now.live')}
        </span>
        <div className="nowbar__stages">
          <StageChip ready={ready} value={count('unassigned')} label={t('now.stage.unassigned')} tone="warning" />
          <StageChip ready={ready} value={count('picking')} label={t('now.stage.picking')} tone="warning" />
          <StageChip ready={ready} value={count('packing')} label={t('now.stage.packing')} tone="info" />
          <StageChip ready={ready} value={f?.readyForRider ?? 0} label={t('now.stage.readyForRider')} tone="success" />
        </div>
        <span className="nowbar__divider" aria-hidden />
        <span className="nowbar__spacer" />
        {failed ? (
          <Tag status="error" size="medium">
            {t('now.dataUnavailable')}
          </Tag>
        ) : closed ? (
          <Tag status="disabled" size="medium">
            {t('now.storeClosed')}
          </Tag>
        ) : (
          ready && (
            <Tag status={late.length ? 'warning' : 'success'} size="medium">
              {late.length ? t('now.lateOrders', { count: late.length }) : t('now.nothingLate')}
            </Tag>
          )
        )}
        {ready && <span className="nowbar__team">{t('now.team', { working: working.length, idle })}</span>}
      </div>

      {showLists && (
        <div className="nowbar__lists">
          <div className="nowbar__col">
            <h2 className="eyebrow">{t('now.lateTitle')}</h2>
            {late.length ? (
              <ul className="late-list">
                {late.map((o) => (
                  <LateRow key={o.orderId} order={o} pickerName={o.pickerId ? (pickers.get(o.pickerId)?.displayName ?? null) : null} />
                ))}
              </ul>
            ) : (
              <p className="nowbar__empty">{t('now.nothingLate')}</p>
            )}
          </div>
          <div className="nowbar__col">
            <h2 className="eyebrow">{t('now.workingTitle')}</h2>
            {working.length ? (
              <ul className="working-list">
                {working.map((o) => {
                  const name = pickers.get(o.pickerId!)?.displayName ?? '';
                  return (
                    <li key={o.orderId} className="working-row">
                      <Avatar size="small" title={name} initials={initials(name)} />
                      <span className="working-row__name">{name}</span>
                      <span className="working-row__spacer" />
                      <span className="working-row__order">#{o.externalOrderId}</span>
                      <span className="working-row__time">{t('now.minutes', { minutes: o.minutesInStage })}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="nowbar__empty">{t('now.noWorking')}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

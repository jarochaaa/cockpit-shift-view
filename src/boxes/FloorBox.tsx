import { useTranslation } from 'react-i18next';
import { Avatar } from '../cape/Avatar';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { BoxState, EmptyState } from '../cockpit/BoxState';
import { useMock } from '../cockpit/useMock';
import { fetchFloor } from '../domain/mockApi';
import { formatPercent } from '../domain/format';
import type { FloorOrder, FloorPicker, FloorSnapshot, Scenario } from '../domain/types';
import type { FloorFilter } from '../state';

const IDLE_THRESHOLD_MIN = 30;
const needsAttention = (o: FloorOrder) => o.lateByMinutes != null || o.pfPending;
const initials = (name: string) => name.replace('Picker ', 'P');

// Urgency sets the order (PRD principle): late or PF-pending work first, then
// working pickers, then the longest idle, offline last.
function pickerRank(p: FloorPicker, order: FloorOrder | undefined) {
  if (order && needsAttention(order)) return 0;
  if (p.status === 'picking' || p.status === 'packing') return 1;
  if (p.status === 'idle') return 2;
  return 3;
}

function OrderBadges({ order }: { order: FloorOrder }) {
  const { t } = useTranslation();
  return (
    <>
      {order.lateByMinutes != null && (
        <Tag status="error" size="small">
          {t('floor.late', { minutes: order.lateByMinutes })}
        </Tag>
      )}
      {order.pfPending && (
        <Tag status="warning" size="small">
          {t('floor.pfPending')}
        </Tag>
      )}
    </>
  );
}

function UnassignedRow({ order }: { order: FloorOrder }) {
  const { t } = useTranslation();
  return (
    <li className={`floor-row${needsAttention(order) ? ' floor-row--attention' : ''}`}>
      <div className="floor-row__main">
        <Typography variant="subtitle-medium" as="span" className="floor-row__id">
          #{order.externalOrderId}
        </Typography>
        <Typography variant="body-small" as="span">
          {t('floor.items', { count: order.items })} · {t('floor.waiting', { minutes: order.minutesInStage })}
        </Typography>
      </div>
      <div className="floor-row__tags">
        <OrderBadges order={order} />
      </div>
    </li>
  );
}

function PickerRow({ picker, order }: { picker: FloorPicker; order: FloorOrder | undefined }) {
  const { t } = useTranslation();
  const idleOver = picker.status === 'idle' && picker.minutesInStatus > IDLE_THRESHOLD_MIN;
  const statusTag =
    picker.status === 'idle' ? (
      <Tag status={idleOver ? 'warning' : 'neutral'} size="small">
        {t('floor.status.idleFor', { minutes: picker.minutesInStatus })}
      </Tag>
    ) : (
      <Tag status={picker.status === 'offline' ? 'disabled' : 'info'} size="small">
        {t(`floor.status.${picker.status}`)}
      </Tag>
    );

  return (
    <li className={`floor-row${order && needsAttention(order) ? ' floor-row--attention' : ''}`}>
      <div className="floor-row__main">
        <Avatar size="small" title={picker.displayName} initials={initials(picker.displayName)} />
        <Typography variant="subtitle-medium" as="span" className="floor-row__name">
          {picker.displayName}
        </Typography>
        {statusTag}
      </div>
      {order && (
        <div className="floor-row__order">
          <Typography variant="body-small" as="span">
            #{order.externalOrderId} · {t('floor.items', { count: order.items })}
          </Typography>
          <OrderBadges order={order} />
        </div>
      )}
      <Typography variant="body-small" as="span" className="floor-row__perf">
        {t('floor.perf', { orders: picker.ordersToday, failRate: formatPercent(picker.failRate) })}
      </Typography>
    </li>
  );
}

function FloorList({ data, filter, closed }: { data: FloorSnapshot; filter: FloorFilter; closed: boolean }) {
  const { t } = useTranslation();
  if (closed) return <EmptyState text={t('floor.empty.closed')} />;

  const orderByPicker = new Map(data.orders.filter((o) => o.pickerId).map((o) => [o.pickerId!, o]));
  const unassigned = data.orders.filter((o) => o.stage === 'unassigned').sort((a, b) => b.minutesInStage - a.minutesInStage);
  const pickers = [...data.pickers].sort((a, b) => {
    const ra = pickerRank(a, orderByPicker.get(a.pickerId));
    const rb = pickerRank(b, orderByPicker.get(b.pickerId));
    return ra !== rb ? ra - rb : b.minutesInStatus - a.minutesInStatus;
  });

  const working = data.pickers.filter((p) => p.status === 'picking' || p.status === 'packing').length;
  const onShift = data.pickers.filter((p) => p.status !== 'offline').length;
  const perPicker = working ? (data.orders.length / working).toFixed(1) : '0';

  const showUnassigned = filter === 'all' || filter === 'unassigned' || filter === 'attention';
  const visibleUnassigned = filter === 'attention' ? unassigned.filter(needsAttention) : unassigned;
  const visiblePickers =
    filter === 'attention'
      ? pickers.filter((p) => {
          const o = orderByPicker.get(p.pickerId);
          return o != null && needsAttention(o);
        })
      : filter === 'idle'
        ? pickers.filter((p) => p.status === 'idle')
        : filter === 'unassigned'
          ? []
          : pickers;

  const empty =
    filter === 'attention' && visibleUnassigned.length === 0 && visiblePickers.length === 0
      ? t('floor.empty.attention')
      : filter === 'unassigned' && visibleUnassigned.length === 0
        ? t('floor.empty.unassigned')
        : filter === 'idle' && visiblePickers.length === 0
          ? t('floor.empty.idle')
          : null;

  return (
    <div className="floor">
      <Typography variant="body-small" className="floor-summary">
        {t('floor.summary', { orders: data.orders.length, working, onShift, perPicker })}
      </Typography>
      {empty ? (
        <EmptyState text={empty} />
      ) : (
        <>
          {showUnassigned && visibleUnassigned.length > 0 && (
            <section className="floor-section">
              <Typography variant="caption" as="h3" className="floor-section__title">
                {t('floor.section.unassigned', { count: visibleUnassigned.length })}
              </Typography>
              <ul className="floor-list">
                {visibleUnassigned.map((o) => (
                  <UnassignedRow key={o.orderId} order={o} />
                ))}
              </ul>
            </section>
          )}
          {filter === 'all' && data.orders.length === 0 && <EmptyState text={t('floor.empty.noOrders')} />}
          {visiblePickers.length > 0 && (
            <section className="floor-section">
              <Typography variant="caption" as="h3" className="floor-section__title">
                {t('floor.section.pickers', { count: visiblePickers.length })}
              </Typography>
              <ul className="floor-list">
                {visiblePickers.map((p) => (
                  <PickerRow key={p.pickerId} picker={p} order={orderByPicker.get(p.pickerId)} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function FloorBox({ scenario, filter }: { scenario: Scenario; filter: FloorFilter }) {
  const floor = useMock(fetchFloor, scenario);
  return (
    <BoxState state={floor} lines={6}>
      {(data) => <FloorList data={data} filter={filter} closed={scenario === 'closed'} />}
    </BoxState>
  );
}

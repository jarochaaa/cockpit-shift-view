import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../cape/Avatar';
import { Indicator } from '../cape/Indicator';
import { Typography } from '../cape/Typography';
import { fetchPeople } from '../domain/mockApi';
import type { PersonRow, PickerStatus } from '../domain/types';
import { minutesSince } from '../domain/format';

const STATUS_INDICATOR: Record<PickerStatus, 'branded' | 'neutral' | 'subtle'> = {
  picking: 'branded',
  packing: 'branded',
  idle: 'neutral',
  offline: 'subtle',
};

export function PeopleTasksBox() {
  const { t } = useTranslation();
  const [people, setPeople] = useState<PersonRow[] | null>(null);

  useEffect(() => {
    fetchPeople().then(setPeople);
  }, []);

  if (!people) return null;

  const idleCount = people.filter((p) => p.status === 'idle').length;
  const workingCount = people.length - idleCount;

  if (workingCount === 0) {
    return <Typography variant="body-medium">{t('peopleTasks.empty', { count: idleCount })}</Typography>;
  }

  return (
    <ul className="people-list">
      {people.map((person) => (
        <li key={person.pickerId} className="people-row">
          <Avatar size="small" title={person.displayName} />
          <Typography variant="body-medium" as="span" className="people-row__name">
            {person.displayName}
          </Typography>
          <Indicator status={STATUS_INDICATOR[person.status]} size="small" />
          <Typography variant="caption" as="span">
            {person.status === 'idle' ? t('peopleTasks.idleSince', { minutes: minutesSince(person.statusChangedAt) }) : t(`peopleTasks.${person.status}`)}
          </Typography>
        </li>
      ))}
    </ul>
  );
}

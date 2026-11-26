import { createContext, useContext, useEffect, useState } from 'react';

/** The prototype board can force the phone layout inside a phone-sized frame. */
export const ForceMobile = createContext(false);

const QUERY = '(max-width: 767px)';

/** True on phone widths: the portal switches to a bottom tab bar and Needs attention becomes a bottom sheet. */
export function useMobile() {
  const forced = useContext(ForceMobile);
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return forced || m;
}

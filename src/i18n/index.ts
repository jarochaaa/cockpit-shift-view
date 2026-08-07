import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

// EN-only at launch. Adding a locale later is: drop a new locales/<code>.json,
// add it to `resources` and to Cockpit-Shift-View-schema.sql's `locales` table —
// no schema or component change, per Cockpit-Shift-View-IA-v1.md §5.
export const RTL_LOCALES = new Set<string>(); // e.g. add 'ar' here once it ships

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
import es from './locales/es.json';

// Adding a locale = one more locales/<code>.json with the same keys + a button in the side column.
export const RTL_LOCALES = new Set<string>(['ar']);

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es }, ar: { translation: ar } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

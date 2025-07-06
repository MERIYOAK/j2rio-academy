import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslation from './locales/en/translation.json';
import tiTranslation from './locales/ti/translation.json';
import amTranslation from './locales/am/translation.json';

const resources = {
  en: {
    translation: enTranslation
  },
  ti: {
    translation: tiTranslation
  },
  am: {
    translation: amTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 
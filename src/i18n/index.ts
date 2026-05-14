import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        'en-US': en,
        en,
      },
      lng: 'en-US',
      fallbackLng: 'en-US',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
}

export default i18n;

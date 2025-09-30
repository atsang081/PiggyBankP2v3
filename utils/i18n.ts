import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Import translation files
import en from '@/constants/locales/en.json';
import zhHant from '@/constants/locales/zh-Hant.json';

const resources = {
  en: {
    translation: en,
  },
  'zh-Hant': {
    translation: zhHant,
  },
};

// Function to get stored language
const getStoredLanguage = async (): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('appLanguage') || 'en';
    } else {
      return await SecureStore.getItemAsync('appLanguage') || 'en';
    }
  } catch (error) {
    return 'en';
  }
};

// Function to store language
export const storeLanguage = async (language: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('appLanguage', language);
    } else {
      await SecureStore.setItemAsync('appLanguage', language);
    }
  } catch (error) {
    console.error('Error storing language:', error);
  }
};

// Initialize i18n
const initI18n = async () => {
  const storedLanguage = await getStoredLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: storedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export default i18n;
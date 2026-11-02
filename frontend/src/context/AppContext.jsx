import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

const translations = {
  en: {
    overview: 'Overview', workers: 'Workers Directory', jobs: 'Jobs & Verification', reputation: 'Reputation History',
    verification: 'Verification Queue', evidence: 'Evidence Library', disputes: 'Disputes & Reviews', activity: 'Activity History',
    analytics: 'Prototype Analytics', myCredID: 'My CredID', settings: 'Settings', portable: 'Portable Credential',
    publicCredID: 'Public CredID (Amit)', prototype: 'SEVA FIRST Innovation Prototype',
    adminView: 'Admin View', workerView: 'Worker View (Amit)', customerView: 'Customer View (Sunita)', resetDemo: 'Reset Demo Data',
    appearance: 'Appearance', language: 'Language', dark: 'Dark', light: 'Light', english: 'English', hindi: 'हिन्दी',
    save: 'Save', security: 'Security', privacy: 'Privacy', blockchainIntegrity: 'Blockchain Integrity',
    integrityVerified: 'Integrity Verified', needsReview: 'Needs Review', notAnchored: 'Not Anchored', localAnchor: 'Local Integrity Anchor'
  },
  hi: {
    overview: 'डैशबोर्ड', workers: 'वर्कर निर्देशिका', jobs: 'काम और सत्यापन', reputation: 'प्रतिष्ठा इतिहास',
    verification: 'सत्यापन कतार', evidence: 'प्रमाण संग्रह', disputes: 'विवाद और समीक्षा', activity: 'गतिविधि इतिहास',
    analytics: 'प्रोटोटाइप विश्लेषण', myCredID: 'मेरा CredID', settings: 'सेटिंग्स', portable: 'पोर्टेबल क्रेडेंशियल',
    publicCredID: 'पब्लिक CredID (अमित)', prototype: 'SEVA FIRST इनोवेशन प्रोटोटाइप',
    adminView: 'एडमिन व्यू', workerView: 'वर्कर व्यू (अमित)', customerView: 'कस्टमर व्यू (सुनीता)', resetDemo: 'डेमो डेटा रीसेट',
    appearance: 'दिखावट', language: 'भाषा', dark: 'डार्क', light: 'लाइट', english: 'English', hindi: 'हिन्दी',
    save: 'सहेजें', security: 'सुरक्षा', privacy: 'गोपनीयता', blockchainIntegrity: 'ब्लॉकचेन इंटीग्रिटी',
    integrityVerified: 'इंटीग्रिटी सत्यापित', needsReview: 'समीक्षा आवश्यक', notAnchored: 'एंकर नहीं किया गया', localAnchor: 'लोकल इंटीग्रिटी एंकर'
  }
};

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('credid_role') || 'admin');
  const [activeWorkerCredId, setActiveWorkerCredId] = useState('CRD-ELC-20481');
  const [activeWorker, setActiveWorker] = useState(null);
  const [notification, setNotification] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('credid_theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('credid_language') || 'en');

  useEffect(() => {
    localStorage.setItem('credid_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('credid_theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('credid_language', language);
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  useEffect(() => {
    api.getWorker(activeWorkerCredId).then(setActiveWorker).catch(() => setActiveWorker(null));
  }, [activeWorkerCredId, refreshKey]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const triggerRefresh = () => setRefreshKey((k) => k + 1);
  const t = useMemo(() => (key) => translations[language]?.[key] ?? translations.en[key] ?? key, [language]);

  return (
    <AppContext.Provider value={{ currentRole, setCurrentRole, activeWorkerCredId, setActiveWorkerCredId, activeWorker, notification, showNotification, refreshKey, triggerRefresh, theme, setTheme, language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }

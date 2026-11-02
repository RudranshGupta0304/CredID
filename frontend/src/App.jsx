import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Layout & Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';

// Pages
import Overview from './pages/Overview';
import Workers from './pages/Workers';
import Jobs from './pages/Jobs';
import Reputation from './pages/Reputation';
import Verification from './pages/Verification';
import EvidencePage from './pages/Evidence';
import Disputes from './pages/Disputes';
import ActivityHistory from './pages/ActivityHistory';
import Analytics from './pages/Analytics';
import MyCredID from './pages/MyCredID';
import Settings from './pages/Settings';
import PublicCredID from './pages/PublicCredID';

function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main>{children}</main>
      </div>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Standalone Portable CredID Profile View */}
          <Route path="/credid/:cred_id/public" element={<PublicCredID />} />
          <Route path="/crd/:cred_id" element={<PublicCredID />} />

          {/* Main Full-Stack Application Layout */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Overview />
              </MainLayout>
            }
          />
          <Route
            path="/workers"
            element={
              <MainLayout>
                <Workers />
              </MainLayout>
            }
          />
          <Route
            path="/jobs"
            element={
              <MainLayout>
                <Jobs />
              </MainLayout>
            }
          />
          <Route
            path="/reputation"
            element={
              <MainLayout>
                <Reputation />
              </MainLayout>
            }
          />
          <Route
            path="/verification"
            element={
              <MainLayout>
                <Verification />
              </MainLayout>
            }
          />
          <Route
            path="/evidence"
            element={
              <MainLayout>
                <EvidencePage />
              </MainLayout>
            }
          />
          <Route
            path="/disputes"
            element={
              <MainLayout>
                <Disputes />
              </MainLayout>
            }
          />
          <Route
            path="/activity"
            element={
              <MainLayout>
                <ActivityHistory />
              </MainLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <MainLayout>
                <Analytics />
              </MainLayout>
            }
          />
          <Route
            path="/my-credid"
            element={
              <MainLayout>
                <MyCredID />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <Settings />
              </MainLayout>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

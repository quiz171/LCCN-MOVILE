/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AdminPortal } from './components/AdminPortal';
import { AnnouncementsView } from './components/AnnouncementsView';
import { AssistantView } from './components/AssistantView';
import { ChurchInfoModal } from './components/ChurchInfoModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EventsView } from './components/EventsView';
import { HomeView } from './components/HomeView';
import { LccnLogo } from './components/LccnLogo';
import { LoginScreen } from './components/LoginScreen';
import { NavigationShell } from './components/NavigationShell';
import { OnboardingForm } from './components/OnboardingForm';
import { ProfileView } from './components/ProfileView';
import { OfflineBanner } from './components/PWAComponents';
import { ChurchProvider, useChurch } from './context/ChurchContext';
import { Announcement, ChurchEvent, MainTab } from './types/lccn';

function AppRouter() {
  const {
    user,
    authLoading,
    member,
    memberLoaded,
    currentChurch,
  } = useChurch();

  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [editingProfile, setEditingProfile] = useState(false);
  const [showChurchInfo, setShowChurchInfo] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(
    () => window.location.pathname === '/admin'
  );

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname === '/admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openAdminPortal = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
  };

  const exitAdminPortal = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  if (authLoading || (user && !memberLoaded)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 animate-pulse">
          <LccnLogo className="w-16 h-16 p-1.5" />
        </div>
        <p className="font-display text-base font-semibold text-navy-900">
          Loading LCCN Abuja Diocese...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isAdminRoute) {
    return <AdminPortal onExit={exitAdminPortal} />;
  }

  if (!member) {
    return (
      <OnboardingForm
        mode="register"
        onSuccess={() => setActiveTab('home')}
      />
    );
  }

  if (editingProfile) {
    return (
      <OnboardingForm
        mode="edit"
        onCancel={() => setEditingProfile(false)}
        onSuccess={() => setEditingProfile(false)}
      />
    );
  }

  return (
    <>
      <NavigationShell
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedAnnouncement(null);
          setSelectedEvent(null);
        }}
        churchName={currentChurch?.name}
      >
        {activeTab === 'home' && (
          <HomeView
            onNavigate={setActiveTab}
            onOpenChurchInfo={() => setShowChurchInfo(true)}
            onOpenAnnouncement={(item) => {
              setSelectedAnnouncement(item);
              setActiveTab('announcements');
            }}
            onOpenEvent={(evt) => {
              setSelectedEvent(evt);
              setActiveTab('events');
            }}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsView
            selectedAnnouncement={selectedAnnouncement}
            onSelectAnnouncement={setSelectedAnnouncement}
          />
        )}

        {activeTab === 'events' && (
          <EventsView
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
          />
        )}

        {activeTab === 'assistant' && <AssistantView />}

        {activeTab === 'profile' && (
          <ProfileView
            onEditProfile={() => setEditingProfile(true)}
            onOpenChurchInfo={() => setShowChurchInfo(true)}
            onOpenAdmin={openAdminPortal}
          />
        )}
      </NavigationShell>

      <ChurchInfoModal
        isOpen={showChurchInfo}
        onClose={() => setShowChurchInfo(false)}
        onChangeChurch={() => setEditingProfile(true)}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <ChurchProvider>
        <AppRouter />
      </ChurchProvider>
    </ErrorBoundary>
  );
}

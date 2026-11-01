import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingView } from './views/LandingView';
import { CandidatesView } from './views/CandidatesView';
import { VoterLoginView } from './views/VoterLoginView';
import { VotingView } from './views/VotingView';
import { ResultsView } from './views/ResultsView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { GuideModal } from './components/GuideModal';
import { FAQSection } from './components/FAQSection';
import { ContactSection } from './components/ContactSection';
import { Candidate, Voter, ElectionSettings, Announcement } from './types';
import { electionStore } from './services/store';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [votersCount, setVotersCount] = useState<number>(0);
  const [currentVoter, setCurrentVoter] = useState<Voter | null>(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(false);
  const [targetVoteCandidate, setTargetVoteCandidate] = useState<Candidate | null>(null);
  const [showStandaloneGuide, setShowStandaloneGuide] = useState<boolean>(false);
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);

  // Initialize app data from electionStore
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoadingApp(true);
    try {
      await electionStore.checkConnection();
      const [st, cd, an, vt] = await Promise.all([
        electionStore.getSettings(),
        electionStore.getCandidates(),
        electionStore.getAnnouncements(),
        electionStore.getVoters(),
      ]);
      setSettings(st);
      setCandidates(cd);
      setAnnouncements(an);
      setVotersCount(vt.length);

      // Check current sessions
      const voterSession = electionStore.getCurrentVoter();
      if (voterSession) {
        // verify fresh status from voters list
        const fresh = vt.find((v) => v.id === voterSession.id);
        setCurrentVoter(fresh || voterSession);
      }

      const adminSession = electionStore.getAdminSession();
      if (adminSession) {
        setAdminLoggedIn(true);
      }
    } catch (e) {
      console.error('Error initializing applet:', e);
    } finally {
      setIsLoadingApp(false);
    }
  };

  const handleRefreshData = async () => {
    const [st, cd, an, vt] = await Promise.all([
      electionStore.getSettings(),
      electionStore.getCandidates(),
      electionStore.getAnnouncements(),
      electionStore.getVoters(),
    ]);
    setSettings(st);
    setCandidates(cd);
    setAnnouncements(an);
    setVotersCount(vt.length);
  };

  const handleLoginVoter = (voter: Voter) => {
    setCurrentVoter(voter);
    if (!voter.hasVoted && settings?.status === 'ongoing') {
      setCurrentView('voting');
    } else {
      setCurrentView('landing');
    }
  };

  const handleLogoutVoter = () => {
    electionStore.logoutVoter();
    setCurrentVoter(null);
    setCurrentView('landing');
  };

  const handleLoginAdminSuccess = () => {
    setAdminLoggedIn(true);
    setCurrentView('admin-dashboard');
  };

  const handleLogoutAdmin = () => {
    electionStore.logoutAdmin();
    setAdminLoggedIn(false);
    setCurrentView('landing');
  };

  const handleSelectCandidateToVote = (candidate: Candidate) => {
    setTargetVoteCandidate(candidate);
    if (!currentVoter) {
      setCurrentView('login');
    } else {
      setCurrentView('voting');
    }
  };

  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-[#071322] flex flex-col items-center justify-center text-white space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-4 border-amber-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-amber-400 text-xs">
            OSIS
          </div>
        </div>
        <p className="text-sm font-bold text-slate-300">Memuat Sistem E-Voting OSIS VOTE...</p>
        <p className="text-xs text-amber-400/80 italic">"Satu Suara, Satu Perubahan, Masa Depan Sekolah, RAHAYU"</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071322] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Universal Sticky Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'guide') {
            setShowStandaloneGuide(true);
          } else {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        currentVoter={currentVoter}
        onLogoutVoter={handleLogoutVoter}
        settings={settings}
        adminLoggedIn={adminLoggedIn}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingView
            settings={settings}
            candidates={candidates}
            announcements={announcements}
            totalVotersCount={votersCount}
            currentVoter={currentVoter}
            onNavigate={(view) => {
              if (view === 'guide') {
                setShowStandaloneGuide(true);
              } else {
                setCurrentView(view);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onSelectCandidateToVote={handleSelectCandidateToVote}
          />
        )}

        {currentView === 'candidates' && (
          <CandidatesView
            candidates={candidates}
            currentVoter={currentVoter}
            settings={settings}
            onNavigate={setCurrentView}
            onSelectCandidateToVote={handleSelectCandidateToVote}
          />
        )}

        {currentView === 'login' && (
          <VoterLoginView
            currentVoter={currentVoter}
            settings={settings}
            onLoginSuccess={handleLoginVoter}
            onLogout={handleLogoutVoter}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'voting' && (
          <VotingView
            candidates={candidates}
            currentVoter={currentVoter}
            settings={settings}
            onNavigate={setCurrentView}
            onVoterUpdate={(updated) => {
              setCurrentVoter(updated);
              handleRefreshData();
            }}
            onLogout={handleLogoutVoter}
            initialSelectedCandidate={targetVoteCandidate}
          />
        )}

        {currentView === 'results' && (
          <ResultsView
            settings={settings}
            currentVoter={currentVoter}
            adminLoggedIn={adminLoggedIn}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'faq' && (
          <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
            <FAQSection />
            <ContactSection settings={settings} />
          </div>
        )}

        {currentView === 'contact' && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <ContactSection settings={settings} />
          </div>
        )}

        {currentView === 'admin-login' && (
          <AdminLoginView
            onLoginSuccess={handleLoginAdminSuccess}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboardView
            settings={settings}
            onSettingsUpdate={(newSettings) => {
              setSettings(newSettings);
              handleRefreshData();
            }}
            onLogoutAdmin={handleLogoutAdmin}
            onNavigate={setCurrentView}
          />
        )}
      </main>

      {/* Universal Standalone Guide Modal */}
      {showStandaloneGuide && (
        <GuideModal
          onClose={() => setShowStandaloneGuide(false)}
          onStartVoting={() => {
            if (currentVoter) {
              setCurrentView('voting');
            } else {
              setCurrentView('login');
            }
          }}
        />
      )}

      {/* Universal Footer */}
      <Footer
        settings={settings}
        onNavigate={(view) => {
          if (view === 'guide') {
            setShowStandaloneGuide(true);
          } else {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
}

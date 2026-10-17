import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { ComparePage } from './pages/ComparePage';
import { SavedPage } from './pages/SavedPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { ProviderStatus } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedCreator, setSelectedCreator] = useState<string>('natgeo');
  const [compareList, setCompareList] = useState<string[]>(['natgeo', 'techinsider']);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    api
      .getProviderStatus()
      .then((status) => setProviderStatus(status))
      .catch((err) => console.error('Failed to fetch provider status:', err));
  }, []);

  const handleLandingSearch = (username: string) => {
    setSelectedCreator(username);
    setActiveTab('analyze');
  };

  const handleNavigateToCompare = (username: string) => {
    if (!compareList.includes(username)) {
      setCompareList([...compareList.slice(-4), username]);
    }
    setActiveTab('compare');
  };

  const handleSelectFromCompare = (username: string) => {
    setSelectedCreator(username);
    setActiveTab('analyze');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          providerStatus={providerStatus}
        />

        <main>
          {activeTab === 'landing' && (
            <LandingPage
              onAnalyze={handleLandingSearch}
              onExploreCompare={() => setActiveTab('compare')}
            />
          )}

          {activeTab === 'analyze' && (
            <AnalyzePage
              initialUsername={selectedCreator}
              onNavigateToCompare={handleNavigateToCompare}
            />
          )}

          {activeTab === 'compare' && (
            <ComparePage
              initialCreators={compareList}
              onSelectCreator={handleSelectFromCompare}
            />
          )}

          {activeTab === 'saved' && (
            <SavedPage
              onAnalyzeCreator={(user) => {
                setSelectedCreator(user);
                setActiveTab('analyze');
              }}
            />
          )}

          {activeTab === 'methodology' && <MethodologyPage />}
        </main>
      </div>

      {/* SaaS Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">CreatorScope</span>
            <span>—</span>
            <span>Make smarter creator decisions.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('methodology')}
              className="hover:text-slate-800 transition"
            >
              Methodology & Compliance
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className="hover:text-slate-800 transition"
            >
              Analyze Profile
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className="hover:text-slate-800 transition"
            >
              Compare
            </button>
          </div>

          <div className="text-slate-400">
            © {new Date().getFullYear()} CreatorScope SaaS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

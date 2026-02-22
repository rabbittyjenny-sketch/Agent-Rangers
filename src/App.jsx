import React, { useState, useEffect, Suspense, lazy } from 'react';
import './App.css';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AgentChat = lazy(() => import('./pages/AgentChat').then(m => ({ default: m.AgentChat })));
const TaskMonitor = lazy(() => import('./pages/TaskMonitor').then(m => ({ default: m.TaskMonitor })));
const BrandManager = lazy(() => import('./pages/BrandManager').then(m => ({ default: m.BrandManager })));

// Legacy components (kept for backward compatibility)
import Hero from './components/Hero';
import AgentsGrid from './components/AgentsGrid';
import Onboarding from './components/Onboarding';

// Import services
import { orchestratorEngine } from './services/orchestratorEngine';
import { aiService } from './services/aiService';
import { databaseService } from './services/databaseService';

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  // Views: home, dashboard, chat, tasks, brands, onboarding, legacy-hero, legacy-agents

  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [masterContext, setMasterContext] = useState(null);
  const [systemReady, setSystemReady] = useState(false);

  // Load Master Context from localStorage on mount
  useEffect(() => {
    console.log('🗄️  Database Service Status:', databaseService.getStatus());

    const savedContext = localStorage.getItem('socialFactory_masterContext');
    if (savedContext) {
      try {
        const context = JSON.parse(savedContext);
        setMasterContext(context);
        orchestratorEngine.setMasterContext(context);
        aiService.initialize(context);
        setSystemReady(true);
      } catch (error) {
        console.error('Failed to load Master Context:', error);
      }
    }
  }, []);

  // Navigation Handlers
  const handleSelectCluster = (clusterId) => {
    setSelectedCluster(clusterId);
    setCurrentView('dashboard');
  };

  const handleSelectAgent = (agentId) => {
    setSelectedAgent(agentId);
    setCurrentView('chat');
  };

  const handleSelectBrand = (brandId) => {
    setSelectedBrand(brandId);
  };

  const handleStartOnboarding = () => {
    setCurrentView('onboarding');
  };

  const handleOnboardingComplete = (context) => {
    localStorage.setItem('socialFactory_masterContext', JSON.stringify(context));
    setMasterContext(context);
    orchestratorEngine.setMasterContext(context);
    aiService.initialize(context);
    setSystemReady(true);
    alert(`✅ Onboarding Complete!\n\nBrand: ${context.brandNameTh}\nSystem is ready to help you!`);
    setCurrentView('home');
  };

  const handleOnboardingCancel = () => {
    setCurrentView('home');
  };

  const handleOnboardingSkip = (defaultContext) => {
    localStorage.setItem('socialFactory_masterContext', JSON.stringify(defaultContext));
    setMasterContext(defaultContext);
    orchestratorEngine.setMasterContext(defaultContext);
    aiService.initialize(defaultContext);
    setSystemReady(true);
    alert(`ℹ️ System Ready!\n\nYou're using default brand settings.\nYou can setup your brand details later by clicking "Setup Brand" in the header.`);
    setCurrentView('home');
  };

  const handleBack = () => {
    setSelectedCluster(null);
    setSelectedAgent(null);
    setCurrentView('home');
  };

  // Render different views
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage
            onSelectCluster={handleSelectCluster}
            onStartOnboarding={handleStartOnboarding}
            isLoggedIn={systemReady && masterContext}
          />
        );

      case 'dashboard':
        return (
          <Dashboard
            clusterId={selectedCluster}
            onBack={handleBack}
            onSelectAgent={handleSelectAgent}
            masterContext={masterContext}
          />
        );

      case 'chat':
        return (
          <AgentChat
            agentId={selectedAgent}
            onBack={handleBack}
            masterContext={masterContext}
          />
        );

      case 'tasks':
        return (
          <TaskMonitor onBack={handleBack} />
        );

      case 'brands':
        return (
          <BrandManager
            masterContext={masterContext}
            onBack={handleBack}
            onSelectBrand={handleSelectBrand}
          />
        );

      case 'onboarding':
        return (
          <Onboarding
            onComplete={handleOnboardingComplete}
            onCancel={handleOnboardingCancel}
            onSkip={handleOnboardingSkip}
          />
        );

      // Legacy views (kept for backward compatibility)
      case 'legacy-hero':
        return (
          <Hero
            onSelectCluster={handleSelectCluster}
            onStartOnboarding={handleStartOnboarding}
          />
        );

      case 'legacy-agents':
        return (
          <AgentsGrid
            clusterId={selectedCluster}
            onBack={handleBack}
            onSelectAgent={handleSelectAgent}
            masterContext={masterContext}
          />
        );

      default:
        return (
          <HomePage
            onSelectCluster={handleSelectCluster}
            onStartOnboarding={handleStartOnboarding}
            isLoggedIn={systemReady && masterContext}
          />
        );
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin">
        <div className="w-12 h-12 border-4 border-[#5E9BEB] border-t-transparent rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper">
      {/* Global Header */}
      <header className="app-header">
        <div className="header-content">
          <button
            className="brand-logo"
            onClick={() => setCurrentView('home')}
            style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            <img src="/ideas365-logo.png" alt="iDEAS365" style={{ height: '40px' }} />
          </button>

          <nav className="header-nav">
            {systemReady && masterContext && (
              <>
                <div className="context-badge">
                  <span className="badge-label">Brand:</span>
                  <span className="badge-value">{masterContext.brandNameTh}</span>
                </div>

                <div className="header-nav-buttons">
                  <button
                    className="neo-btn"
                    onClick={() => setCurrentView('tasks')}
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    📊 Tasks
                  </button>
                  <button
                    className="neo-btn"
                    onClick={() => setCurrentView('brands')}
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    🏢 Brands
                  </button>
                </div>
              </>
            )}

            {!masterContext && (
              <button
                className="neo-btn"
                style={{
                  fontSize: '12px',
                  padding: '8px 16px',
                  background: '#FF1493',
                  color: 'white'
                }}
                onClick={handleStartOnboarding}
              >
                + Setup Brand
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Suspense fallback={<LoadingSpinner />}>
          {renderView()}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2025 Social Factory x iDEAS365 | Powered by Generative AI</p>
        <p>
          {systemReady && masterContext
            ? `✅ System Ready | Brand: ${masterContext.brandNameTh}`
            : '⚙️ Complete Onboarding to unlock all features'}
        </p>
      </footer>

      {/* Global Styles */}
      <style>{`
        * {
          --c-magenta: #FF1493;
          --c-cyan: #00CED1;
          --c-yellow: #FFD700;
          --c-green: #00FF7F;
          --c-sapphire: #5E9BEB;
          --shadow-hard: 0 4px 12px rgba(0, 0, 0, 0.12);
          --shadow-hard-hover: 0 8px 24px rgba(0, 0, 0, 0.16);

          /* Dark mode variables (prepared for future use) */
          --dm-bg: #1a1a1a;
          --dm-surface: #2d2d2d;
          --dm-text: #ffffff;
          --dm-text-secondary: #b0b0b0;
        }

        .neo-btn {
          background: white;
          border: 2px solid #000;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
          font-family: inherit;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .neo-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: var(--shadow-hard-hover);
        }

        .neo-btn:active {
          transform: translate(0, 0);
        }

        .neo-box {
          background: white;
          border: 2px solid #000;
          border-radius: 8px;
          padding: 20px;
          box-shadow: var(--shadow-hard);
        }

        .app-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #fafafa;
        }

        .app-header {
          background: white;
          border-bottom: 2px solid #000;
          padding: 15px 20px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-logo {
          display: flex;
          align-items: center;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-nav-buttons {
          display: flex;
          gap: 10px;
        }

        .context-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f0f0f0;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-label {
          opacity: 0.6;
        }

        .badge-value {
          color: #FF1493;
        }

        .app-main {
          flex: 1;
          overflow-y: auto;
        }

        .app-footer {
          background: white;
          border-top: 2px solid #000;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }

        .app-footer p {
          margin: 5px 0;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 10px;
          }

          .header-nav {
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }

          .header-nav-buttons {
            flex-wrap: wrap;
            justify-content: center;
          }

          .neo-btn {
            font-size: 11px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;

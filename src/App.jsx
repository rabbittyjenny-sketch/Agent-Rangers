import React, { useState, useEffect } from 'react';
import './App.css';

// Import new components
import Hero from './components/Hero';
import AgentsGrid from './components/AgentsGrid';
import Onboarding from './components/Onboarding';

// Import legacy component (kept for backward compatibility)
import CaptionFactoryUpload from './components/CaptionFactory';

// Import services
import { orchestratorEngine } from './services/orchestratorEngine';
import { aiService } from './services/aiService';
import { databaseService } from './services/databaseService';

const App = () => {
  const [currentView, setCurrentView] = useState('hero'); // hero, agents, onboarding, caption-factory
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [masterContext, setMasterContext] = useState(null);
  const [systemReady, setSystemReady] = useState(false);

  // Load Master Context from localStorage on mount
  useEffect(() => {
    // Initialize database service and log status
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

  // Handle Cluster Selection
  const handleSelectCluster = (clusterId) => {
    setSelectedCluster(clusterId);
    setCurrentView('agents');
  };

  // Handle Onboarding Start
  const handleStartOnboarding = () => {
    setCurrentView('onboarding');
  };

  // Handle Onboarding Complete
  const handleOnboardingComplete = (context) => {
    // Save to localStorage
    localStorage.setItem('socialFactory_masterContext', JSON.stringify(context));

    // Initialize services with the new context
    setMasterContext(context);
    orchestratorEngine.setMasterContext(context);
    aiService.initialize(context);
    setSystemReady(true);

    // Show success message and return to hero
    alert(`✅ Onboarding Complete!\n\nBrand: ${context.brandNameTh}\nSystem is ready to help you!`);
    setCurrentView('hero');
  };

  // Handle Onboarding Cancel
  const handleOnboardingCancel = () => {
    setCurrentView('hero');
  };

  // Handle Agent Selection
  const handleSelectAgent = (agentId) => {
    console.log('Selected agent:', agentId);
    // In a real implementation, this would open a chat interface
    // For now, we're showing the chat in AgentsGrid component
  };

  // Handle Navigation Back
  const handleBack = () => {
    setSelectedCluster(null);
    setCurrentView('hero');
  };

  // Render different views
  const renderView = () => {
    switch (currentView) {
      case 'hero':
        return (
          <Hero
            onSelectCluster={handleSelectCluster}
            onStartOnboarding={handleStartOnboarding}
          />
        );

      case 'agents':
        return (
          <AgentsGrid
            clusterId={selectedCluster}
            onBack={handleBack}
            onSelectAgent={handleSelectAgent}
            masterContext={masterContext}
          />
        );

      case 'onboarding':
        return (
          <Onboarding
            onComplete={handleOnboardingComplete}
            onCancel={handleOnboardingCancel}
          />
        );

      case 'caption-factory':
        return <CaptionFactoryUpload />;

      default:
        return (
          <Hero
            onSelectCluster={handleSelectCluster}
            onStartOnboarding={handleStartOnboarding}
          />
        );
    }
  };

  return (
    <div className="app-wrapper">
      {/* Global Header */}
      <header className="app-header">
        <div className="header-content">
          <button
            className="brand-logo"
            onClick={() => setCurrentView('hero')}
            style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            <img src="/ideas365-logo.png" alt="iDEAS365" style={{ height: '40px' }} />
          </button>

          <nav className="header-nav">
            {systemReady && masterContext && (
              <div className="context-badge">
                <span className="badge-label">Brand:</span>
                <span className="badge-value">{masterContext.brandNameTh}</span>
              </div>
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
      <main className="app-main">{renderView()}</main>

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
          --shadow-hard: 0 4px 12px rgba(0, 0, 0, 0.12);
          --shadow-hard-hover: 0 8px 24px rgba(0, 0, 0, 0.16);
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
          }
        }
      `}</style>
    </div>
  );
};

export default App;

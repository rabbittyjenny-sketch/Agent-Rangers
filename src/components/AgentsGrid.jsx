import React, { useState } from 'react';
import { getAgentsByCluster, clusterMetadata } from '../data/agents';
import { ChevronLeft, MessageSquare, Zap } from 'lucide-react';

const AgentsGrid = ({ clusterId, onBack, onSelectAgent }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const agents = getAgentsByCluster(clusterId);
  const cluster = clusterMetadata[clusterId];

  if (!cluster) {
    return (
      <div className="error-state">
        <p>Cluster not found</p>
        <button onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const handleAgentSelect = (agentId) => {
    setSelectedAgent(agentId);
    onSelectAgent(agentId);
  };

  return (
    <div className="agents-grid-container">
      {/* Header */}
      <div className="agents-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
          Back
        </button>

        <div className="cluster-info">
          <span style={{ fontSize: '32px', marginRight: '10px' }}>{cluster.emoji}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px' }}>{cluster.name}</h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.6 }}>
              {cluster.nameTh}
            </p>
          </div>
        </div>

        <p className="cluster-description">{cluster.description}</p>
      </div>

      {/* Agents Grid */}
      <div className="agents-cards-grid">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`agent-card neo-box ${selectedAgent === agent.id ? 'active' : ''}`}
            style={{
              borderColor: agent.color,
              borderWidth: '2px',
              cursor: 'pointer',
              background: selectedAgent === agent.id ? `${agent.color}10` : 'white',
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleAgentSelect(agent.id)}
          >
            {/* Agent Header */}
            <div className="agent-header" style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '40px', marginRight: '10px' }}>{agent.emoji}</div>
              <div>
                <h3 style={{ color: agent.color, margin: '0 0 5px 0' }}>{agent.name}</h3>
                <p style={{ fontSize: '12px', margin: 0, opacity: 0.6 }}>{agent.nameEn}</p>
              </div>
            </div>

            {/* Description */}
            <p className="agent-description">{agent.descriptionTh}</p>

            {/* Capabilities */}
            <div className="agent-section">
              <p className="section-label">Capabilities:</p>
              <div className="tags">
                {agent.capabilities.slice(0, 4).map((cap) => (
                  <span key={cap} className="tag" style={{ backgroundColor: `${agent.color}20`, color: agent.color }}>
                    {cap}
                  </span>
                ))}
                {agent.capabilities.length > 4 && (
                  <span className="tag" style={{ backgroundColor: '#f0f0f0' }}>
                    +{agent.capabilities.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Business Functions */}
            <div className="agent-section">
              <p className="section-label">What can do:</p>
              <ul className="function-list">
                {agent.businessFunctions.slice(0, 3).map((func) => (
                  <li key={func}>{func}</li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <button
              className="neo-btn agent-cta"
              style={{
                background: agent.color,
                color: 'white',
                width: '100%',
                marginTop: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleAgentSelect(agent.id);
              }}
            >
              <MessageSquare size={16} />
              Chat with {agent.name}
            </button>
          </div>
        ))}
      </div>

      {/* Chat Interface (if agent selected) */}
      {selectedAgent && (
        <ChatInterface
          agentId={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {/* Styles */}
      <style>{`
        .agents-grid-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          animation: fadeIn 0.6s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .agents-header {
          margin-bottom: 40px;
        }

        .back-btn {
          background: none;
          border: 2px solid #ddd;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          border-color: #333;
          background: #f5f5f5;
        }

        .cluster-info {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .cluster-description {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .agents-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .agent-card {
          padding: 20px;
          background: white;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .agent-card:hover {
          box-shadow: var(--shadow-hard-hover);
          transform: translateY(-4px);
        }

        .agent-card.active {
          box-shadow: var(--shadow-hard-hover);
        }

        .agent-header {
          display: flex;
          align-items: center;
        }

        .agent-description {
          font-size: 13px;
          line-height: 1.5;
          color: #555;
          margin: 0 0 15px 0;
        }

        .agent-section {
          margin-bottom: 12px;
        }

        .section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          opacity: 0.6;
          margin: 0 0 8px 0;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          background: #f0f0f0;
          white-space: nowrap;
        }

        .function-list {
          margin: 0;
          padding-left: 18px;
          font-size: 12px;
        }

        .function-list li {
          margin-bottom: 4px;
          line-height: 1.4;
        }

        .agent-cta {
          font-size: 13px;
          padding: 10px;
        }

        .error-state {
          text-align: center;
          padding: 40px;
          background: #f5f5f5;
          border-radius: 12px;
        }

        @media (max-width: 768px) {
          .agents-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Chat Interface Component (Sub-component)
 */
const ChatInterface = ({ agentId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage = {
        id: Date.now() + 1,
        role: 'agent',
        content: `Response from Agent ${agentId} about: "${inputValue}"`,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, agentMessage]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Chat with Agent</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat">
            <p>Start a conversation with the agent...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}

        {isLoading && (
          <div className="message agent">
            <p><Zap size={14} /> Thinking...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask the agent..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          <MessageSquare size={18} />
        </button>
      </form>

      <style>{`
        .chat-interface {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 400px;
          max-height: 600px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-hard);
          z-index: 1000;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #eee;
          background: #f9f9f9;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
        }

        .empty-chat {
          text-align: center;
          color: #999;
          font-size: 12px;
          padding: 20px;
        }

        .message {
          margin-bottom: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.4;
        }

        .message.user {
          background: #FF1493;
          color: white;
          margin-left: 20px;
        }

        .message.agent {
          background: #f0f0f0;
          color: #333;
          margin-right: 20px;
        }

        .chat-input-form {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #eee;
        }

        .chat-input-form input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 12px;
          outline: none;
        }

        .chat-input-form input:focus {
          border-color: #FF1493;
        }

        .chat-input-form button {
          background: #FF1493;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .chat-input-form button:hover:not(:disabled) {
          background: #FF1493CC;
        }

        .chat-input-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chat-interface {
            width: calc(100vw - 40px);
            bottom: 10px;
            right: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentsGrid;

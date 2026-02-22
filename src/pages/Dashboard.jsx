import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, MessageSquare, Zap } from 'lucide-react';
import { getAllAgents } from '../data/agents';

export const Dashboard = ({ clusterId, onBack, onSelectAgent, masterContext }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCluster, setActiveCluster] = useState(clusterId || 'all');

  const allAgents = getAllAgents();

  const clusterConfig = {
    strategy: {
      label: 'Strategy',
      labelTh: 'วางกลยุทธ์',
      color: '#FF6B6B',
      bg: '#FFF0F0',
      border: '#FF6B6B',
      description: 'วิเคราะห์ตลาด กำหนดตำแหน่งแบรนด์ เข้าใจลูกค้า',
    },
    creative: {
      label: 'Creative',
      labelTh: 'สร้างสรรค์',
      color: '#FFB6C1',
      bg: '#FFF5F7',
      border: '#FF8FAB',
      description: 'ออกแบบ Visual System เสียง Brand เล่าเรื่อง',
    },
    growth: {
      label: 'Growth',
      labelTh: 'ขับเคลื่อนการเติบโต',
      color: '#00CED1',
      bg: '#F0FFFF',
      border: '#00CED1',
      description: 'สร้างคอนเทนต์ วางแผน Campaign วัดผล',
    },
  };

  const clusters = ['all', 'strategy', 'creative', 'growth'];

  const filteredAgents = allAgents.filter((agent) => {
    const matchesCluster = activeCluster === 'all' || agent.cluster === activeCluster;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      agent.name.toLowerCase().includes(q) ||
      agent.description.toLowerCase().includes(q) ||
      agent.keywords.some((k) => k.toLowerCase().includes(q));
    return matchesCluster && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '32px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#5E9BEB', fontWeight: 700, fontSize: 14, marginBottom: 24,
            }}
          >
            <ArrowLeft size={18} /> กลับ
          </button>

          <div style={{ marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 4 }}>
              🤖 10-Agent Ecosystem
            </h1>
            <p style={{ color: '#666', fontSize: 14 }}>
              {masterContext
                ? `Brand: ${masterContext.brandNameTh} · เลือก Agent ที่ต้องการ`
                : 'เลือก Agent ที่ต้องการพูดคุย'}
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}
        >
          <Search
            size={16}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }}
          />
          <input
            type="text"
            placeholder="ค้นหา agent หรือความสามารถ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 40px',
              border: '1.5px solid #E5E7EB', borderRadius: 8,
              fontSize: 14, outline: 'none', background: 'white',
              boxSizing: 'border-box',
            }}
          />
        </motion.div>

        {/* Cluster Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}
        >
          {clusters.map((c) => {
            const cfg = clusterConfig[c];
            const isActive = activeCluster === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCluster(c)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: `1.5px solid ${isActive ? (cfg?.color || '#5E9BEB') : '#E5E7EB'}`,
                  background: isActive ? (cfg?.bg || '#f0f0f0') : 'white',
                  color: isActive ? (cfg?.color || '#333') : '#666',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 2px 8px ${cfg?.color || '#5E9BEB'}22` : 'none',
                }}
              >
                {c === 'all' ? '🌐 ทั้งหมด' : `${cfg.label} — ${cfg.labelTh}`}
              </button>
            );
          })}
        </motion.div>

        {/* Cluster description */}
        {activeCluster !== 'all' && clusterConfig[activeCluster] && (
          <motion.p
            key={activeCluster}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              color: '#555', fontSize: 13, marginBottom: 20,
              padding: '10px 16px',
              background: clusterConfig[activeCluster].bg,
              borderLeft: `4px solid ${clusterConfig[activeCluster].color}`,
              borderRadius: '0 8px 8px 0',
            }}
          >
            {clusterConfig[activeCluster].description}
          </motion.p>
        )}

        {/* Agent count */}
        <p style={{ color: '#999', fontSize: 12, marginBottom: 16 }}>
          {filteredAgents.length} agents
          {searchQuery ? ` ที่ตรงกับ "${searchQuery}"` : ''}
        </p>

        {/* Agents Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {filteredAgents.map((agent) => {
            const cfg = clusterConfig[agent.cluster] || {};
            return (
              <motion.div
                key={agent.id}
                variants={itemVariants}
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                onClick={() => onSelectAgent(agent.id)}
                style={{
                  background: 'white',
                  border: '1px solid #F0F0F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Cluster stripe */}
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 4, background: cfg.color || '#ccc',
                  }}
                />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 28, lineHeight: 1,
                      width: 48, height: 48,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: cfg.bg || '#f5f5f5',
                      borderRadius: 10, flexShrink: 0,
                    }}
                  >
                    {agent.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 2 }}>
                      {agent.nameEn}
                    </h3>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 10, fontWeight: 600,
                        color: cfg.color || '#666',
                        background: cfg.bg || '#f5f5f5',
                        padding: '2px 8px', borderRadius: 4,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}
                    >
                      {agent.cluster}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.5, marginBottom: 12 }}>
                  {agent.description}
                </p>

                {/* Specialization */}
                <div style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 11, color: '#888',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Zap size={11} />
                    {agent.specialization}
                  </span>
                </div>

                {/* Output format badge */}
                <div
                  style={{
                    fontSize: 11, fontWeight: 600,
                    color: cfg.color || '#555',
                    padding: '4px 10px',
                    background: cfg.bg || '#f5f5f5',
                    borderRadius: 6, display: 'inline-block',
                    marginBottom: 12,
                  }}
                >
                  Output: {agent.outputFormat}
                </div>

                {/* Capabilities tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      style={{
                        fontSize: 10, padding: '3px 8px',
                        background: '#F8F9FC', color: '#666',
                        borderRadius: 4, border: '1px solid #EBEBEB',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span style={{ fontSize: 10, color: '#aaa', padding: '3px 0' }}>
                      +{agent.capabilities.length - 3} more
                    </span>
                  )}
                </div>

                {/* CTA */}
                <button
                  style={{
                    width: '100%', padding: '9px 0',
                    background: cfg.color || '#5E9BEB', color: 'white',
                    border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <MessageSquare size={14} />
                  เริ่มสนทนา
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredAgents.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: '#999', fontSize: 16 }}>ไม่พบ agent ที่ตรงกับการค้นหา</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

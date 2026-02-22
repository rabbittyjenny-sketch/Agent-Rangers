import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, Zap, BarChart3, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   Floating particle  (subtle, Neumorphism friendly)
───────────────────────────────────────────────────────────────── */
const Dot = ({ x, y, size, delay }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      left: `${x}%`, top: `${y}%`, width: size, height: size,
      background: 'rgba(94,155,235,0.18)',
    }}
    animate={{ y: [0, -12, 0], opacity: [0.1, 0.45, 0.1] }}
    transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

/* ─────────────────────────────────────────────────────────────────
   Cluster Card  —  Solace "Discovered Agents" card style
   with iDEAS365 Neumorphism surface
───────────────────────────────────────────────────────────────── */
const ICONS = { strategy: BarChart3, creative: Sparkles, growth: Zap };

const ClusterCard = ({ cluster, index, onSelect }) => {
  const Icon = ICONS[cluster.id] || Sparkles;
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '8px 8px 20px #d1d9e6, -8px -8px 20px #ffffff' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(cluster.id)}
      className="group relative w-full text-left neo-card p-6 transition-all duration-200 cursor-pointer"
      style={{ background: '#EFF2F9' }}
    >
      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{
            background: '#EFF2F9',
            boxShadow: `3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: cluster.color }} />
        </div>
        <span
          className="text-xs font-medium px-3 py-1 rounded-full font-en"
          style={{
            background: cluster.color + '15',
            color: cluster.color,
            border: `1px solid ${cluster.color}30`,
          }}
        >
          {cluster.agentCount} agents
        </span>
      </div>

      {/* Text */}
      <p className="font-bold text-slate-700 mb-1 font-en">{cluster.name}</p>
      <p className="text-sm text-slate-500 mb-3 font-sarabun">{cluster.nameTh}</p>
      <p className="text-slate-500 text-sm leading-relaxed font-sarabun">{cluster.description}</p>

      {/* CTA */}
      <div
        className="mt-5 flex items-center gap-1 text-xs font-semibold font-en"
        style={{ color: cluster.color }}
      >
        Click for details
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.button>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────────── */
export const HomePage = ({ onSelectCluster, onStartOnboarding, isLoggedIn, onOpenGuide }) => {
  const [phase, setPhase] = useState('splash'); // splash | ripple | main

  const dots = Array.from({ length: 12 }, (_, i) => ({
    id: i, x: 5 + (i * 8.2) % 90, y: 8 + (i * 13.5) % 84,
    size: 3 + (i % 3) * 2, delay: i * 0.3,
  }));

  const clusters = [
    {
      id: 'strategy', name: 'Strategy', nameTh: 'วางกลยุทธ์',
      description: 'วิเคราะห์ตลาด · กำหนดตำแหน่งแบรนด์ · เข้าใจ Customer Journey',
      agentCount: 3, color: '#e85d5d',
    },
    {
      id: 'creative', name: 'Creative', nameTh: 'สร้างตัวตนแบรนด์',
      description: 'Visual System · Brand Voice · เล่าเรื่องราวของแบรนด์',
      agentCount: 3, color: '#9061e5',
    },
    {
      id: 'growth', name: 'Growth', nameTh: 'ขับเคลื่อนการเติบโต',
      description: 'คอนเทนต์ · Campaign 30 วัน · Automation · Analytics KPI',
      agentCount: 4, color: '#059669',
    },
  ];

  /* ── Splash Screen ──────────────────────────────────────── */
  if (phase === 'splash') return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#EFF2F9' }}
    >
      {dots.map(d => <Dot key={d.id} {...d} />)}

      {/* Soft ambient circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
           style={{ background: 'rgba(94,155,235,0.07)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
           style={{ background: 'rgba(144,97,229,0.06)', filter: 'blur(80px)' }} />

      <div className="relative text-center px-6 select-none">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-7"
            style={{
              background: '#EFF2F9',
              boxShadow: '8px 8px 20px #d1d9e6, -8px -8px 20px #ffffff',
            }}
          >
            <Sparkles className="w-10 h-10" style={{ color: '#5E9BEB' }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl sm:text-6xl font-bold mb-3 tracking-tight font-en"
            style={{ color: '#334155' }}
          >
            Social Factory
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base font-sarabun"
            style={{ color: '#94a3b8' }}
          >
            AI-Powered Brand & Marketing Platform
          </motion.p>
        </motion.div>

        {/* Enter button */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.55 }}
        >
          <motion.button
            onClick={() => setPhase('ripple')}
            whileHover={{ boxShadow: '8px 8px 20px rgba(94,155,235,0.4), -4px -4px 12px rgba(255,255,255,0.9)' }}
            whileTap={{ scale: 0.96 }}
            className="group relative inline-flex items-center gap-3 font-semibold text-lg px-10 py-4 overflow-hidden"
            style={{
              background: '#5E9BEB',
              borderRadius: '999px',
              color: '#fff',
              boxShadow: '4px 4px 14px rgba(94,155,235,0.4), -2px -2px 8px rgba(255,255,255,0.7)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {/* shimmer */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              style={{
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)',
                width: '50%',
              }}
            />
            <span className="relative">Enter Tools</span>
            <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <p className="text-xs mt-5 font-en tracking-widest" style={{ color: '#cbd5e1' }}>
            PRESS TO CONTINUE
          </p>
        </motion.div>
      </div>
    </div>
  );

  /* ── Ripple transition ──────────────────────────────────── */
  if (phase === 'ripple') return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#EFF2F9' }}
    >
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 30, opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => setPhase('main')}
        className="w-6 h-6 rounded-full"
        style={{ background: '#5E9BEB' }}
      />
    </div>
  );

  /* ── Main Dashboard ─────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: '#EFF2F9' }}>
      {/* Ambient light */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full"
             style={{ background: 'rgba(94,155,235,0.05)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full"
             style={{ background: 'rgba(144,97,229,0.04)', filter: 'blur(120px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">

        {/* ── Nav bar — Solace style ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-12 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.7)' }}
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5 mr-auto">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#EFF2F9', boxShadow: '3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#5E9BEB' }} />
            </div>
            <span className="font-bold text-slate-700 font-en">Social Factory</span>
          </div>

          {/* Guide button */}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="neo-btn px-4 py-2 text-sm"
              style={{ fontSize: 13 }}
            >
              <BookOpen className="w-4 h-4" style={{ color: '#5E9BEB' }} />
              <span className="hidden sm:inline font-sarabun text-slate-600">คู่มือ</span>
            </button>
          )}

          {/* Status / CTA */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 neo-btn px-4 py-2" style={{ pointerEvents: 'none' }}>
              <div className="dot-online" />
              <span className="text-xs font-sarabun" style={{ color: '#059669' }}>System Ready</span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStartOnboarding}
              className="neo-btn-primary neo-btn px-5 py-2.5 text-sm font-sarabun"
            >
              + ตั้งค่าแบรนด์
            </motion.button>
          )}
        </motion.div>

        {/* ── Page title ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 font-en" style={{ color: '#334155' }}>
            Discovered Agents
          </h2>
          <p className="text-sm font-sarabun" style={{ color: '#94a3b8' }}>
            เลือก Cluster เพื่อดู AI Agent — 10 agents ใน 3 กลุ่มงาน
          </p>
        </motion.div>

        {/* ── Search row (decorative) ───────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2.5"
            style={{
              background: '#EFF2F9',
              borderRadius: 16,
              boxShadow: 'inset 3px 3px 8px #d1d9e6, inset -3px -3px 8px #ffffff',
              border: '1px solid rgba(255,255,255,0.5)',
              minWidth: 220,
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span className="text-sm font-en" style={{ color: '#94a3b8' }}>Search agents...</span>
          </div>
        </motion.div>

        {/* ── Cluster card grid ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {clusters.map((c, i) => (
            <ClusterCard key={c.id} cluster={c} index={i} onSelect={onSelectCluster} />
          ))}
        </div>

        {/* ── Footer row ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.7)' }}
        >
          <p className="text-xs font-en" style={{ color: '#cbd5e1' }}>
            © 2025 Social Factory × iDEAS365 · Powered by Claude AI
          </p>
          <div className="flex items-center gap-3 text-xs font-en" style={{ color: '#cbd5e1' }}>
            {['10 AI Agents', '6-Layer Quality Guard', 'Thai Language'].map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && <span>·</span>}
                <span>{t}</span>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, Zap, BarChart3, Users, ChevronRight } from 'lucide-react';

// ── Floating particle ──────────────────────────────────────────────────────
const Particle = ({ delay, x, y, size }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: 'rgba(94,155,235,0.25)' }}
    animate={{ y: [0, -18, 0], opacity: [0.2, 0.6, 0.2] }}
    transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

// ── Cluster card ───────────────────────────────────────────────────────────
const ClusterCard = ({ cluster, index, onSelect }) => {
  const icons = { strategy: BarChart3, creative: Sparkles, growth: Zap };
  const Icon = icons[cluster.id] || Sparkles;

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(cluster.id)}
      className="group relative w-full text-left rounded-2xl border border-white/8 overflow-hidden transition-all duration-300"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${cluster.color}18 0%, transparent 70%)` }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: cluster.color + '20' }}
          >
            <Icon className="w-5 h-5" style={{ color: cluster.color }} />
          </div>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ background: cluster.color + '15', color: cluster.color }}
          >
            {cluster.agentCount} agents
          </span>
        </div>

        <h3 className="font-bold text-white text-base mb-1">{cluster.nameTh}</h3>
        <p className="text-xs text-white/40 mb-3">{cluster.name}</p>
        <p className="text-white/50 text-sm leading-relaxed">{cluster.description}</p>

        <div className="mt-4 flex items-center gap-1 text-xs font-medium" style={{ color: cluster.color }}>
          เลือก Cluster
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
};

// ── Main HomePage ──────────────────────────────────────────────────────────
export const HomePage = ({ onSelectCluster, onStartOnboarding, isLoggedIn, onOpenGuide }) => {
  const [entered, setEntered] = useState(false);
  const [showMain, setShowMain] = useState(false);

  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 5 + (i * 8.5) % 90,
    y: 10 + (i * 13) % 80,
    size: 3 + (i % 4) * 2,
    delay: i * 0.3,
  }));

  const clusters = [
    {
      id: 'strategy',
      name: 'Strategy Cluster',
      nameTh: 'วางกลยุทธ์',
      description: 'วิเคราะห์ตลาด · กำหนดตำแหน่งแบรนด์ · เข้าใจ Customer Journey',
      agentCount: 3,
      color: '#FF6B6B',
    },
    {
      id: 'creative',
      name: 'Creative Cluster',
      nameTh: 'สร้างตัวตนแบรนด์',
      description: 'Visual System · Brand Voice · เล่าเรื่องราวของแบรนด์',
      agentCount: 3,
      color: '#A78BFA',
    },
    {
      id: 'growth',
      name: 'Growth Cluster',
      nameTh: 'ขับเคลื่อนการเติบโต',
      description: 'คอนเทนต์ · Campaign 30 วัน · Automation · Analytics KPI',
      agentCount: 4,
      color: '#34D399',
    },
  ];

  const handleEnter = () => {
    setEntered(true);
    setTimeout(() => setShowMain(true), 600);
  };

  // ── Splash screen ──────────────────────────────────────────────────────
  if (!entered) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center overflow-hidden relative">
        {/* Particles */}
        {particles.map(p => <Particle key={p.id} {...p} />)}

        {/* Mesh gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5E9BEB]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#A78BFA]/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative text-center px-6">
          {/* Logo pulse */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(94,155,235,0.3), rgba(167,139,250,0.3))', border: '1px solid rgba(94,155,235,0.3)' }}
            >
              <Sparkles className="w-9 h-9 text-[#5E9BEB]" />
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl font-bold text-white mb-3 tracking-tight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Social Factory
            </motion.h1>

            <motion.p
              className="text-white/40 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              AI-Powered Brand & Marketing Platform
            </motion.p>
          </motion.div>

          {/* Enter button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <motion.button
              onClick={handleEnter}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center gap-3 text-white font-semibold text-lg px-10 py-4 rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #5E9BEB, #7B6FEC)' }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ x: ['100%', '-100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', width: '60%' }}
              />
              <span className="relative">Enter Tools</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <p className="text-white/20 text-xs mt-4">กด Enter เพื่อเริ่มต้น</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Transition animation ───────────────────────────────────────────────
  if (!showMain) {
    return (
      <motion.div
        className="min-h-screen bg-[#0A0E1A] flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-4 h-4 rounded-full bg-[#5E9BEB]"
        />
      </motion.div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white overflow-x-hidden">
      {/* Subtle mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#5E9BEB]/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#A78BFA]/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-16">

        {/* Header row */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5E9BEB]/40 to-[#7B6FEC]/40 flex items-center justify-center border border-[#5E9BEB]/30">
              <Sparkles className="w-4.5 h-4.5 text-[#5E9BEB]" style={{ width: 18, height: 18 }} />
            </div>
            <span className="font-bold text-white text-lg">Social Factory</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGuide && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">คู่มือ</span>
              </motion.button>
            )}
            {!isLoggedIn && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartOnboarding}
                className="flex items-center gap-1.5 bg-[#5E9BEB] hover:bg-[#4A7BC9] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <span>+ ตั้งค่าแบรนด์</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          {isLoggedIn ? (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              <span className="text-[#34D399] text-sm font-medium">System Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="text-[#F59E0B] text-sm">ยังไม่ได้ตั้งค่าแบรนด์</span>
            </div>
          )}

          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
            เลือก AI Agent<br />
            <span className="text-[#5E9BEB]">ที่ต้องการใช้งาน</span>
          </h2>
          <p className="text-white/40 text-base max-w-lg">
            10 Agent ใน 3 กลุ่ม ช่วยสร้างกลยุทธ์ ตัวตนแบรนด์ และคอนเทนต์ครบวงจร
          </p>
        </motion.div>

        {/* Cluster cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {clusters.map((cluster, i) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              index={i}
              onSelect={onSelectCluster}
            />
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5"
        >
          <p className="text-white/25 text-xs">
            © 2025 Social Factory × iDEAS365 · Powered by Claude AI
          </p>
          <div className="flex items-center gap-4 text-white/30 text-xs">
            <span>10 AI Agents</span>
            <span>·</span>
            <span>6-Layer Quality Guard</span>
            <span>·</span>
            <span>Thai Language</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;

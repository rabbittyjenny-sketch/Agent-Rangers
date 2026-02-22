import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Paperclip, Send, MessageSquare, Zap, BarChart3, Sparkles, ArrowRight, ChevronDown, X } from 'lucide-react';

const steps = [
  {
    icon: '🏢',
    title: 'ตั้งค่าแบรนด์',
    titleEn: 'Brand Setup',
    desc: 'กรอกข้อมูลแบรนด์ของคุณ — ชื่อ, USP, กลุ่มเป้าหมาย, สี, โทนเสียง เพื่อให้ AI เข้าใจบริบทของคุณ',
    color: '#5E9BEB',
    bg: 'rgba(94,155,235,0.08)',
  },
  {
    icon: '🤖',
    title: 'เลือก AI Agent',
    titleEn: 'Choose Agent',
    desc: 'เลือก Agent ที่ตรงกับงาน — Strategy วางแผน, Creative สร้างตัวตน, Growth ขับเคลื่อนยอดขาย',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
  },
  {
    icon: '💬',
    title: 'เริ่มสนทนา',
    titleEn: 'Start Chatting',
    desc: 'พิมพ์หรือพูดสั่งงาน AI ด้วยภาษาไทย แนบไฟล์รูปหรือ PDF เพื่อวิเคราะห์ได้ทันที',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.08)',
  },
  {
    icon: '✨',
    title: 'รับผลลัพธ์',
    titleEn: 'Get Results',
    desc: 'AI ตอบกลับด้วยแผนกลยุทธ์, คอนเทนต์, หรือ framework ที่พร้อมใช้งานจริง มี Quality Check ทุกครั้ง',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
  },
];

const features = [
  {
    icon: <Mic className="w-5 h-5" />,
    title: 'Voice Input',
    titleTh: 'พูดภาษาไทยได้เลย',
    desc: 'กดปุ่ม 🎤 แล้วพูดคำสั่งเป็นภาษาไทย AI จะแปลงเสียงเป็นข้อความและตอบกลับทันที',
    color: '#5E9BEB',
  },
  {
    icon: <Paperclip className="w-5 h-5" />,
    title: 'File Attach',
    titleTh: 'แนบไฟล์ได้',
    desc: 'แนบรูปภาพ, PDF, Word หรือ Text เพื่อให้ AI ช่วยวิเคราะห์ข้อมูลจากไฟล์ของคุณโดยตรง',
    color: '#A78BFA',
  },
  {
    icon: <Send className="w-5 h-5" />,
    title: 'Smart Routing',
    titleTh: 'เลือก Agent อัตโนมัติ',
    desc: 'Orchestrator อ่านคำสั่งของคุณแล้วส่งงานให้ Agent ที่เหมาะสมที่สุดโดยอัตโนมัติ',
    color: '#34D399',
  },
];

const agents = [
  { cluster: 'Strategy', color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)', agents: ['Market Analyzer', 'Positioning Strategist', 'Customer Insight'], desc: 'วิเคราะห์ตลาด · กำหนดจุดยืน · เข้าใจลูกค้า' },
  { cluster: 'Creative', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', agents: ['Visual Strategist', 'Brand Voice', 'Narrative Designer'], desc: 'Visual System · เสียงแบรนด์ · เล่าเรื่อง' },
  { cluster: 'Growth', color: '#34D399', bg: 'rgba(52,211,153,0.1)', agents: ['Content Creator', 'Campaign Planner', 'Automation', 'Analytics'], desc: 'คอนเทนต์ · แคมเปญ · Automation · KPI' },
];

export const GuidePage = ({ onBack, onStartChat }) => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: 'ต้องกรอกข้อมูลแบรนด์ก่อนไหม?', a: 'แนะนำให้กรอกค่ะ เพราะ AI จะใช้ข้อมูลแบรนด์ของคุณเป็นบริบทในการตอบ ทำให้ผลลัพธ์ตรงกับธุรกิจมากขึ้น แต่ถ้ายังไม่พร้อม สามารถ Skip เพื่อทดลองใช้ก่อนได้เลย' },
    { q: 'Voice Input รองรับภาษาอะไรบ้าง?', a: 'รองรับภาษาไทยเป็นหลัก (TH-TH) และภาษาอังกฤษ ต้องใช้ browser ที่รองรับ Web Speech API เช่น Chrome หรือ Edge' },
    { q: 'แนบไฟล์ประเภทไหนได้บ้าง?', a: 'รองรับ รูปภาพ (JPG, PNG, GIF), PDF, Word (.doc, .docx), และ Text ขนาดสูงสุด 10MB ต่อไฟล์' },
    { q: 'ผลลัพธ์จาก AI ถูกต้องแค่ไหน?', a: 'ระบบมี 6-Layer Data Guard ตรวจสอบทุกคำตอบก่อนส่งถึงคุณ รวมถึง Fact Check, USP Grounding, และ Consistency Check กับข้อมูลแบรนด์ของคุณ' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white overflow-x-hidden">

      {/* Back button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            ปิดคู่มือ
          </button>
          <motion.button
            onClick={onStartChat}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-[#5E9BEB] hover:bg-[#4A7BC9] text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            เริ่มใช้งาน
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-20">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#5E9BEB]/10 border border-[#5E9BEB]/20 rounded-full px-4 py-1.5 text-[#5E9BEB] text-sm mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            คู่มือการใช้งาน Social Factory
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            AI Agent ที่รู้จัก<br />
            <span className="text-[#5E9BEB]">แบรนด์ของคุณ</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            ระบบ Multi-Agent AI ที่ช่วยสร้างกลยุทธ์และคอนเทนต์ครบวงจร เพียงบอกข้อมูลแบรนด์ แล้วเลือก Agent ที่ต้องการ
          </p>
        </motion.div>

        {/* How it works */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
          className="mb-16"
        >
          <h2 className="text-xl font-bold mb-8 text-center text-white/80">วิธีการทำงาน</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 * i + 0.3 } }}
                className="rounded-2xl border border-white/5 p-5 flex gap-4"
                style={{ background: step.bg }}
              >
                <div className="text-3xl flex-shrink-0">{step.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: step.color + '22', color: step.color }}>
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Key Features: Voice + Attach */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.4 } }}
          className="mb-16"
        >
          <h2 className="text-xl font-bold mb-2 text-center text-white/80">ฟีเจอร์เด่น</h2>
          <p className="text-center text-white/40 text-sm mb-8">รองรับการสั่งงานหลายรูปแบบ</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 * i + 0.5 } }}
                className="rounded-2xl border border-white/5 bg-white/3 p-5"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: f.color + '20', color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-0.5">{f.title}</h3>
                <p className="text-xs text-white/40 mb-2">{f.titleTh}</p>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Voice demo visual */}
          <div className="mt-6 rounded-2xl border border-[#5E9BEB]/20 bg-[#5E9BEB]/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 bg-[#5E9BEB]/20 rounded-xl flex items-center justify-center">
                <Mic className="w-5 h-5 text-[#5E9BEB]" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">พูดแทนพิมพ์ได้เลย</p>
                <p className="text-white/40 text-xs">กดปุ่ม 🎤 แล้วพูดเป็นภาษาไทย</p>
              </div>
            </div>
            <div className="flex-1 bg-[#0A0E1A]/60 rounded-xl p-3 font-mono text-sm">
              <span className="text-white/30 text-xs">ตัวอย่างคำสั่งเสียง:</span>
              <p className="text-[#5E9BEB] mt-1">"ช่วยวิเคราะห์ SWOT ของแบรนด์ฉันหน่อย"</p>
              <p className="text-white/40 mt-0.5">"สร้างแคปชั่น Instagram 5 แบบ"</p>
              <p className="text-white/40">"วางแผน Campaign 30 วัน"</p>
            </div>
          </div>
        </motion.section>

        {/* Agent clusters */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.6 } }}
          className="mb-16"
        >
          <h2 className="text-xl font-bold mb-2 text-center text-white/80">10 AI Agents แบ่งเป็น 3 กลุ่ม</h2>
          <p className="text-center text-white/40 text-sm mb-8">แต่ละ Agent เชี่ยวชาญด้านที่แตกต่างกัน</p>
          <div className="space-y-4">
            {agents.map((cluster, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.1 * i + 0.7 } }}
                className="rounded-2xl border border-white/5 p-5"
                style={{ background: cluster.bg }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-2 h-full min-h-[40px] rounded-full flex-shrink-0 mt-1" style={{ background: cluster.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{cluster.cluster} Cluster</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cluster.color + '22', color: cluster.color }}>
                        {cluster.agents.length} agents
                      </span>
                    </div>
                    <p className="text-white/40 text-sm mb-3">{cluster.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {cluster.agents.map((agent, j) => (
                        <span key={j} className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-white/70">
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.8 } }}
          className="mb-16"
        >
          <h2 className="text-xl font-bold mb-8 text-center text-white/80">คำถามที่พบบ่อย</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/5 bg-white/3 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <span className="text-white/80 text-sm font-medium">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-white/40 flex-shrink-0 ml-3 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-4 text-white/50 text-sm leading-relaxed border-t border-white/5 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 1 } }}
          className="text-center"
        >
          <div className="rounded-3xl border border-[#5E9BEB]/20 bg-gradient-to-br from-[#5E9BEB]/10 to-[#A78BFA]/10 p-10">
            <h3 className="text-2xl font-bold mb-3">พร้อมเริ่มใช้งานแล้ว!</h3>
            <p className="text-white/50 mb-6 text-sm">กลับไปตั้งค่าแบรนด์แล้วเลือก Agent ที่ต้องการ</p>
            <motion.button
              onClick={onStartChat}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 bg-[#5E9BEB] hover:bg-[#4A7BC9] text-white font-semibold px-8 py-3.5 rounded-2xl transition-colors text-sm"
            >
              เริ่มใช้งาน Social Factory
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GuidePage;

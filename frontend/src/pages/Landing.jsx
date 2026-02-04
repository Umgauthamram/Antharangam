import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence
} from 'framer-motion';
import {
  Globe, Search, Twitter, Facebook, Instagram, Linkedin, MessageCircle, Send,
  Shield, ArrowRight, Zap, Database, GitBranch, Lock, Layers, Terminal,
  FileText, MousePointer, Cpu
} from 'lucide-react';



// --- Shared Components ---

const FloatingShape = ({ className, speed = 1, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
    animate={{
      y: [0, -30 * speed, 0],
      x: [0, 20 * speed, 0],
      scale: [1, 1.1, 1],
      rotate: [0, 10, -10, 0]
    }}
    transition={{
      duration: 10 / speed,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay
    }}
  />
);

const TypewriterText = ({ text, className }) => {
  const chars = text.split('');
  return (
    <span className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: i * 0.05 }}
        >
          {char}
        </motion.span>
      ))}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-[3px] h-[1em] bg-peacock-500 ml-1 align-middle"
      />
    </span>
  );
};

// --- Sections ---

const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Parallax Background */}
      <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
        <FloatingShape className="w-[600px] h-[600px] bg-peacock-600 top-[-10%] left-[-10%]" speed={0.5} />
        <FloatingShape className="w-[500px] h-[500px] bg-purple-600 top-[20%] right-[-10%]" speed={0.7} delay={2} />
        <FloatingShape className="w-[300px] h-[300px] bg-blue-500 bottom-[-10%] left-[20%]" speed={1.2} delay={1} />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
   

          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
            <span className="block mb-2">INTELLIGENCE</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-peacock-400 to-purple-500">
              <TypewriterText text="REDEFINED." />
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The fully autonomous OSINT platform. <br className="hidden md:block" />
            Harvest, Analyze, and Report with military-grade precision.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow flex items-center gap-2"
              >
                <Zap size={20} className="fill-black" /> Deploy System
              </motion.button>
            </Link> */}
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-black font-semibold text-lg rounded-xl  backdrop-blur-sm transition-colors"
              >
                Access Console
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 flex flex-col items-center gap-2"
      >
        <div className="text-xs font-mono uppercase tracking-widest">Scroll to Initialize</div>
        <div className="w-px h-12 bg-gradient-to-b from-peacock-500 to-transparent" />
      </motion.div>
    </section>
  );
};

const SupportedPlatforms = () => {
  const platforms = [
    { icon: Globe, name: "Web", color: "text-blue-400" },
    { icon: Lock, name: "Private", color: "text-red-400" },
    { icon: Twitter, name: "X / Twitter", color: "text-white" },
    { icon: Facebook, name: "Facebook", color: "text-blue-600" },
    { icon: Instagram, name: "Instagram", color: "text-pink-500" },
    { icon: Linkedin, name: "LinkedIn", color: "text-blue-500" },
    { icon: MessageCircle, name: "Reddit", color: "text-orange-500" },
    { icon: Send, name: "Telegram", color: "text-sky-400" },
  ];

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-32 bg-[#0B0C10] relative z-20">
      <div className="max-w-7xl mx-auto px-6" ref={containerRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Omni-Channel Surveillance</h2>
          <p className="text-slate-400"> unified ingestion pipeline for all major digital battlegrounds.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {platforms.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 group cursor-pointer relative overflow-hidden"
            >
              {/* Connecting Line Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-peacock-500/30 to-transparent" />
                <div className="absolute left-0 top-1/2 w-full h-px bg-gradient-to-r from-transparent via-peacock-500/30 to-transparent" />
              </div>

              <div className={`p-4 rounded-xl bg-slate-900 group-hover:scale-110 transition-transform duration-300 shadow-lg ${p.color}`}>
                <p.icon size={32} strokeWidth={1.5} />
              </div>
              <span className="font-mono text-sm text-slate-300 font-bold tracking-wide">{p.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StorySection = () => {
  const cards = [
    {
      title: "1. Target Acquisition",
      desc: "Define keywords, hashtags, or user profiles. The system initiates autonomous harvester swarms.",
      icon: Search,
      color: "text-blue-400",
      bg: "bg-blue-500",
      border: "group-hover:border-blue-500/50"
    },
    {
      title: "2. Data Ingestion",
      desc: "Raw unstructured data is normalized, deduplicated, and stored in an immutable forensic ledger.",
      icon: Database,
      color: "text-purple-400",
      bg: "bg-purple-500",
      border: "group-hover:border-purple-500/50"
    },
    {
      title: "3. ML Enrichment",
      desc: "Local AI models attempt OCR, Speech-to-Text, and Object Detection on all gathered media.",
      icon: Cpu,
      color: "text-teal-400",
      bg: "bg-teal-500",
      border: "group-hover:border-teal-500/50"
    },
    {
      title: "4. Risk Scoring",
      desc: "Content is scored for sentiment, threat level, and illegality based on Indian Penal Code definitions.",
      icon: Shield,
      color: "text-red-400",
      bg: "bg-red-500",
      border: "group-hover:border-red-500/50"
    },
    {
      title: "5. Case Report",
      desc: "One-click generation of court-admissible PDF dossiers with complete chain-of-custody metadata.",
      icon: FileText,
      color: "text-green-400",
      bg: "bg-green-500",
      border: "group-hover:border-green-500/50"
    },
  ];

  return (
    <section className="bg-[#0B0C10] py-24 md:py-40 relative overflow-hidden">
      {/* Global Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="mb-32 md:mb-48 max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.85]"
          >
            The Intelligence <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Lifecycle.</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-6 text-slate-400 font-mono text-lg md:text-xl"
          >
            <div className="w-14 h-14 rounded-full border border-teal-500/30 flex items-center justify-center animate-bounce bg-teal-500/5 backdrop-blur">
              <ArrowRight className="text-teal-400 rotate-90" size={28} />
            </div>
            <span>SCROLL TO EXPLORE THE PIPELINE</span>
          </motion.div>
        </div>

        {/* Vertical Sticky Stack */}
        <div className="flex flex-col pb-40">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.8, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`sticky top-0 group rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl bg-[#0E0F14] mb-12 sm:mb-24 last:mb-0 transition-all duration-500 ${card.border}`}
              style={{
                top: `calc(10vh + ${i * 50}px)`,
                height: '75vh',
                zIndex: i + 1,
              }}
            >
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                {/* Animated SVG Backgrounds */}
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 120 + (i * 20), ease: "linear", repeat: Infinity }}
                  className={`absolute -right-20 -top-20 h-[150%] w-[150%] md:w-2/3 md:h-full opacity-10 pointer-events-none ${card.color}`}
                  viewBox="0 0 400 400"
                >
                  <defs>
                    <pattern id={`grid-${i}`} width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                    <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Shapes */}
                  {i % 3 === 0 && (
                    <>
                      <circle cx="200" cy="200" r="180" fill={`url(#grad-${i})`} stroke="currentColor" strokeWidth="1" strokeDasharray="10 20" />
                      <rect x="100" y="100" width="200" height="200" stroke="currentColor" strokeWidth="2" fill="none" transform="rotate(45 200 200)" />
                    </>
                  )}
                  {i % 3 === 1 && (
                    <>
                      <path d="M200,20 L380,330 L20,330 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="200" cy="220" r="100" fill={`url(#grad-${i})`} />
                    </>
                  )}
                  {i % 3 === 2 && (
                    <>
                      <rect x="50" y="50" width="300" height="300" rx="40" stroke="currentColor" strokeWidth="1" fill="none" />
                      <path d="M0 0 L400 400" stroke="currentColor" strokeWidth="2" />
                      <path d="M400 0 L0 400" stroke="currentColor" strokeWidth="2" />
                    </>
                  )}
                </motion.svg>

                {/* Spotlight Gradient Blob */}
                <div className={`absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 ${card.bg}`} />
              </div>

              {/* Card Content Layout */}
              <div className="relative h-full flex flex-col md:flex-row p-8 md:p-20 gap-8 md:gap-20 z-10">
                {/* Big ID Number */}
                <div className="absolute top-8 right-10 text-[10rem] md:text-[14rem] font-black text-white/[0.03] font-mono select-none leading-none -z-10 tracking-tighter">
                  0{i + 1}
                </div>

                {/* Left Column: Icon & Title */}
                <div className="flex flex-col justify-center max-w-2xl">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl ${card.bg} flex items-center justify-center text-white mb-10 shadow-2xl ring-4 ring-white/10`}
                  >
                    <card.icon size={48} className="md:w-12 md:h-12" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight"
                  >
                    {card.title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg md:text-2xl text-slate-400 font-light leading-relaxed max-w-xl"
                  >
                    {card.desc}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const InteractiveGraph = () => {
  // Fixed positions [top%, left%]
  const nodes = [
    { id: 101, top: 15, left: 20 },
    { id: 102, top: 25, left: 75 },
    { id: 103, top: 50, left: 15 },
    { id: 104, top: 60, left: 80 },
    { id: 105, top: 80, left: 30 },
    { id: 106, top: 75, left: 60 },
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-[#0B0C10] flex flex-col items-center">
      <div className="text-center mb-16 max-w-3xl">
        <span className="text-peacock-500 font-mono text-sm tracking-widest uppercase mb-2 block">Network Forensics</span>
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Visual Link Analysis</h2>
        <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
          Don't just read data. See the connections. Our local graph engine builds relationships in real-time.
        </p>
      </div>

      <div className="relative w-full max-w-6xl aspect-[4/3] md:aspect-[21/9] bg-[#0E0F13] rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center group">

        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Central Hub */}
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative z-20 w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-peacock-600 shadow-[0_0_60px_rgba(15,118,110,0.5)]"
        >
          <GitBranch className="text-white w-8 h-8" />
        </motion.div>

        {/* Connecting Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
          {nodes.map((node, i) => (
            <motion.line
              key={`line-${i}`}
              x1="50%"
              y1="50%"
              x2={`${node.left}%`}
              y2={`${node.top}%`}
              stroke="#0F766E"
              strokeWidth="2"
              strokeOpacity="0.3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
            />
          ))}
        </svg>

        {/* Simulated Graph Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute"
            style={{ top: `${node.top}%`, left: `${node.left}%` }}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 100,
              delay: 0.2 + (i * 0.1)
            }}
          >
            <div className="flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="w-4 h-4 bg-peacock-400 rounded-full mb-3 shadow-[0_0_20px_rgba(45,212,191,0.6)] cursor-pointer ring-4 ring-peacock-500/20"
              />
              <div className="bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold text-slate-300 border border-slate-700 whitespace-nowrap shadow-xl">
                TARGET_{node.id}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-black pt-32 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-peacock-900/20 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-peacock-600 rounded-xl flex items-center justify-center shadow-lg shadow-peacock-500/20">
                <Shield className="text-white fill-white/20" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">Antharangam</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Decentralized OSINT infrastructure for the modern investigator. Secure, fast, and local.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-slate-400">
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Harvester Engine</li>
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Link Analysis</li>
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Report Generator</li>
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">API Docs</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-slate-400">
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Community Hub</li>
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Security Whitepaper</li>
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Deployment Guide</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-slate-400">
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-peacock-400 cursor-pointer transition-colors">Compliance</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-slate-600 text-sm">
          <p>© 2026 Antharangam Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Globe className="hover:text-white cursor-pointer transition-colors" size={20} />
            <Twitter className="hover:text-white cursor-pointer transition-colors" size={20} />
            <Linkedin className="hover:text-white cursor-pointer transition-colors" size={20} />
            <div className="flex items-center gap-2 text-peacock-500 bg-peacock-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-peacock-500" />
              All Systems Operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Main Layout ---

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="bg-[#0B0C10] min-h-screen text-slate-200 selection:bg-peacock-500 selection:text-white overflow-x-hidden">
      {/* Smooth Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-peacock-500 to-purple-600 origin-left z-50 shadow-[0_0_10px_rgba(15,118,110,0.5)]"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav className="fixed w-full z-40 top-0 px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight text-lg">Antharangam</span>
          </div>
          {/* <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <a href="#" className="hover:text-white transition-colors">Technology</a>
            <a href="#" className="hover:text-white transition-colors">Solutions</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
          </div> */}
          <div className="flex gap-4">
            <Link to="/login" className=" bg-peacock-600 text-white rounded-lg text-sm font-medium px-4 py-2">Login</Link>
            {/* <Link to="/signup" className="bg-white text-black text-sm font-bold px-5 py-2 rounded-lg hover:bg-slate-200 transition-colors shadow-lg shadow-white/10">Get Started</Link> */}
          </div>
        </div>
      </nav>

      <HeroSection />
      <SupportedPlatforms />
      <StorySection />
      <InteractiveGraph />

      {/* Final CTA */}
      <section className="py-32 px-6 flex justify-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl w-full bg-gradient-to-br from-peacock-900 via-[#0B0C10] to-purple-900 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden border border-white/10"
        >
          <FloatingShape className="w-96 h-96 bg-peacock-500 top-[-20%] right-[-10%]" speed={0.5} />

          <div className="relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">
              Ready to take command?
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              Join elite investigation units already using Antharangam to secure the digital frontier.
            </p>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white text-black font-bold text-xl rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all"
              >
                Request Access
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}


// import React from 'react';
// import { Link } from 'react-router-dom';
// import { ShieldCheck, LogIn, ArrowRight, DatabaseZap, Cpu, Siren, FileCheck } from 'lucide-react';
// import { useDarkMode } from '/src/hooks/useDarkMode.js'; 
// import { motion } from 'framer-motion'; 

// const heroContent = {
//   headline: "Decentralized OSINT Platform",
//   subheadline: "Providing district-level EOW & Cyber Crime units with a self-hosted, low-cost tool to continuously detect, triage, and produce court-ready evidence.",
//   cta1: "Investigator Login",
//   cta2: "Request Access"
// };

// const features = [
//   {
//     icon: DatabaseZap,
//     name: "Harvest",
//     description: "Automatically scrape public posts from X, Telegram, and the Dark Web in real-time."
//   },
//   {
//     icon: Cpu,
//     name: "Process",
//     description: "Extract key intelligence (Phones, UPIs, Bank Accounts) using AI and OCR."
//   },
//   {
//     icon: Siren,
//     name: "Detect",
//     description: "Use a powerful rule engine to flag high-risk posts and notify investigators instantly."
//   },
//   {
//     icon: FileCheck,
//     name: "Export",
//     description: "Generate 'forensically-defensible' evidence packages with immutable chain-of-custody."
//   }
// ];

// const tech = ["Python", "MongoDB", "IPFS / Pinata", "spaCy (NER)", "Tesseract (OCR)", "snscrape", "telethon"];

// export default function Landing() {
//   const [isDarkMode] = useDarkMode();

//   return (
//     <div className={isDarkMode ? 'dark' : ''}>
//       <div className="bg-primary text-primary min-h-screen">
//         <Navbar />
//         <main>
//           <Hero />
//           <Features />
//           <Technology />
//         </main>
//         <Footer /> 
//       </div>
//     </div>
//   );
// }


// function Navbar() {
//   return (
//     <motion.nav 
//       initial={{ y: -100 }}
//       animate={{ y: 0 }}
//       transition={{ type: 'spring', stiffness: 50, delay: 0.5 }}
//       className="fixed top-0 left-0 w-full bg-primary/80 backdrop-blur-md border-b border-primary z-50"
//     >
//       <div className="container mx-auto px-6 py-4 flex justify-between items-center">
//         <div className="flex items-center gap-2">
//           <ShieldCheck className="w-8 h-8 text-peacock-600" />
//           <span className="text-2xl font-bold text-primary">Antharangam</span>
//         </div>
//         <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//           <Link 
//             to="/login" 
//             className="flex items-center px-4 py-2 font-medium text-white bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none focus:ring-2 focus:ring-peacock-300 shadow-lg"
//           >
//             Investigator Login
//             <LogIn className="w-4 h-4 ml-2" />
//           </Link>
//         </motion.div>
//       </div>
//     </motion.nav> 
//   );
// }

// function Hero() {
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1
//       }
//     }
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: 'spring', stiffness: 100 }
//     }
//   };

//   return (
//     <section className="pt-40 pb-20 bg-subtle overflow-hidden">
//       <div className="container mx-auto px-6 text-center">
//         <motion.div
//           variants={containerVariants}
//           initial="hidden"
//           animate="visible"
//         >
//           <motion.h1 
//             variants={itemVariants}
//             className="text-5xl lg:text-6xl font-extrabold text-primary leading-tight"
//           >
//             {heroContent.headline}
//           </motion.h1>
//           <motion.p 
//             variants={itemVariants}
//             className="mt-6 text-lg lg:text-xl text-secondary max-w-3xl mx-auto"
//           >
//             {heroContent.subheadline}
//           </motion.p>
//           <motion.div 
//             variants={itemVariants}
//             className="flex justify-center gap-4 mt-10"
//           >
//             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//               <Link 
//                 to="/login" 
//                 className="flex items-center px-6 py-3 font-medium text-white bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none focus:ring-2 focus:ring-peacock-300 shadow-lg"
//               >
//                 {heroContent.cta1}
//                 <ArrowRight className="w-5 h-5 ml-2" />
//               </Link>
//             </motion.div>
//             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//               <Link 
//                 to="/signup"
//                 className="flex items-center px-6 py-3 font-medium text-primary bg-subtle border border-primary rounded-lg hover:bg-primary"
//               >
//                 {heroContent.cta2}
//               </Link>
//             </motion.div>
//           </motion.div>
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// function Features() {
//   const cardVariants = {
//     hidden: { y: 50, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: 'spring', stiffness: 100 }
//     }
//   };

//   return (
//     <section className="py-20 bg-primary">
//       <div className="container mx-auto px-6">
//         <motion.div 
//           className="text-center mb-12"
//           initial={{ y: 20, opacity: 0 }}
//           whileInView={{ y: 0, opacity: 1 }}
//           viewport={{ once: true, amount: 0.5 }}
//           transition={{ duration: 0.5 }}
//         >
//           <h2 className="text-4xl font-bold text-primary">How It Works</h2>
//           <p className="mt-4 text-lg text-secondary">A complete, automated intelligence lifecycle.</p>
//         </motion.div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//           {features.map((feature, index) => (
//             <motion.div
//               key={feature.name}
//               variants={cardVariants}
//               initial="hidden"
//               whileInView="visible"
//               viewport={{ once: true, amount: 0.3 }}
//               transition={{ delay: index * 0.1 }}
//               whileHover={{ scale: 1.03, y: -5 }}
//               className="bg-subtle p-6 rounded-lg shadow-lg border border-primary cursor-pointer"
//             >
//               <div className="flex items-center justify-center w-12 h-12 bg-peacock-900 text-peacock-300 rounded-full">
//                 <feature.icon className="w-6 h-6" />
//               </div>
//               <h3 className="mt-5 text-xl font-semibold text-primary">{feature.name}</h3>
//               <p className="mt-2 text-base text-secondary">{feature.description}</p>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// function Technology() {
//   return (
//     <section className="py-20 bg-subtle">
//       <div className="container mx-auto px-6">
//         <motion.div 
//           className="text-center"
//           initial={{ y: 20, opacity: 0 }}
//           whileInView={{ y: 0, opacity: 1 }}
//           viewport={{ once: true, amount: 0.5 }}
//           transition={{ duration: 0.5 }}
//         >
//           <h2 className="text-4xl font-bold text-primary">Open, Auditable, & Cost-Friendly</h2>
//           <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
//             Built on a modern, open-source stack to ensure minimal cost, transparency, and flexibility.
//           </p>
//           <div className="flex flex-wrap justify-center gap-3 mt-8">
//             {tech.map((t) => (
//               <motion.span 
//                 key={t} 
//                 className="px-4 py-2 bg-primary border border-primary rounded-full text-secondary font-medium"
//                 initial={{ opacity: 0, scale: 0.5 }}
//                 whileInView={{ opacity: 1, scale: 1 }}
//                 viewport={{ once: true, amount: 0.5 }}
//               >
//                 {t}
//               </motion.span>
//             ))}
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// function Footer() {
//   return (
//     <footer className="py-8 bg-primary border-t border-primary">
//       <div className="container mx-auto px-6 text-center text-secondary">
//         <p>&copy; {new Date().getFullYear()} Offence Click. All rights reserved.</p>
//         <p className="text-sm mt-2">For Authorized Law Enforcement Use Only.</p>
//       </div>
//     </footer>
//   );
// }

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Satellite, BrainCircuit, ScanFace, Network,
  ShieldCheck, Activity, Terminal, ShieldAlert
} from 'lucide-react';

// --- Sub-Components ---

const ParticleBackground = () => {
  // Simple CSS-based particle simulation for the hero
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-peacock-teal/20 via-transparent to-transparent" />
      <div className="absolute h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
    </div>
  );
};

const TypingEffect = ({ text }) => {
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [text]);

  return <span className="font-mono text-neon-cyan">{displayText}<span className="animate-pulse">_</span></span>;
};

const RadarScanner = () => (
  <div className="relative w-64 h-64 border-2 border-peacock-teal/30 rounded-full flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(15,118,110,0.4)_50%,transparent_100%)] animate-[spin_4s_linear_infinite]" />
    <div className="z-10 w-full h-[1px] bg-neon-cyan/50 absolute top-1/2" />
    <div className="z-10 h-full w-[1px] bg-neon-cyan/50 absolute left-1/2" />
    <div className="z-20 text-xs font-mono text-peacock-teal">SCANNING...</div>
  </div>
);

const LiveLogStream = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    const intervals = setInterval(() => {
      const newLog = `ID_${Math.random().toString(16).slice(2, 8).toUpperCase()} > INGESTING_DATA_STREAM... ${Math.random() > 0.5 ? 'OK' : 'PENDING'}`;
      setLogs(prev => [newLog, ...prev].slice(0, 8));
    }, 1500);
    return () => clearInterval(intervals);
  }, []);

  return (
    <div className="bg-black/40 border border-peacock-teal/20 p-4 rounded-lg font-mono text-[10px] text-peacock-teal h-48 overflow-hidden">
      <div className="flex items-center gap-2 mb-2 border-b border-peacock-teal/20 pb-1">
        <Activity size={12} className="animate-pulse" />
        <span className="uppercase tracking-widest">Live Ingestion Pipeline</span>
      </div>
      {logs.map((log, i) => (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="mb-1">
          {`[${new Date().toLocaleTimeString()}] ${log}`}
        </motion.div>
      ))}
    </div>
  );
};

// --- Main Page ---

export default function AntharangamLanding() {
  return (
    <div className="bg-cyber-black text-slate-200 min-h-screen selection:bg-peacock-teal selection:text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 backdrop-blur-md border-b border-white/10 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-peacock-teal rounded-sm rotate-45 flex items-center justify-center border border-neon-cyan">
            <Terminal size={16} className="-rotate-45 text-white" />
          </div>
          <span className="font-bold tracking-tighter text-xl uppercase">Antharangam</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-mono text-slate-400">
          <a href="#" className="hover:text-neon-cyan transition-colors">OPERATIONS</a>
          <a href="#" className="hover:text-neon-cyan transition-colors">INTEL_DRIVE</a>
          <a href="#" className="hover:text-neon-cyan transition-colors">SEC_PROTOCOL</a>
        </div>

        {sessionStorage.getItem('token') ? (
          <Link to="/dashboard" className="px-4 py-2 bg-peacock-teal text-white hover:bg-teal-600 transition-all text-xs font-mono inline-flex items-center gap-2 shadow-[0_0_10px_rgba(15,118,110,0.5)]">
            <Activity size={12} /> ACCESS CONSOLE
          </Link>
        ) : (
          <Link to="/login" className="px-4 py-2 border border-peacock-teal text-peacock-teal hover:bg-peacock-teal hover:text-white transition-all text-xs font-mono inline-block">
            SYSTEM_LOGIN
          </Link>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-8 flex flex-col items-center text-center overflow-hidden">
        <ParticleBackground />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10"
        >
          <span className="text-peacock-teal font-mono text-sm tracking-widest mb-4 block">STATUS: MISSION READY // CORE_V2.0</span>
          <h1 className="text-5xl md:text-7xl font-sans font-black mb-6 tracking-tight">
            <TypingEffect text="See Beyond the Surface." />
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-lg mb-10 leading-relaxed">
            Advanced OSINT & AI-powered threat detection for the modern digital battlefield.
            Deconstruct networks. Neutralize threats.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="bg-peacock-teal px-8 py-4 rounded-none font-mono font-bold hover:bg-teal-700 transition-all shadow-[0_0_20px_rgba(15,118,110,0.4)] inline-block">
              LAUNCH WORKBENCH
            </Link>
            <Link to="/signup" className="bg-white/5 backdrop-blur-sm border border-white/10 px-8 py-4 rounded-none font-mono hover:bg-white/10 transition-all inline-block">
              REQUEST ACCESS
            </Link>
          </div>
        </motion.div>

        {/* Hero Visual: Radar Scan over Data Points */}
        <motion.div
          className="mt-20 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <RadarScanner />
          <div className="absolute -top-10 -right-20 hidden lg:block">
            <LiveLogStream />
          </div>
        </motion.div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Multi-Vector Harvesters", icon: Satellite, desc: "Autonomous scrapers for Instagram, Facebook, Telegram, and X." },
            { title: "AI Risk Profiling", icon: BrainCircuit, desc: "Real-time NLP analysis to flag threats, hate speech, and radicalization." },
            { title: "Deepfake Detection", icon: ScanFace, desc: "Forensic media analysis to identify synthetic imagery and manipulation." },
            { title: "Link Analysis", icon: Network, desc: "Visual relationship mapping between targets and hidden networks." }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-white/5 border border-white/10 hover:border-peacock-teal/50 transition-all group"
            >
              <feature.icon className="text-peacock-teal mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="font-mono text-lg font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Intelligence Section (Dashboard Mockup) */}
      <section className="py-24 px-8 bg-gradient-to-b from-transparent to-peacock-teal/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-3xl font-bold font-mono uppercase tracking-tighter">Command Dashboard</h2>
            <div className="h-1 w-20 bg-peacock-teal mt-4" />
          </div>

          <motion.div
            style={{ perspective: 1000, rotateX: 15 }}
            className="w-full aspect-video bg-slate-900 border-[12px] border-slate-800 rounded-xl shadow-2xl overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay" />
            <div className="grid grid-cols-12 h-full">
              <div className="col-span-3 border-r border-white/5 p-4 space-y-4">
                <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-20 w-full bg-peacock-teal/10 rounded" />
                <div className="h-20 w-full bg-white/5 rounded" />
              </div>
              <div className="col-span-9 p-6">
                <div className="flex justify-between mb-8">
                  <div className="h-8 w-48 bg-white/5 rounded" />
                  <div className="h-8 w-8 bg-neon-cyan/20 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-white/5 border border-white/10 rounded p-2">
                      <div className="h-full w-full bg-[linear-gradient(90deg,transparent_50%,rgba(15,118,110,0.1)_50%)] bg-[length:10px_10px]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Overlay Scan Line */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-neon-cyan/5 to-transparent h-20 w-full top-0 animate-[scan_3s_linear_infinite]" />
          </motion.div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
          {["End-to-End Encryption", "Law Enforcement Grade", "PBKDF2 Hashing", "Role-Based Access"].map((badge, idx) => (
            <div key={idx} className="flex items-center gap-2 font-mono text-xs tracking-tighter">
              <ShieldCheck size={16} className="text-peacock-teal" />
              {badge}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-peacock-teal rotate-45 border border-neon-cyan" />
              <span className="font-bold uppercase tracking-tighter">Antharangam</span>
            </div>
            <p className="text-slate-500 text-sm">Decentralized Social Media Forensics. The new standard in digital intelligence.</p>
          </div>
          <div className="flex gap-16 md:justify-center font-mono text-xs text-slate-400">
            <div className="space-y-3">
              <a href="#" className="block hover:text-white transition-colors">DOCUMENTATION</a>
              <a href="#" className="block hover:text-white transition-colors">API_STATUS</a>
            </div>
            <div className="space-y-3">
              <a href="#" className="block hover:text-white transition-colors">PRIVACY_POLICY</a>
              <a href="#" className="block hover:text-white transition-colors">CONTACT_SUPPORT</a>
            </div>
          </div>
          <div className="md:text-right font-mono text-xs text-slate-500">
            © 2026 ANTHARANGAM. ALL RIGHTS RESERVED.<br />
            SYSTEM_TIME: {new Date().getFullYear()}.04.12_14:00:00
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes scan {
          from { top: -20%; }
          to { top: 120%; }
        }
      `}</style>
    </div>
  );
}
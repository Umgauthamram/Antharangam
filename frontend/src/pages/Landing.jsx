

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, LogIn, ArrowRight, DatabaseZap, Cpu, Siren, FileCheck } from 'lucide-react';
import { useDarkMode } from '/src/hooks/useDarkMode.js'; 
import { motion } from 'framer-motion'; 

const heroContent = {
  headline: "Decentralized OSINT Platform",
  subheadline: "Providing district-level EOW & Cyber Crime units with a self-hosted, low-cost tool to continuously detect, triage, and produce court-ready evidence.",
  cta1: "Investigator Login",
  cta2: "Request Access"
};

const features = [
  {
    icon: DatabaseZap,
    name: "Harvest",
    description: "Automatically scrape public posts from X, Telegram, and the Dark Web in real-time."
  },
  {
    icon: Cpu,
    name: "Process",
    description: "Extract key intelligence (Phones, UPIs, Bank Accounts) using AI and OCR."
  },
  {
    icon: Siren,
    name: "Detect",
    description: "Use a powerful rule engine to flag high-risk posts and notify investigators instantly."
  },
  {
    icon: FileCheck,
    name: "Export",
    description: "Generate 'forensically-defensible' evidence packages with immutable chain-of-custody."
  }
];

const tech = ["Python", "MongoDB", "IPFS / Pinata", "spaCy (NER)", "Tesseract (OCR)", "snscrape", "telethon"];

export default function Landing() {
  const [isDarkMode] = useDarkMode();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="bg-primary text-primary min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Technology />
        </main>
        <Footer /> 
      </div>
    </div>
  );
}


function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 50, delay: 0.5 }}
      className="fixed top-0 left-0 w-full bg-primary/80 backdrop-blur-md border-b border-primary z-50"
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-peacock-600" />
          <span className="text-2xl font-bold text-primary">Antharangam</span>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link 
            to="/login" 
            className="flex items-center px-4 py-2 font-medium text-white bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none focus:ring-2 focus:ring-peacock-300 shadow-lg"
          >
            Investigator Login
            <LogIn className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>
      </div>
    </motion.nav> 
  );
}

function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <section className="pt-40 pb-20 bg-subtle overflow-hidden">
      <div className="container mx-auto px-6 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-5xl lg:text-6xl font-extrabold text-primary leading-tight"
          >
            {heroContent.headline}
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="mt-6 text-lg lg:text-xl text-secondary max-w-3xl mx-auto"
          >
            {heroContent.subheadline}
          </motion.p>
          <motion.div 
            variants={itemVariants}
            className="flex justify-center gap-4 mt-10"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/login" 
                className="flex items-center px-6 py-3 font-medium text-white bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none focus:ring-2 focus:ring-peacock-300 shadow-lg"
              >
                {heroContent.cta1}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/signup"
                className="flex items-center px-6 py-3 font-medium text-primary bg-subtle border border-primary rounded-lg hover:bg-primary"
              >
                {heroContent.cta2}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };
  
  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-12"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-primary">How It Works</h2>
          <p className="mt-4 text-lg text-secondary">A complete, automated intelligence lifecycle.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="bg-subtle p-6 rounded-lg shadow-lg border border-primary cursor-pointer"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-peacock-900 text-peacock-300 rounded-full">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-primary">{feature.name}</h3>
              <p className="mt-2 text-base text-secondary">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Technology() {
  return (
    <section className="py-20 bg-subtle">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-primary">Open, Auditable, & Cost-Friendly</h2>
          <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
            Built on a modern, open-source stack to ensure minimal cost, transparency, and flexibility.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {tech.map((t) => (
              <motion.span 
                key={t} 
                className="px-4 py-2 bg-primary border border-primary rounded-full text-secondary font-medium"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
              >
                {t}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 bg-primary border-t border-primary">
      <div className="container mx-auto px-6 text-center text-secondary">
        <p>&copy; {new Date().getFullYear()} Offence Click. All rights reserved.</p>
        <p className="text-sm mt-2">For Authorized Law Enforcement Use Only.</p>
      </div>
    </footer>
  );
}
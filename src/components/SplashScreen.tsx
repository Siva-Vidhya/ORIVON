import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#FDFCFB] overflow-hidden">
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FDFCFB] via-[#F7F5F2] to-[#FDFCFB] opacity-50" />
      
      <div className="relative flex flex-col items-center text-center">
        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
            transition: {
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1]
            }
          }}
          className="relative"
        >
          {/* Logo Pulse Effect */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-[var(--color-brand)] blur-3xl rounded-full"
            style={{ margin: '-20%' }}
          />

          {/* Main Logo */}
          <div className="w-24 h-24 bg-slate-900 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl relative z-10">
            F
          </div>
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { delay: 0.6, duration: 0.8 }
          }}
          className="mt-8 space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            FlowState <span className="text-[var(--color-brand)]">OS</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">
            Your AI Productivity Operating System
          </p>
        </motion.div>

        {/* Loading Indicator (Subtle) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: { delay: 1.5, duration: 1 }
          }}
          className="absolute bottom-[-80px] flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-1.5 h-1.5 bg-slate-300 rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

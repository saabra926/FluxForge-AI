"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#06080f]">
      {/* Background atmosphere for consistency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-30"
          style={{ 
            background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15), transparent 60%)" 
          }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Animated logo/icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.1, 1],
            opacity: 1,
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut" 
          }}
          className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)] relative overflow-hidden group"
          style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)" }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-white/10 rounded-[2rem]"
          />
          <Zap size={40} className="text-white fill-white relative z-10 drop-shadow-lg" />
        </motion.div>

        {/* Loading text with shimmer */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <h2 className="font-heading font-black text-3xl text-white tracking-tighter uppercase">
              FluxForge <span className="text-blue-500">AI</span>
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400/80 mt-1">
              Neural Design Engine
            </p>
          </motion.div>
          
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
                className="w-1.5 h-1.5 rounded-full bg-blue-400"
              />
            ))}
          </div>
        </div>

        {/* Progress bar hint */}
        <motion.div 
          className="w-56 h-1.5 bg-white/5 rounded-full overflow-hidden mt-4 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity
            }}
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[10px] font-mono text-white/30 tracking-[0.2em] mt-2 uppercase"
        >
          Initializing Neural Core...
        </motion.p>
      </div>
    </div>
  );
}

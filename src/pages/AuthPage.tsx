import React from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/app/today");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-16 lg:mt-0 relative w-full h-[calc(100vh-100px)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1000px] bg-card/60 backdrop-blur-2xl border border-white/5 rounded-[40px] flex md:flex-row flex-col overflow-hidden shadow-2xl"
      >
        {/* Left Side - Image/Vibe */}
        <div className="hidden md:flex md:w-1/2 relative bg-obsidian p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <img src="https://picsum.photos/seed/nightlife/800/1000" alt="Vibe" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center glow-gold mb-6">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="font-serif text-4xl text-marble mb-4">Step into the collective ritual.</h2>
            <p className="text-marble/50 text-sm max-w-sm">
              Your identity encrypts your presence. Connect with the city's pulse securely.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h1 className="font-serif text-3xl mb-2">Identify Yourself</h1>
            <p className="text-sm text-marble/50">Enter your credentials to access the forum.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-marble/60 mb-2 font-medium">Email or Handle</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  className="w-full bg-void/50 border border-white/10 rounded-xl px-4 py-3 text-marble outline-none focus:border-gold/50 focus:bg-void transition-colors"
                  placeholder="wanderer@city.com"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-marble/60 mb-2 font-medium">Passphrase</label>
                <input 
                  type="password" 
                  className="w-full bg-void/50 border border-white/10 rounded-xl px-4 py-3 text-marble outline-none focus:border-gold/50 focus:bg-void transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-void text-gold focus:ring-gold/20" />
                <span className="text-xs text-marble/60 hover:text-marble transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-xs text-gold hover:text-gold-pale transition-colors">Lost your key?</button>
            </div>

            <button type="submit" className="mt-4 w-full bg-marble text-void font-medium tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-pale transition-colors group">
              Enter
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <p className="text-xs text-marble/50">
                New to the city? <button type="button" className="text-gold hover:text-gold-pale uppercase tracking-widest font-medium ml-1">Initiate</button>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

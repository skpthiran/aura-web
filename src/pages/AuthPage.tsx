import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setLoading(false);
      setError("Connection timeout. Please try again.");
    }, 10000);

    try {
      if (isLogin) {
        console.log('Attempting sign in...');
        await signIn(email, password);
        if (timedOut) return;
        clearTimeout(timeoutId);
        console.log('Sign in result received');
        console.log('Navigating to app...');
        navigate("/app/today");
      } else {
        if (!username) throw new Error("A pseudonym is required for the initiation.");
        console.log('Attempting sign up...');
        await signUp(email, password, username);
        if (timedOut) return;
        clearTimeout(timeoutId);
        console.log('Sign up result received');
        setSuccess(true);
      }
    } catch (err: unknown) {
      if (timedOut) return;
      clearTimeout(timeoutId);
      console.log('Auth error caught:', err);
      setError(err instanceof Error ? err.message : "An unexpected spectral error occurred.");
      setLoading(false);
    } finally {
      // If we haven't timed out, and we are not in the success track, ensure loading is off
      if (!timedOut) {
        setLoading(false);
      }
    }
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
            <h2 className="font-serif text-4xl text-marble mb-4">
              {isLogin ? "Step into the collective ritual." : "Begin your transformation."}
            </h2>
            <p className="text-marble/50 text-sm max-w-sm">
              {isLogin 
                ? "Your identity encrypts your presence. Connect with the city's pulse securely."
                : "A new presence is felt. Register your frequency to join the global resonance."}
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h1 className="font-serif text-3xl mb-2">{isLogin ? "Identify Yourself" : "Initiate Frequency"}</h1>
            <p className="text-sm text-marble/50">
              {isLogin ? "Enter your credentials to access the forum." : "Create your digital signature to enter the city."}
            </p>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 border border-gold/20">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-serif text-xl mb-2 text-gold-pale">Check Your Transmission</h3>
              <p className="text-sm text-marble/60 mb-6 font-mono tracking-tighter">
                A verification link has been sent to your terminal (email). Confirm to materialize.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="text-xs uppercase tracking-widest text-gold hover:text-gold-pale transition-colors font-medium"
              >
                Back to Entrance
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-xs"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="block text-xs uppercase tracking-[0.15em] text-marble/60 mb-2 font-medium">Pseudonym</label>
                    <input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="off"
                      className="w-full bg-void/50 border border-white/10 rounded-xl px-4 py-3 text-marble outline-none focus:border-gold/50 focus:bg-void transition-colors"
                      placeholder="e.g. wanderer_01"
                    />
                  </motion.div>
                )}
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-marble/60 mb-2 font-medium">Terminal Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                    className="w-full bg-void/50 border border-white/10 rounded-xl px-4 py-3 text-marble outline-none focus:border-gold/50 focus:bg-void transition-colors"
                    placeholder="wanderer@city.com"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-marble/60 mb-2 font-medium">Secret Passphrase</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-void/50 border border-white/10 rounded-xl px-4 py-3 text-marble outline-none focus:border-gold/50 focus:bg-void transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-void text-gold focus:ring-gold/20" />
                    <span className="text-xs text-marble/60 hover:text-marble transition-colors font-mono tracking-tighter">Remember frequency</span>
                  </label>
                  <button type="button" className="text-xs text-gold hover:text-gold-pale transition-colors font-mono tracking-tighter uppercase">Lost your key?</button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="mt-4 w-full bg-marble text-void font-bold tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-pale transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Enter" : "Initialize"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-8 text-center border-t border-white/5 pt-6">
                <p className="text-xs text-marble/50 font-mono tracking-tighter">
                  {isLogin ? "New to the city? " : "Already registered? "}
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                    }}
                    className="text-gold hover:text-gold-pale uppercase tracking-widest font-medium ml-1 transition-colors"
                  >
                    {isLogin ? "Initiate" : "Identify"}
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

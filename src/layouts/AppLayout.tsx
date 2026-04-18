import { useState } from "react";
import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Map as MapIcon, Plus, Landmark, MessageSquareText, Bell, User, Shield, Settings, LogOut, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  { path: "/app/today", label: "Pulse", icon: Compass },
  { path: "/app/map", label: "Forum", icon: MapIcon },
  { path: "/app/create", label: "Summon", icon: Plus, isAction: true },
  { path: "/app/events", label: "Colosseum", icon: Landmark },
  { path: "/app/chat", label: "Agora", icon: MessageSquareText },
  { path: "/app/signals", label: "Signals", icon: Bell },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsSigningOut(false);
      setIsProfileMenuOpen(false);
    }
  };

  const displayName = profile?.full_name || profile?.username || user?.email?.split("@")[0] || "Wanderer";
  const userTier = "Luminous Tier"; // Placeholder for now

  return (
    <div className="min-h-screen bg-void text-marble flex flex-col md:flex-row overflow-hidden relative selection:bg-gold/20">
      {/* Premium Architectural Left Rail */}
      <aside className="hidden md:flex flex-col w-[100px] hairline-r bg-void/90 backdrop-blur-3xl py-10 z-20 items-center shrink-0 border-white/5">
        
        {/* Top Logo */}
        <Link to="/app" className="mb-16 group relative w-full flex justify-center cursor-pointer">
          <div className="w-10 h-10 rounded-full hairline-all flex items-center justify-center group-hover:border-gold/50 group-hover:bg-white/5 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-500">
            <span className="font-serif text-lg text-gold-pale transition-transform duration-500 group-hover:scale-110">A</span>
          </div>

          {/* Luxury Hover Capsule: Logo */}
          <div className="absolute left-[76px] top-1/2 -translate-y-1/2 h-9 px-4 flex items-center rounded-full bg-void border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,1)] backdrop-blur-xl opacity-0 scale-95 origin-left -translate-x-3 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-400 ease-[0.16,1,0.3,1] pointer-events-none whitespace-nowrap z-50">
            <span className="w-1.5 h-1.5 rounded-full mr-3 shadow-[0_0_8px_currentColor] bg-gold text-gold" />
            <span className="micro-caps tracking-[0.2em] mt-0.5 text-marble/90 uppercase">AURA OS</span>
          </div>
        </Link>
        
        <nav className="flex flex-col gap-6 flex-1 items-center w-full">
          {NAV_ITEMS.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className="group relative flex items-center justify-center w-full h-10 mb-1"
            >
              {({ isActive }) => (
                 <>
                  {/* Active Edge Indicator */}
                  {isActive && !item.isAction && (
                    <motion.div 
                      layoutId="rail-indicator" 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-gold-pale rounded-r-sm shadow-[0_0_12px_rgba(212,175,55,0.6)]" 
                    />
                  )}

                  {/* Icon Container */}
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 relative",
                    item.isAction 
                      ? "hairline-all bg-void text-gold group-hover:bg-gold/5 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                      : isActive 
                        ? "bg-white/5 text-gold-pale shadow-[inset_0_0_10px_rgba(255,255,255,0.02),0_10px_20px_rgba(0,0,0,0.5)] border border-white/10" 
                        : "text-marble/40 group-hover:text-marble group-hover:bg-white/5 border border-transparent group-hover:border-white/5 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]"
                  )}>
                    <item.icon 
                       className={cn("w-[22px] h-[22px] transition-all duration-500", isActive && !item.isAction && "drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]")} 
                       strokeWidth={isActive ? 2 : 1.5} 
                    />
                  </div>

                  {/* Luxury Hover Capsule: Navigation Labels */}
                  <div className="absolute left-[76px] top-1/2 -translate-y-1/2 h-9 px-4 flex items-center rounded-full bg-void border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,1)] backdrop-blur-xl opacity-0 scale-95 origin-left -translate-x-3 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-400 ease-[0.16,1,0.3,1] pointer-events-none whitespace-nowrap z-[60]">
                    <span 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full mr-3 shadow-[0_0_8px_currentColor] transition-colors", 
                        isActive ? "bg-gold text-gold" : "bg-marble/30 text-marble/30 group-hover:bg-marble/60 group-hover:text-marble/60"
                      )} 
                    />
                    <span className={cn(
                      "micro-caps tracking-[0.2em] mt-0.5 transition-colors",
                      isActive ? "text-gold-pale" : "text-marble/90"
                    )}>
                      {item.label}
                    </span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom utility: Avatar */}
        <div className="relative mt-8 mb-4 w-full flex justify-center group cursor-pointer">
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={cn(
              "w-10 h-10 rounded-full bg-deep hairline-all overflow-hidden flex items-center justify-center transition-all duration-500 relative outline-none",
              isProfileMenuOpen 
                ? "border-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-110" 
                : "group-hover:border-gold/50 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110"
            )}
          >
            <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className={cn(
                "w-full h-full object-cover transition-all duration-500 relative z-0",
                 isProfileMenuOpen ? "grayscale-0 opacity-100" : "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
              )} referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5 text-marble/20" />
            )}
          </button>
          
          {/* Luxury Hover Capsule: Avatar */}
          {!isProfileMenuOpen && (
            <div className="absolute left-[76px] top-1/2 -translate-y-1/2 h-9 px-4 flex items-center rounded-full bg-void border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,1)] backdrop-blur-xl opacity-0 scale-95 origin-left -translate-x-3 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-400 ease-[0.16,1,0.3,1] pointer-events-none whitespace-nowrap z-[60]">
              <span className="w-1.5 h-1.5 rounded-full mr-3 shadow-[0_0_8px_currentColor] bg-marble/30 text-marble/30 group-hover:bg-marble/60 group-hover:text-marble/60" />
              <span className="micro-caps tracking-[0.2em] mt-0.5 text-marble/90 uppercase">Identity</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-y-auto h-[100dvh] pb-24 md:pb-0 z-10 scroll-smooth">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, filter: "blur(12px)", scale: 0.98 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(12px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-card/90 backdrop-blur-3xl hairline-all rounded-full flex items-center justify-between px-2 z-50 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-gold/5 to-transparent pointer-events-none" />
        {NAV_ITEMS.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 relative z-10 ml-1",
              isActive ? "text-gold-pale" : "text-marble/40 hover:text-marble",
              item.isAction && "bg-void hairline-all text-gold shadow-[0_0_20px_rgba(212,175,55,0.15)] -mt-6 h-14 w-14"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(item.isAction ? "w-6 h-6" : "w-5 h-5")} strokeWidth={isActive ? 2 : 1.5} />
                {isActive && !item.isAction && (
                  <motion.div 
                    layoutId="mobileNavIndicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-gold-pale shadow-[0_0_8px_rgba(253,229,171,1)]" 
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
        {/* Mobile Profile Avatar */}
        <button 
          onClick={() => setIsProfileMenuOpen(true)}
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-full hairline-all overflow-hidden z-10 transition-all active:scale-95 group mr-1 outline-none",
            isProfileMenuOpen ? "border-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]" : "hover:border-gold/50"
          )}
        >
          <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className={cn(
              "w-full h-full object-cover transition-all duration-500",
               isProfileMenuOpen ? "grayscale-0 opacity-100 scale-110" : "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110"
            )} referrerPolicy="no-referrer" />
          ) : (
            <User className="w-5 h-5 text-marble/40" />
          )}
        </button>
      </nav>

      {/* Profile Popover / Sheet */}
      <AnimatePresence>
        {isProfileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-void/60 backdrop-blur-md md:bg-transparent md:backdrop-blur-none" 
              onClick={() => setIsProfileMenuOpen(false)} 
            />

            {/* Desktop Floating Menu */}
            <motion.div
              initial={{ opacity: 0, x: -10, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, y: 10, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:block fixed z-[70] left-[110px] bottom-10 w-64 bg-card/95 backdrop-blur-3xl hairline-all shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden pointer-events-auto"
            >
              <div className="p-6 border-b border-white/5 bg-void/50">
                <p className="font-serif text-xl text-marble truncate">{displayName}</p>
                <p className="font-mono text-[10px] text-gold-pale uppercase mt-1 tracking-widest">{userTier}</p>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <Link to="/app/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm transition-colors text-marble/60 hover:text-marble group">
                  <User className="w-4 h-4 group-hover:text-gold transition-colors" /> <span className="text-sm font-medium tracking-wide">View Identity</span>
                </Link>
                <Link to="/app/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm transition-colors text-marble/60 hover:text-marble group">
                  <Shield className="w-4 h-4 group-hover:text-gold transition-colors" /> <span className="text-sm font-medium tracking-wide">Edit Profile</span>
                </Link>
                <Link to="/app/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm transition-colors text-marble/60 hover:text-marble group">
                  <Settings className="w-4 h-4 group-hover:text-gold transition-colors" /> <span className="text-sm font-medium tracking-wide">Configurations</span>
                </Link>
              </div>
              <div className="p-2 border-t border-white/5 bg-void/30">
                <button 
                  onClick={handleSignOut} 
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-crimson/10 rounded-sm transition-colors text-crimson hover:text-crimson-bright group disabled:opacity-50"
                >
                  {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  <span className="text-sm font-medium tracking-wide">Sever Connection</span>
                </button>
              </div>
            </motion.div>

            {/* Mobile Bottom Sheet */}
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed z-[70] inset-x-0 bottom-0 bg-card/95 backdrop-blur-3xl hairline-t shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-8 rounded-t-[32px] overflow-hidden pointer-events-auto"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-4" />
              <div className="p-6 pt-2 border-b border-white/5 flex items-center gap-4 bg-void/50">
                <div className="w-16 h-16 rounded-full hairline-all overflow-hidden shrink-0 flex items-center justify-center bg-deep">
                   {profile?.avatar_url ? (
                     <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     <User className="w-8 h-8 text-marble/20" />
                   )}
                </div>
                <div>
                  <p className="font-serif text-3xl text-marble -mt-1 truncate max-w-[200px]">{displayName}</p>
                  <p className="font-mono text-[10px] text-gold-pale uppercase mt-1 tracking-widest">{userTier}</p>
                </div>
              </div>
              <div className="p-4 flex flex-col space-y-2">
                <Link to="/app/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-4 px-4 py-4 hover:bg-white/5 rounded-2xl transition-colors text-marble/80 hover:text-marble">
                  <div className="w-10 h-10 rounded-full bg-void hairline-all flex items-center justify-center text-gold"><User className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">View Identity</span>
                </Link>
                <Link to="/app/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-4 px-4 py-4 hover:bg-white/5 rounded-2xl transition-colors text-marble/80 hover:text-marble">
                  <div className="w-10 h-10 rounded-full bg-void hairline-all flex items-center justify-center text-gold"><Shield className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">Edit Profile</span>
                </Link>
                <Link to="/app/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-4 px-4 py-4 hover:bg-white/5 rounded-2xl transition-colors text-marble/80 hover:text-marble">
                  <div className="w-10 h-10 rounded-full bg-void hairline-all flex items-center justify-center text-gold"><Settings className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">Configurations</span>
                </Link>
                <button 
                  onClick={handleSignOut} 
                  disabled={isSigningOut}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-crimson/10 rounded-2xl transition-colors text-crimson mt-2 border-t border-white/5 disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-void hairline-all border-crimson/30 flex items-center justify-center text-crimson">
                    {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium">Sever Connection</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

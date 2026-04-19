import { useState } from "react";
import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Map as MapIcon, Plus, Building2, MessageSquare, Landmark, MessageSquareText, Bell, User, Shield, Settings, LogOut, Loader2 } from "lucide-react";
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

const mobileNavItems = [
  { to: '/app/today', icon: Compass, label: 'Pulse' },
  { to: '/app/map', icon: MapIcon, label: 'Forum' },
  { to: '/app/create', icon: Plus, label: 'Create' },
  { to: '/app/events', icon: Building2, label: 'Events' },
  { to: '/app/chat', icon: MessageSquare, label: 'Chat' },
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
    <div className="min-h-screen bg-void text-marble flex flex-col lg:flex-row overflow-hidden relative selection:bg-gold/20">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50
        bg-void/95 backdrop-blur-xl border-b border-white/10
        flex items-center justify-between px-5 py-3 safe-area-pt">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-gold/40 
            flex items-center justify-center">
            <span className="font-serif text-sm text-gold">A</span>
          </div>
          <span className="font-serif text-marble text-lg tracking-wide">
            Aura
          </span>
        </div>
        
        {/* Right side: notifications + profile */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <NavLink to="/app/signals">
            <button className="w-9 h-9 rounded-full glass-panel hairline-all
              flex items-center justify-center text-marble/40 
              hover:text-marble transition-colors relative">
              <Bell className="w-4 h-4" />
              {/* Notification dot */}
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 
                rounded-full bg-crimson-bright" />
            </button>
          </NavLink>
          
          {/* Profile avatar */}
          <Link to="/app/profile">
            <div className="w-9 h-9 rounded-full border border-white/20
              bg-marble/10 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} 
                  className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="font-serif text-sm text-marble/60">
                  {(profile?.full_name ?? user?.email ?? 'A')[0].toUpperCase()}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Premium Architectural Left Rail */}
      <aside className="hidden lg:flex flex-col w-[280px] hairline-r bg-void/90 backdrop-blur-3xl py-10 z-20 shrink-0 border-white/5">
        
        {/* Top Logo */}
        <Link to="/app" className="mb-12 px-8 group relative w-full flex items-center gap-4 cursor-pointer">
          <div className="w-10 h-10 rounded-full hairline-all flex items-center justify-center group-hover:border-gold/50 group-hover:bg-white/5 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-500">
            <span className="font-serif text-lg text-gold-pale transition-transform duration-500 group-hover:scale-110">A</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl text-marble tracking-wide">Aura</span>
            <span className="micro-caps text-[9px] text-gold-pale/50 tracking-[0.3em]">VERSION 2.0.4</span>
          </div>
        </Link>
        
        <nav className="flex flex-col gap-2 flex-1 w-full px-4">
          {NAV_ITEMS.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => cn(
                "group relative flex items-center w-full px-4 py-3 rounded-xl transition-all duration-500",
                isActive && !item.isAction 
                  ? "bg-white/5 text-gold-pale shadow-[inset_0_0_10px_rgba(255,255,255,0.02),0_10px_20px_rgba(0,0,0,0.5)] border border-white/10" 
                  : "text-marble/40 hover:text-marble hover:bg-white/5 border border-transparent hover:border-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]"
              )}
            >
              {({ isActive }) => (
                 <>
                  {/* Active Indicator Bar */}
                  {isActive && !item.isAction && (
                    <motion.div 
                      layoutId="active-bar" 
                      className="absolute left-0 w-[3px] h-6 bg-gold-pale rounded-r-full shadow-[0_0_12px_rgba(212,175,55,0.6)]" 
                    />
                  )}

                  {/* Icon Container */}
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full transition-all duration-500 mr-4",
                    item.isAction 
                      ? "hairline-all bg-void text-gold border-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                      : ""
                  )}>
                    <item.icon 
                       className={cn("w-[20px] h-[20px] transition-all duration-500", isActive && !item.isAction && "drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]")} 
                       strokeWidth={isActive ? 2 : 1.5} 
                    />
                  </div>

                  <span className={cn(
                    "micro-caps tracking-[0.2em] mt-0.5 transition-colors text-[11px]",
                    isActive ? "text-gold-pale font-medium" : "text-marble/70"
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Section at bottom of desktop sidebar */}
        <div className="p-4 hairline-t">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-white/20
              bg-marble/10 overflow-hidden flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url}
                  className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="font-serif text-sm text-marble/60">
                  {(profile?.full_name ?? user?.email ?? 'A')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-marble truncate font-medium">
                {profile?.full_name ?? 'Anonymous'}
              </p>
              <p className="micro-caps text-xs text-marble/30 truncate">
                {profile?.username 
                  ? `@${profile.username}` 
                  : user?.email?.split('@')[0] ?? 'user'}
              </p>
            </div>
            <Link to="/app/profile">
              <div className="w-7 h-7 rounded-full glass-panel hairline-all
                flex items-center justify-center text-marble/30
                hover:text-gold transition-colors">
                <span className="text-xs transition-transform hover:translate-x-0.5">→</span>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto pt-16 lg:pt-0 pb-20 lg:pb-0 relative z-10 scroll-smooth h-[100dvh]">
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

      {/* Mobile Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50
        bg-void/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <div className={cn(
                  `flex flex-col items-center gap-1 px-3 py-2 rounded-xl 
                  transition-all duration-300`,
                  isActive ? 'text-gold' : 'text-marble/30'
                )}>
                  {to === '/app/create' ? (
                    <div className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center border',
                      isActive 
                        ? 'bg-gold border-gold text-void' 
                        : 'border-gold/40 text-gold'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                  ) : (
                    <>
                      <Icon className="w-5 h-5" />
                      <span className="micro-caps text-[10px]">{label}</span>
                    </>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
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
              className="hidden lg:block fixed z-[70] left-[110px] bottom-10 w-64 bg-card/95 backdrop-blur-3xl hairline-all shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden pointer-events-auto"
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
              className="lg:hidden fixed z-[70] inset-x-0 bottom-0 bg-card/95 backdrop-blur-3xl border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-10 rounded-t-[32px] overflow-hidden pointer-events-auto safe-area-pb"
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

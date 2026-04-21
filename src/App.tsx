import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingLayout from "./layouts/LandingLayout";
import AppLayout from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ToastProvider";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const TodayPage = lazy(() => import("./pages/TodayPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const CreatePage = lazy(() => import("./pages/CreatePage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SignalsPage = lazy(() => import("./pages/SignalsPage"));
const MomentDetailPage = lazy(() => import("./pages/MomentDetailPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const FollowingPage = lazy(() => import("./pages/FollowingPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center bg-void min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center">
        <span className="font-serif text-lg text-gold animate-pulse">A</span>
      </div>
      <p className="micro-caps text-marble/30 text-xs text-center">Scanning Frequencies...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route element={<LandingLayout />}>
                  <Route path="/auth" element={<AuthPage />} />
                </Route>

                {/* Authenticated Routes */}
                <Route 
                  path="/app" 
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/app/today" replace />} />
                  <Route path="today" element={<TodayPage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="create" element={<CreatePage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="signals" element={<SignalsPage />} />
                  <Route path="moment/:id" element={<MomentDetailPage />} />
                  <Route path="event/:id" element={<EventDetailPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="following" element={<FollowingPage />} />
                  <Route path="user/:userId" element={<PublicProfilePage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

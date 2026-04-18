import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingLayout from "./layouts/LandingLayout";
import AppLayout from "./layouts/AppLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import TodayPage from "./pages/TodayPage";
import MapPage from "./pages/MapPage";
import CreatePage from "./pages/CreatePage";
import EventsPage from "./pages/EventsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SignalsPage from "./pages/SignalsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        {/* Authenticated Routes */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="signals" element={<SignalsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

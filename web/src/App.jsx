import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSessionStore } from '../../shared/store/sessionStore.js';
import ExplorePage from './pages/ExplorePage.jsx';

import HomePage      from './pages/HomePage.jsx';
import GroupPage     from './pages/GroupPage.jsx';
import CreatePage    from './pages/CreatePage.jsx';
import PlacesPage    from './pages/PlacesPage.jsx';
import GhostPage     from './pages/GhostPage.jsx';
import Layout        from './components/Layout.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import AuthPage      from './pages/AuthPage.jsx';
import DownloadPage  from './pages/DownloadPage.jsx';

export default function App() {
  const { isReady, init, user } = useSessionStore();

  useEffect(() => { init(); }, []);

  if (!isReady) return <LoadingScreen />;

  return (
    <Routes>
      {/* Always accessible */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/download" element={<DownloadPage />} />

      {/* Protected — redirect to /auth if not logged in */}
      <Route element={user ? <Layout /> : <Navigate to="/auth" replace />}>
        <Route index element={<HomePage />} />
        <Route path="groups/new"  element={<CreatePage />} />
        <Route path="groups/:id"  element={<GroupPage />} />
        <Route path="places"      element={<PlacesPage />} />
        <Route path="ghost"       element={<GhostPage />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
        <Route path="explore" element={<ExplorePage />} />

      </Route>
    </Routes>
  );
}
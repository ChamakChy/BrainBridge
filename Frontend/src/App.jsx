import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Layout from './components/Layout';
import PostDoubtModal from './components/PostDoubtModal';
import { Toast, Spinner } from './components/UI';

// ── Student Pages ─────────────────────────────────────────────────────────────
import Login       from './pages/Login';
import Register    from './pages/Register';
import Discover    from './pages/Discover';
import DoubtDetail from './pages/DoubtDetail';
import MyDoubts    from './pages/MyDoubts';
import Sessions    from './pages/Sessions';
import Leaderboard from './pages/Leaderboard';
import Wallet      from './pages/Wallet';
import Profile     from './pages/Profile';

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 20 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4F8EF7,#6A5AF7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
          <path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white" opacity="0.6"/>
          <path d="M9 6.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="white"/>
        </svg>
      </div>
      <Spinner size={32} />
    </div>
  );
}

// ── Auth guards ───────────────────────────────────────────────────────────────
function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    return <Navigate to="/discover" replace />;
  }
  return <Outlet />;
}

// ── Main app shell (student view) ─────────────────────────────────────────────
function AppShell() {
  const [postOpen, setPostOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <>
      <Navbar onPostDoubt={() => setPostOpen(true)} />
      <Layout>
        <Routes>
          <Route index element={<Navigate to="/discover" replace />} />
          <Route path="discover"    element={<Discover />} />
          <Route path="doubts/:id"  element={<DoubtDetail />} />
          <Route path="my-doubts"   element={<MyDoubts onPostDoubt={() => setPostOpen(true)} />} />
          <Route path="sessions"    element={<Sessions />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="wallet"      element={<Wallet />} />
          <Route path="profile"     element={<Profile />} />
          <Route path="*"           element={<Navigate to="/discover" replace />} />
        </Routes>
      </Layout>

      {postOpen && (
        <PostDoubtModal
          onClose={() => setPostOpen(false)}
          onSuccess={(doubt) => showToast(`Doubt posted: "${doubt.title.slice(0, 40)}..."`)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public only — redirect if logged in */}
          <Route element={<PublicOnly />}>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Student app — protected */}
          <Route element={<RequireAuth />}>
            <Route path="/*" element={<AppShell />} />
          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/discover" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

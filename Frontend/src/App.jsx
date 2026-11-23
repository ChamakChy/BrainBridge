import { BrowserRouter, Routes, Route } from 'react-router-dom';

function PlaceholderHome() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)', gap: 12 }}>
      <h1>BrainBridge</h1>
      <p style={{ color: 'var(--text-muted)' }}>Project scaffolding initialized. Modules coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<PlaceholderHome />} />
      </Routes>
    </BrowserRouter>
  );
}

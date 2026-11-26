import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, CoinBadge } from './UI';

const NAV = [
  { to: '/discover',    label: 'Discover'    },
  { to: '/my-doubts',   label: 'My Doubts'   },
  { to: '/sessions',    label: 'Sessions'    },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/wallet',      label: 'Wallet'      },
];

export default function Navbar({ onPostDoubt }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(10,12,20,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
      <NavLink to="/discover" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 20, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#4F8EF7,#6A5AF7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white" opacity="0.6"/><path d="M9 6.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="white"/></svg>
        </div>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text)' }}>Brain<span style={{ color: 'var(--accent)' }}>Bridge</span></span>
      </NavLink>

      <div style={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden' }}>
        {NAV.map(({ to, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({ padding: '6px 12px', borderRadius: 10, fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text)' : 'var(--text-muted)', background: isActive ? 'var(--surface-hover)' : 'none', textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap', position: 'relative' })}>
            {({ isActive }) => <>{label}{isActive && <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 16, height: 2, borderRadius: 2, background: 'var(--accent)' }} />}</>}
          </NavLink>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onPostDoubt} style={{ background: 'linear-gradient(135deg,#4F8EF7,#6A5AF7)', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ Post Doubt</button>
        <NavLink to="/wallet" style={{ textDecoration: 'none' }}><CoinBadge amount={user?.coins ?? 0} /></NavLink>

        {/* Role badge */}
        {(user?.role === 'admin' || user?.role === 'moderator') && (
          <NavLink to={user.role === 'admin' ? '/admin' : '/moderator'} style={{ textDecoration: 'none' }}>
            <span style={{ background: user.role === 'admin' ? 'var(--red-glow)' : 'var(--purple-glow)', border: `1px solid ${user.role === 'admin' ? '#F75F5F44' : '#A78BFA44'}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: user.role === 'admin' ? 'var(--red)' : 'var(--purple)' }}>
              {user.role === 'admin' ? '⚙️ Admin' : '🛡️ Mod'}
            </span>
          </NavLink>
        )}

        <div style={{ position: 'relative' }}>
          <div onClick={() => setMenuOpen(p => !p)} style={{ cursor: 'pointer' }}><Avatar name={user?.name} size={34} /></div>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
              <div style={{ position: 'absolute', right: 0, top: 44, minWidth: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'fadeUp 0.15s ease', zIndex: 300 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user?.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.department} · <span style={{ textTransform: 'capitalize' }}>{user?.role}</span></p>
                </div>
                {[
                  { label: '👤  My Profile', to: '/profile' },
                  { label: '💰  Wallet', to: '/wallet' },
                  { label: '💬  Sessions', to: '/sessions' },
                  ...(user?.role === 'admin' ? [{ label: '⚙️  Admin Panel', to: '/admin' }] : []),
                  ...(user?.role === 'moderator' ? [{ label: '🛡️  Mod Panel', to: '/moderator' }] : []),
                ].map(item => (
                  <button key={item.label} onClick={() => { navigate(item.to); setMenuOpen(false); }} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >{item.label}</button>
                ))}
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--red)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--red-glow)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >🚪  Sign Out</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

import { useAuth } from '../context/AuthContext';
import { CoinBadge, Avatar, Card } from './UI';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <aside style={{ width: 270, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Avatar name={user?.name} size={44} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.department}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Coins', v: `₵${user?.coins ?? 0}`, c: 'var(--gold)' },
              { l: 'Rating', v: user?.averageRating ? `★ ${user.averageRating.toFixed(1)}` : '—', c: 'var(--gold)' },
              { l: 'Helped', v: user?.doubtsHelped ?? 0, c: 'var(--green)' },
              { l: 'Sessions', v: user?.sessionsCompleted ?? 0, c: 'var(--accent)' },
            ].map(s => (
              <div key={s.l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: s.c, fontFamily: "'Space Grotesk',sans-serif" }}>{s.v}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 12 }}>HOW IT WORKS</p>
          {[
            { n:'1', t:'Post a doubt with coin reward' },
            { n:'2', t:'Helpers apply to solve it' },
            { n:'3', t:'Select the best helper' },
            { n:'4', t:'Chat for up to 1 hour' },
            { n:'5', t:'Rate each other & earn bonus coins' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid #4F8EF744', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>{s.n}</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.t}</p>
            </div>
          ))}
        </Card>

        <div style={{ background: 'var(--green-glow)', border: '1px solid #2DDBA633', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
          <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: 13, marginBottom: 8 }}>💡 Earn More Coins</p>
          {['Help others in your department', 'Rate sessions for +5 bonus', 'Build your reputation score'].map(tip => (
            <p key={tip} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, display: 'flex', gap: 6 }}><span style={{ color: 'var(--green)' }}>→</span>{tip}</p>
          ))}
        </div>
      </aside>
    </div>
  );
}

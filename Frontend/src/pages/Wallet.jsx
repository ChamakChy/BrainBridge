import { useState, useEffect } from 'react';
import { coinsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Card, Spinner, Empty } from '../components/UI';

const TYPE_META = {
  signup_bonus:  { label: '🎁 Welcome Bonus',     color: 'var(--green)' },
  doubt_post:    { label: '📋 Posted Doubt',       color: 'var(--red)'   },
  doubt_cancel:  { label: '🔄 Doubt Refund',       color: 'var(--green)' },
  session_earn:  { label: '💡 Helped a Student',   color: 'var(--green)' },
  session_spend: { label: '🎓 Got Help',           color: 'var(--gold)'  },
  rating_bonus:  { label: '⭐ Rating Bonus',       color: 'var(--green)' },
  admin_grant:   { label: '🔧 Admin Grant',        color: 'var(--accent)'},
  admin_deduct:  { label: '🔧 Admin Deduction',    color: 'var(--red)'   },
};

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([coinsAPI.balance(), coinsAPI.transactions()])
      .then(([b, t]) => { setBalance(b.data); setTxs(t.data.transactions); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={40} /></div>;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, marginBottom: 20 }}>Coin Wallet</h2>

      {/* Balance hero */}
      <div style={{ background: 'linear-gradient(135deg,#4F8EF715,#6A5AF715)', border: '1px solid #4F8EF733', borderRadius: 20, padding: '28px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'var(--gold)', opacity: 0.06, filter: 'blur(30px)' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 6 }}>CURRENT BALANCE</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gold-glow)', border: '2px solid #F5B93E55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#F5B93E33" stroke="#F5B93E" strokeWidth="1.5"/><text x="8" y="11.5" textAnchor="middle" fontSize="9" fill="#F5B93E" fontWeight="700">₵</text></svg>
          </div>
          <span style={{ fontSize: 52, fontWeight: 800, color: 'var(--gold)', fontFamily: "'Space Grotesk',sans-serif" }}>{balance?.balance ?? user?.coins ?? 0}</span>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Earned</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>+{balance?.totalEarned ?? 0}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Spent</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{balance?.totalSpent ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Earn guide */}
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>How to Earn Coins 💡</h3>
        {[
          { a: 'Help solve a doubt',             e: '+Varies', c: 'var(--green)' },
          { a: 'Rate a completed session',        e: '+5 coins', c: 'var(--green)' },
          { a: 'Welcome bonus (on signup)',        e: '+50 coins', c: 'var(--accent)' },
        ].map(item => (
          <div key={item.a} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, color: 'var(--text)' }}>{item.a}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: item.c, flexShrink: 0, marginLeft: 12 }}>{item.e}</span>
          </div>
        ))}
      </Card>

      {/* Transactions */}
      <h3 style={{ fontSize: 16, marginBottom: 14 }}>Transaction History</h3>
      {txs.length === 0
        ? <Empty icon="💸" title="No transactions yet" subtitle="Your history will appear here." />
        : txs.map((tx, i) => {
          const meta = TYPE_META[tx.type] || { label: tx.type, color: 'var(--text-muted)' };
          const isCredit = tx.amount > 0;
          return (
            <div key={tx._id || i} className="fade-up" style={{ animationDelay: `${i * 0.03}s`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isCredit ? 'var(--green-glow)' : 'var(--gold-glow)', border: `1px solid ${isCredit ? '#2DDBA633' : '#F5B93E33'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {isCredit ? '↑' : '↓'}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{meta.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.description} · {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: isCredit ? 'var(--green)' : 'var(--gold)', fontFamily: "'Space Grotesk',sans-serif" }}>{isCredit ? '+' : ''}{tx.amount} ₵</p>
                <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Bal: {tx.balanceAfter}</p>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

import { useState } from 'react';
import { Modal, Input, Textarea, Select, Btn, CoinBadge } from './UI';
import { doubtsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const DEPTS = ['CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER'];
const PRESETS = [10,20,30,50,75,100];

export default function PostDoubtModal({ onClose, onSuccess }) {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', department: user?.department || 'CSE', tags: '', coinReward: 20 });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const canAfford = user?.coins >= form.coinReward;

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const res = await doubtsAPI.create({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
      updateUser({ ...user, coins: user.coins - form.coinReward, doubtsPosted: (user.doubtsPosted || 0) + 1 });
      onSuccess?.(res.data.doubt);
      onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to post'); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose} title="Post a Doubt" width={500}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {[1,2].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: s <= step ? 'linear-gradient(90deg,#4F8EF7,#6A5AF7)' : 'var(--border)', transition: 'background 0.3s' }} />)}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="QUESTION TITLE *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. How do I understand recursion?" />
          <Select label="DEPARTMENT *" value={form.department} onChange={e => set('department', e.target.value)} options={DEPTS} />
          <Textarea label="DESCRIBE YOUR DOUBT *" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Explain in detail what you need help with..." rows={5} />
          <Input label="TAGS (comma separated)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. algorithms, sorting" />
          <Btn fullWidth onClick={() => setStep(2)} disabled={form.title.length < 10 || form.description.length < 20}>Continue →</Btn>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>COIN REWARD</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {PRESETS.map(c => (
                <button key={c} onClick={() => set('coinReward', c)} style={{ padding: '7px 14px', borderRadius: 10, border: `1px solid ${form.coinReward === c ? 'var(--gold)' : 'var(--border)'}`, background: form.coinReward === c ? 'var(--gold-glow)' : 'var(--bg)', color: form.coinReward === c ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>₵{c}</button>
              ))}
            </div>
            <Input type="number" min={5} max={500} value={form.coinReward} onChange={e => set('coinReward', Number(e.target.value))} label="CUSTOM AMOUNT" />
            <p style={{ fontSize: 12, color: canAfford ? 'var(--text-muted)' : 'var(--red)', marginTop: 6 }}>Balance: <strong style={{ color: canAfford ? 'var(--gold)' : 'var(--red)' }}>₵{user?.coins}</strong>{!canAfford && ' — Not enough coins!'}</p>
          </div>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>SUMMARY</p>
            <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{form.title}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{form.department}</p>
            <CoinBadge amount={form.coinReward} />
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</Btn>
            <Btn onClick={submit} disabled={!canAfford} loading={loading} style={{ flex: 2 }}>🚀 Post Doubt</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

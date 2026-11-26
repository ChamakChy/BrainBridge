import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { Card, Avatar, Stars, Badge, RoleBadge, Btn, Input, Textarea, Select } from '../components/UI';
import InstitutionSelect from '../components/InstitutionSelect';

const DEPARTMENTS = ['CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', institution: user?.institution || '', department: user?.department || 'CSE' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await authAPI.updateProfile(form);
      updateUser(r.data.user);
      setEditing(false);
      setMsg('Profile updated!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, marginBottom: 20 }}>My Profile</h2>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <Avatar name={user.name} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input label="NAME" value={form.name} onChange={e => set('name', e.target.value)} />
                <InstitutionSelect value={form.institution} onChange={v => set('institution', v)} />
                <Select label="DEPARTMENT" value={form.department} onChange={e => set('department', e.target.value)} options={DEPARTMENTS} />
                <Textarea label="BIO" value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell others about yourself..." rows={3} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn onClick={save} loading={saving} size="sm">Save Changes</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 6 }}>{user.name}</h3>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
                      <RoleBadge role={user.role} />
                      <Badge label={user.department} color="var(--accent)" />
                      <Badge label={user.institution} color="var(--text-muted)" />
                    </div>
                  </div>
                  <Btn size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Btn>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>{user.email}</p>
                {user.bio && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{user.bio}</p>}
              </>
            )}
          </div>
        </div>
        {msg && <div style={{ background: 'var(--green-glow)', border: '1px solid #2DDBA633', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--green)' }}>{msg}</div>}
        {user.warnings?.length > 0 && (
          <div style={{ marginTop: 14, background: 'var(--gold-glow)', border: '1px solid #F5B93E44', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13, marginBottom: 8 }}>⚠️ {user.warnings.length} Warning{user.warnings.length > 1 ? 's' : ''}</p>
            {user.warnings.map((w, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>• {w.message}</p>)}
          </div>
        )}
      </Card>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { l: 'Coin Balance',    v: `₵ ${user.coins}`,          c: 'var(--gold)'  },
          { l: 'Total Earned',    v: `₵ ${user.totalCoinsEarned}`,c: 'var(--green)' },
          { l: 'Doubts Posted',   v: user.doubtsPosted,           c: 'var(--accent)'},
          { l: 'Students Helped', v: user.doubtsHelped,           c: 'var(--green)' },
          { l: 'Sessions Done',   v: user.sessionsCompleted,      c: 'var(--text)'  },
          { l: 'Avg Rating',      v: user.averageRating ? `★ ${user.averageRating.toFixed(1)}` : '—', c: 'var(--gold)' },
        ].map(s => (
          <Card key={s.l}>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.c, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>{s.v}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.l}</p>
          </Card>
        ))}
      </div>

      {/* Reputation */}
      {user.totalRatingsReceived > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Reputation</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--gold)', fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>{user.averageRating.toFixed(1)}</p>
              <Stars rating={user.averageRating} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{user.totalRatingsReceived} ratings</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

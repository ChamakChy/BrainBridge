import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/UI';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const u = await login(form.email, form.password); navigate(u.role === 'admin' ? '/admin' : u.role === 'moderator' ? '/moderator' : '/discover'); }
    catch(err) { setError(err.response?.data?.message || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-10%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'#4F8EF7', opacity:0.05, filter:'blur(100px)' }} />
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'36px 40px', width:'100%', maxWidth:420, animation:'fadeUp 0.3s ease', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:14, margin:'0 auto 12px', background:'linear-gradient(135deg,#4F8EF7,#6A5AF7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="26" height="26" viewBox="0 0 18 18" fill="none"><path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white" opacity="0.6"/><path d="M9 6.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="white"/></svg>
          </div>
          <h1 style={{ fontSize:26, marginBottom:4 }}>Brain<span style={{ color:'var(--accent)' }}>Bridge</span></h1>
          <p style={{ color:'var(--text-muted)', fontSize:14 }}>Sign in to your account</p>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Input label="EMAIL" type="email" placeholder="you@university.edu" value={form.email} onChange={e=>set('email',e.target.value)} required />
          <Input label="PASSWORD" type="password" placeholder="••••••••" value={form.password} onChange={e=>set('password',e.target.value)} required />
          {error && <div style={{ background:'var(--red-glow)', border:'1px solid #F75F5F44', borderRadius:10, padding:'10px 14px', fontSize:13, color:'var(--red)' }}>{error}</div>}
          <Btn fullWidth loading={loading} style={{ marginTop:4 }}>Sign In</Btn>
        </form>
        <p style={{ textAlign:'center', fontSize:14, color:'var(--text-muted)', marginTop:18 }}>Don't have an account? <Link to="/register" style={{ color:'var(--accent)', fontWeight:600 }}>Sign up free</Link></p>
        <div style={{ marginTop:16, padding:'10px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>
          🎓 New users get <strong style={{ color:'var(--gold)' }}>50 free coins</strong> on signup!
        </div>
      </div>
    </div>
  );
}

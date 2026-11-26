import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input, Select } from '../components/UI';
import InstitutionSelect from '../components/InstitutionSelect';

const DEPTS = ['CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    institution: '', department: 'CSE', studentId: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.includes('@')) e.email = 'Enter a valid email';
    if (!form.institution) e.institution = 'Please select your university';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      navigate('/discover');
    } catch (err) {
      setServerError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: '#2DDBA6', opacity: 0.04, filter: 'blur(100px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: '#4F8EF7', opacity: 0.04, filter: 'blur(100px)' }} />

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px 36px', width: '100%', maxWidth: 520, animation: 'fadeUp 0.3s ease', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px', background: 'linear-gradient(135deg,#4F8EF7,#6A5AF7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
              <path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white" opacity="0.6"/>
              <path d="M9 6.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="white"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Join the BrainBridge academic community</p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name + Student ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="FULL NAME *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Your full name"
              error={errors.name}
              required
            />
            <Input
              label="STUDENT ID"
              value={form.studentId}
              onChange={e => set('studentId', e.target.value)}
              placeholder="e.g. 2021-1-60-123"
            />
          </div>

          {/* Email */}
          <Input
            label="EMAIL *"
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="you@university.edu"
            error={errors.email}
            required
          />

          {/* Institution dropdown — THE KEY FIX */}
          <InstitutionSelect
            value={form.institution}
            onChange={v => set('institution', v)}
            error={errors.institution}
          />

          {/* Department */}
          <Select
            label="DEPARTMENT *"
            value={form.department}
            onChange={e => set('department', e.target.value)}
            options={DEPTS}
          />

          {/* Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="PASSWORD *"
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Min 6 characters"
              error={errors.password}
              required
            />
            <Input
              label="CONFIRM PASSWORD *"
              type="password"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              placeholder="Repeat password"
              error={errors.confirmPassword}
              required
            />
          </div>

          {/* Server error */}
          {serverError && (
            <div style={{ background: 'var(--red-glow)', border: '1px solid #F75F5F44', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
              {serverError}
            </div>
          )}

          {/* Bonus notice */}
          <div style={{ background: 'var(--green-glow)', border: '1px solid #2DDBA644', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--green)', textAlign: 'center' }}>
            🎁 You'll receive <strong>50 free coins</strong> when you register!
          </div>

          <Btn fullWidth loading={loading} style={{ marginTop: 2 }}>
            Create Account
          </Btn>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 18 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

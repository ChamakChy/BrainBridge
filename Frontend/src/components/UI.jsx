import { useState } from 'react';

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, loading, fullWidth, style = {} }) {
  const sizes = { sm: { fontSize: 12, padding: '6px 12px' }, md: { fontSize: 14, padding: '10px 18px' }, lg: { fontSize: 15, padding: '12px 24px' } };
  const variants = {
    primary:   { background: 'linear-gradient(135deg,#4F8EF7,#6A5AF7)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost:     { background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)' },
    danger:    { background: 'var(--red-glow)', color: 'var(--red)', border: '1px solid #F75F5F44' },
    success:   { background: 'var(--green-glow)', color: 'var(--green)', border: '1px solid #2DDBA644' },
    warning:   { background: 'var(--gold-glow)', color: 'var(--gold)', border: '1px solid #F5B93E44' },
    purple:    { background: 'var(--purple-glow)', color: 'var(--purple)', border: '1px solid #A78BFA44' },
  };
  return (
    <button disabled={disabled || loading} onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      borderRadius: 10, fontWeight: 700, fontFamily: 'inherit', cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.55 : 1, width: fullWidth ? '100%' : undefined,
      transition: 'opacity 0.15s, transform 0.1s',
      ...sizes[size], ...(variants[variant] || variants.primary), ...style,
    }}>
      {loading ? <Spinner size={14} /> : children}
    </button>
  );
}

export function Spinner({ size = 24, color = 'var(--accent)' }) {
  return <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTop: `2px solid ${color}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

export function Badge({ label, color = 'var(--accent)', small }) {
  return <span style={{ fontSize: small ? 10 : 11, fontWeight: 600, padding: small ? '1px 6px' : '2px 9px', borderRadius: 20, background: color + '22', color, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>{label}</span>;
}

export function RoleBadge({ role }) {
  const map = { admin: { label: '⚙️ Admin', color: 'var(--red)' }, moderator: { label: '🛡️ Mod', color: 'var(--purple)' }, student: { label: '🎓 Student', color: 'var(--accent)' } };
  const r = map[role] || map.student;
  return <Badge label={r.label} color={r.color} />;
}

export function StatusBadge({ status }) {
  const map = { open: { label: 'Open', color: 'var(--green)' }, in_progress: { label: 'In Progress', color: 'var(--gold)' }, solved: { label: 'Solved', color: 'var(--accent)' }, closed: { label: 'Closed', color: 'var(--text-muted)' }, removed: { label: 'Removed', color: 'var(--red)' }, expired: { label: 'Expired', color: 'var(--red)' }, active: { label: 'Active', color: 'var(--green)' }, completed: { label: 'Completed', color: 'var(--accent)' }, pending: { label: 'Pending', color: 'var(--gold)' }, pending_confirmation: { label: 'Confirming...', color: 'var(--gold)' }, scheduled: { label: 'Scheduled', color: 'var(--purple)' }, cancelled: { label: 'Cancelled', color: 'var(--red)' }, banned: { label: 'Banned', color: 'var(--red)' } };
  const s = map[status] || { label: status, color: 'var(--text-muted)' };
  return <Badge label={s.label} color={s.color} />;
}

export function Card({ children, style = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => onClick && setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: hov ? 'var(--surface-hover)' : 'var(--surface)',
      border: `1px solid ${hov && onClick ? '#4F8EF755' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '18px 20px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.18s', transform: hov && onClick ? 'translateY(-1px)' : 'none',
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      {hov && onClick && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#4F8EF7,#2DDBA6)' }} />}
      {children}
    </div>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</label>}
      <input {...props} />
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, rows = 4, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</label>}
      <textarea rows={rows} {...props} style={{ resize: 'vertical', ...props.style }} />
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, error, options, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</label>}
      <select {...props}>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

export function Modal({ children, onClose, title, width = 480 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.2s ease' }}>
        {title && (
          <div style={{ padding: '18px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 17, color: 'var(--text)' }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>✕</button>
          </div>
        )}
        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export function CoinBadge({ amount, sign, size = 'md' }) {
  const s = size === 'sm' ? { fontSize: 12, pad: '2px 8px', ico: 12 } : size === 'lg' ? { fontSize: 18, pad: '6px 14px', ico: 20 } : { fontSize: 14, pad: '4px 10px', ico: 15 };
  const pre = sign === '+' ? '+' : sign === '-' ? '-' : '';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--gold-glow)', border: '1px solid #F5B93E44', borderRadius: 10, padding: s.pad }}>
      <svg width={s.ico} height={s.ico} viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#F5B93E22" stroke="#F5B93E" strokeWidth="1.2"/><text x="8" y="11.5" textAnchor="middle" fontSize="8" fill="#F5B93E" fontWeight="700">₵</text></svg>
      <span style={{ fontWeight: 700, fontSize: s.fontSize, color: pre === '+' ? 'var(--green)' : 'var(--gold)' }}>{pre}{amount}</span>
    </span>
  );
}

export function Avatar({ name = '?', size = 36, color = '#4F8EF7' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${color}99,#6A5AF799)`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: '#fff' }}>{initials}</div>;
}

export function Stars({ rating, max = 5, interactive, onRate }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 16 16"
          fill={(interactive ? (hov || rating) > i : rating > i) ? 'var(--gold)' : 'var(--text-dim)'}
          style={{ cursor: interactive ? 'pointer' : 'default', transition: 'fill 0.1s' }}
          onMouseEnter={() => interactive && setHov(i + 1)}
          onMouseLeave={() => interactive && setHov(0)}
          onClick={() => interactive && onRate?.(i + 1)}>
          <path d="M8 1l1.8 4.8H15l-4.2 3 1.6 4.8L8 11l-4.4 2.6L5.2 8.8 1 5.8h5.2z"/>
        </svg>
      ))}
    </div>
  );
}

export function Empty({ icon = '🔍', title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      {title && <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</p>}
      {subtitle && <p style={{ fontSize: 14 }}>{subtitle}</p>}
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }) {
  const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--accent)', warning: 'var(--gold)' };
  return (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: `1px solid ${colors[type]}55`, borderRadius: 12, padding: '12px 18px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'fadeUp 0.25s ease', maxWidth: 400 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[type], flexShrink: 0 }} />
      <span style={{ fontSize: 14, color: 'var(--text)' }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginLeft: 'auto', cursor: 'pointer', fontSize: 16 }}>✕</button>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
      <div className="skeleton" style={{ height: 16, width: '65%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ height: 22, width: 56, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 22, width: 56, borderRadius: 20 }} />
      </div>
    </div>
  );
}

export function Table({ columns, data, onRow }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(c => (
              <th key={c.key} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i} onClick={() => onRow?.(row)} style={{ borderBottom: '1px solid var(--border)', cursor: onRow ? 'pointer' : 'default', transition: 'background 0.1s' }}
              onMouseEnter={e => onRow && (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text)', whiteSpace: c.wrap ? 'normal' : 'nowrap' }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit', fontSize: 13 }}>← Prev</button>
      <span style={{ padding: '7px 14px', color: 'var(--text-muted)', fontSize: 13 }}>Page {page} / {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', cursor: page === pages ? 'not-allowed' : 'pointer', opacity: page === pages ? 0.4 : 1, fontFamily: 'inherit', fontSize: 13 }}>Next →</button>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { UNIVERSITIES } from '../utils/universities';

export default function InstitutionSelect({ value, onChange, error }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All'); // All / Public / Private
  const ref = useRef(null);

  // Sync display when value changes externally
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = UNIVERSITIES.filter(u => {
    const matchType = typeFilter === 'All' || u.type === typeFilter || (typeFilter === 'Private' && u.type === 'Private');
    const matchQuery = u.name.toLowerCase().includes(query.toLowerCase());
    return matchType && matchQuery;
  }).slice(0, 50); // Max 50 results shown

  const select = (name) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(''); // clear valid selection when typing
    setOpen(true);
  };

  const isValid = UNIVERSITIES.some(u => u.name === value);

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        INSTITUTION *
      </label>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Search your university..."
          autoComplete="off"
          style={{
            paddingRight: 36,
            borderColor: error ? 'var(--red)' : isValid ? 'var(--green)' : open ? 'var(--accent)' : 'var(--border)',
            boxShadow: isValid ? '0 0 0 3px var(--green-glow)' : open ? '0 0 0 3px var(--accent-glow)' : 'none',
          }}
        />
        {/* Status icon */}
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {isValid
            ? <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>
            : <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>▾</span>}
        </div>
      </div>

      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
          background: 'var(--surface)', border: '1px solid var(--accent)55',
          borderRadius: 10, marginTop: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeUp 0.15s ease',
          overflow: 'hidden',
        }}>
          {/* Type filter tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '8px 10px', background: 'var(--bg)' }}>
            {['All', 'Public', 'Private'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                background: typeFilter === t ? 'var(--accent)' : 'none',
                color: typeFilter === t ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>{t}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Results list */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '16px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No universities found for "{query}"
              </div>
            ) : filtered.map(u => (
              <div
                key={u.id}
                onClick={() => select(u.name)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  background: u.name === value ? 'var(--accent-glow)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = u.name === value ? 'var(--accent-glow)' : 'none'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: u.name === value ? 700 : 500, color: u.name === value ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {highlightMatch(u.name, query)}
                  </p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                  background: u.type === 'Public' ? 'var(--green-glow)' : u.type === 'Private' ? 'var(--gold-glow)' : 'var(--accent-glow)',
                  color: u.type === 'Public' ? 'var(--green)' : u.type === 'Private' ? 'var(--gold)' : 'var(--accent)',
                  border: `1px solid ${u.type === 'Public' ? '#2DDBA633' : u.type === 'Private' ? '#F5B93E33' : '#4F8EF733'}`,
                }}>{u.type === 'International / Technical' ? 'Intl' : u.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Bold highlight matching chars
function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: 'var(--accent)' }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

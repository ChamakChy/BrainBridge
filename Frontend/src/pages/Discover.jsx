// ── Discover Page ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { doubtsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DoubtCard from '../components/DoubtCard';
import { Spinner, Empty, SkeletonCard, Pagination } from '../components/UI';

const DEPTS = ['All','CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER'];

export default function Discover() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dept, setDept] = useState('All');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, sort, limit: 15 };
      if (dept !== 'All') params.department = dept;
      if (search) params.search = search;
      const res = await doubtsAPI.getAll(params);
      setDoubts(res.data.doubts);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [page, dept, sort, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { l:'Active Doubts', v: pagination?.total ?? '—', c:'var(--accent)', i:'📋' },
          { l:'Your Coins', v:`₵${user?.coins??0}`, c:'var(--gold)', i:'🪙' },
          { l:'Your Dept', v:user?.department, c:'var(--green)', i:'🎓' },
        ].map(s => (
          <div key={s.l} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', flex:1, minWidth:120 }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{s.i}</div>
            <p style={{ fontSize:24, fontWeight:800, color:s.c, fontFamily:"'Space Grotesk',sans-serif", marginBottom:2 }}>{s.v}</p>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>{s.l}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="var(--text-dim)"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Search doubts..." style={{ paddingLeft:36 }} />
        </div>
        <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}} style={{ width:'auto', minWidth:140 }}>
          <option value="-createdAt">Newest</option>
          <option value="-coinReward">Highest Reward</option>
          <option value="coinReward">Lowest Reward</option>
        </select>
      </div>

      <div style={{ display:'flex', gap:7, marginBottom:18, flexWrap:'wrap' }}>
        {DEPTS.map(d => (
          <button key={d} onClick={()=>{setDept(d);setPage(1);}} style={{ padding:'5px 13px', borderRadius:20, border:`1px solid ${dept===d?'var(--accent)':'var(--border)'}`, background:dept===d?'var(--accent-glow)':'var(--surface)', color:dept===d?'var(--accent)':'var(--text-muted)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>{d}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{[1,2,3,4].map(i=><SkeletonCard key={i}/>)}</div>
      ) : doubts.length === 0 ? (
        <Empty icon="🔍" title="No doubts found" subtitle="Try adjusting your filters." />
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {doubts.map((d,i)=>(
              <div key={d._id} className="fade-up" style={{ animationDelay:`${i*0.04}s` }}>
                <DoubtCard doubt={d} />
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pagination?.pages||1} onChange={setPage} />
        </>
      )}
    </div>
  );
}

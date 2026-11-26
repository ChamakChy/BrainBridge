import { useState, useEffect } from 'react';
import { doubtsAPI } from '../utils/api';
import DoubtCard from '../components/DoubtCard';
import { Empty, SkeletonCard, Btn } from '../components/UI';
const FILTERS = ['All','open','in_progress','solved','closed'];
export default function MyDoubts({ onPostDoubt }) {
  const [doubts, setDoubts] = useState([]); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState('All');
  useEffect(()=>{ doubtsAPI.myDoubts().then(r=>setDoubts(r.data.doubts)).catch(console.error).finally(()=>setLoading(false)); },[]);
  const filtered = filter==='All' ? doubts : doubts.filter(d=>d.status===filter);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <h2 style={{ fontSize:22 }}>My Doubts</h2>
        <Btn onClick={onPostDoubt}>+ Post New Doubt</Btn>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        {[{l:'Total',v:doubts.length,c:'var(--accent)'},{l:'Open',v:doubts.filter(d=>d.status==='open').length,c:'var(--green)'},{l:'In Progress',v:doubts.filter(d=>d.status==='in_progress').length,c:'var(--gold)'},{l:'Solved',v:doubts.filter(d=>d.status==='solved').length,c:'var(--text-muted)'}].map(s=>(
          <div key={s.l} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 16px', flex:1, minWidth:100 }}>
            <p style={{ fontSize:24, fontWeight:800, color:s.c, fontFamily:"'Space Grotesk',sans-serif" }}>{s.v}</p>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>{s.l}</p>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:7, marginBottom:16, flexWrap:'wrap' }}>
        {FILTERS.map(f=><button key={f} onClick={()=>setFilter(f)} style={{ padding:'5px 13px', borderRadius:20, border:`1px solid ${filter===f?'var(--accent)':'var(--border)'}`, background:filter===f?'var(--accent-glow)':'var(--surface)', color:filter===f?'var(--accent)':'var(--text-muted)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>{f.replace('_',' ')}</button>)}
      </div>
      {loading ? <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{[1,2,3].map(i=><SkeletonCard key={i}/>)}</div>
      : filtered.length===0 ? <Empty icon="❓" title={filter==='All'?"No doubts yet":"No doubts found"} subtitle={filter==='All'?"Post your first doubt to get help.":"Try a different filter."} />
      : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{filtered.map((d,i)=><div key={d._id} className="fade-up" style={{ animationDelay:`${i*0.05}s` }}><DoubtCard doubt={d}/></div>)}</div>}
    </div>
  );
}

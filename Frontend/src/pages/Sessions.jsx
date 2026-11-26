import { useState, useEffect } from 'react';
import { sessionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import SessionModal from '../components/SessionModal';
import { Card, StatusBadge, CoinBadge, Avatar, Stars, Empty, SkeletonCard, Btn } from '../components/UI';
const TABS = ['All','pending_confirmation','scheduled','active','completed'];
export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]); const [loading, setLoading] = useState(true); const [tab, setTab] = useState('All'); const [active, setActive] = useState(null);
  const load = () => sessionsAPI.getAll().then(r=>setSessions(r.data.sessions)).catch(console.error).finally(()=>setLoading(false));
  useEffect(()=>{
    load();
    // Bug fix: this page used to only fetch once on mount, so it never reflected
    // new matches, ready confirmations, or completions unless you reloaded the tab.
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  },[]);
  const filtered = tab==='All' ? sessions : sessions.filter(s=>s.status===tab);
  return (
    <div>
      {active && <SessionModal session={active} onClose={()=>setActive(null)}/>}
      <h2 style={{ fontSize:22, marginBottom:18 }}>My Sessions</h2>
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        {[{l:'Total',v:sessions.length,c:'var(--accent)'},{l:'Active',v:sessions.filter(s=>s.status==='active').length,c:'var(--green)'},{l:'Completed',v:sessions.filter(s=>s.status==='completed').length,c:'var(--text-muted)'}].map(s=>(
          <div key={s.l} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 16px', flex:1, minWidth:100 }}>
            <p style={{ fontSize:24, fontWeight:800, color:s.c, fontFamily:"'Space Grotesk',sans-serif" }}>{s.v}</p>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>{s.l}</p>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:7, marginBottom:16 }}>
        {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{ padding:'5px 13px', borderRadius:20, border:`1px solid ${tab===t?'var(--accent)':'var(--border)'}`, background:tab===t?'var(--accent-glow)':'var(--surface)', color:tab===t?'var(--accent)':'var(--text-muted)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>{t}</button>)}
      </div>
      {loading ? <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{[1,2,3].map(i=><SkeletonCard key={i}/>)}</div>
      : filtered.length===0 ? <Empty icon="💬" title="No sessions found" subtitle="Sessions appear when you start helping or get help."/>
      : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{filtered.map((s,i)=>{
        const isStudent=(s.student?._id||s.student)===user?._id;
        const peer=isStudent?s.helper:s.student;
        const myRating=s.ratings?.find(r=>(r.ratedBy===user?._id||r.ratedBy?._id===user?._id));
        return (
          <Card key={s._id} className="fade-up" style={{ animationDelay:`${i*0.05}s` }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:6 }}>{s.doubt?.title||'Session'}</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <Avatar name={peer?.name} size={24}/>
                  <span style={{ fontSize:13, color:'var(--text-muted)' }}>{isStudent?'Helper:':'Student:'} <strong style={{ color:'var(--text)' }}>{peer?.name}</strong></span>
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>{s.startedAt?new Date(s.startedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</span>
                  {s.duration>0 && <span style={{ fontSize:12, color:'var(--text-muted)' }}>⏱ {s.duration} min</span>}
                  {myRating && <div style={{ display:'flex', gap:4, alignItems:'center' }}><Stars rating={myRating.score}/><span style={{ fontSize:12, color:'var(--text-muted)' }}>Your rating</span></div>}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                <StatusBadge status={s.status}/>
                <CoinBadge amount={s.coinReward} sign={isStudent?'-':'+'}/>
                {(s.status==='active'||s.status==='pending_confirmation'||s.status==='scheduled') && <Btn size="sm" onClick={()=>setActive(s)}>{s.status==='active'?'Open Chat':s.status==='pending_confirmation'?'Confirm Ready':'View Proposal'}</Btn>}
                {s.status==='completed' && !myRating && <Btn size="sm" variant="secondary" onClick={()=>setActive(s)}>Rate Session</Btn>}
              </div>
            </div>
          </Card>
        );
      })}</div>}
    </div>
  );
}

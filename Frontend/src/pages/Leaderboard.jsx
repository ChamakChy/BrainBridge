import { useState, useEffect } from 'react';
import { usersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Card, Avatar, Stars, Badge, Spinner, Empty } from '../components/UI';
const DEPTS=['All','CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER'];
const MEDALS={0:'🥇',1:'🥈',2:'🥉'};
export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]); const [loading, setLoading] = useState(true); const [dept, setDept] = useState('All'); const [by, setBy] = useState('coins');
  useEffect(()=>{ setLoading(true); usersAPI.leaderboard({ department:dept==='All'?undefined:dept, by, limit:25 }).then(r=>setLeaders(r.data.leaderboard)).catch(console.error).finally(()=>setLoading(false)); },[dept,by]);
  const top3=leaders.slice(0,3); const rest=leaders.slice(3);
  return (
    <div>
      <h2 style={{ fontSize:22, marginBottom:6 }}>Leaderboard</h2>
      <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:18 }}>Top helpers in your institution.</p>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <select value={by} onChange={e=>setBy(e.target.value)} style={{ width:'auto', minWidth:150 }}>
          <option value="coins">Coins Earned</option>
          <option value="rating">Avg Rating</option>
          <option value="sessions">Sessions</option>
        </select>
      </div>
      <div style={{ display:'flex', gap:7, marginBottom:22, flexWrap:'wrap' }}>
        {DEPTS.map(d=><button key={d} onClick={()=>setDept(d)} style={{ padding:'4px 12px', borderRadius:20, border:`1px solid ${dept===d?'var(--accent)':'var(--border)'}`, background:dept===d?'var(--accent-glow)':'var(--surface)', color:dept===d?'var(--accent)':'var(--text-muted)', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>{d}</button>)}
      </div>
      {loading ? <div style={{ display:'flex', justifyContent:'center', paddingTop:40 }}><Spinner size={40}/></div>
      : leaders.length===0 ? <Empty icon="🏆" title="No data yet" subtitle="Be the first helper!"/>
      : <>
        {top3.length>=3 && (
          <div style={{ display:'flex', gap:12, marginBottom:22, alignItems:'flex-end', justifyContent:'center' }}>
            {[top3[1],top3[0],top3[2]].map((u,idx)=>{
              const rank=idx===0?1:idx===1?0:2;
              const heights=['160px','200px','140px'];
              return (
                <div key={u._id} style={{ flex:1, maxWidth:190, background:'var(--surface)', border:`1px solid ${rank===1?'#F5B93E44':'var(--border)'}`, borderRadius:14, padding:'18px 14px', textAlign:'center', height:heights[idx], display:'flex', flexDirection:'column', justifyContent:'flex-end', position:'relative' }}>
                  {rank===1 && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#F5B93E,#4F8EF7)', borderRadius:'14px 14px 0 0' }}/>}
                  <div style={{ fontSize:26, marginBottom:6 }}>{MEDALS[rank]}</div>
                  <Avatar name={u.name} size={rank===1?48:38} style={{ margin:'0 auto 7px' }}/>
                  <p style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:4 }}>{u.name}</p>
                  <Badge label={u.department} color="var(--accent)" small/>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--gold)', marginTop:7 }}>{by==='coins'?`₵${u.totalCoinsEarned}`:by==='rating'?`★ ${(u.averageRating||0).toFixed(1)}`:`${u.sessionsCompleted}`}</p>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {(top3.length<3?leaders:rest).map((u,i)=>{
            const rank=top3.length>=3?i+4:i+1; const isMe=u._id===user?._id;
            return (
              <Card key={u._id} style={{ borderColor:isMe?'#4F8EF744':'var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--bg)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'var(--text-muted)', fontFamily:"'Space Grotesk',sans-serif", flexShrink:0 }}>{rank}</div>
                  <Avatar name={u.name} size={38}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                      <p style={{ fontWeight:600, fontSize:15, color:'var(--text)' }}>{u.name}</p>
                      {isMe && <Badge label="You" color="var(--accent)" small/>}
                    </div>
                    <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
                      <Badge label={u.department} color="var(--text-muted)" small/>
                      <Stars rating={u.averageRating||0}/>
                      <span style={{ fontSize:12, color:'var(--text-muted)' }}>{u.sessionsCompleted} sessions</span>
                    </div>
                  </div>
                  <p style={{ fontWeight:800, fontSize:16, color:'var(--gold)', fontFamily:"'Space Grotesk',sans-serif" }}>{by==='coins'?`₵${u.totalCoinsEarned}`:by==='rating'?`★ ${(u.averageRating||0).toFixed(1)}`:`${u.sessionsCompleted}`}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </>}
    </div>
  );
}

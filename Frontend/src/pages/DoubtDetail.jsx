import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doubtsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import SessionModal from '../components/SessionModal';
import { Card, Badge, StatusBadge, CoinBadge, Avatar, Stars, Btn, Spinner, Empty, Textarea, Select } from '../components/UI';

const DEPT_C = { CSE:'#4F8EF7', EEE:'#F5B93E', ME:'#2DDBA6', CE:'#F75F5F', MATH:'#FB923C', OTHER:'#94A3B8' };
const REPORT_REASONS = ['spam','inappropriate','harassment','cheating','fake','other'];

export default function DoubtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doubt, setDoubt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyMsg, setApplyMsg] = useState('');
  const [applying, setApplying] = useState(false);
  const [selectingId, setSelectingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [schedulingFor, setSchedulingFor] = useState(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    doubtsAPI.getById(id).then(r=>setDoubt(r.data.doubt)).catch(()=>navigate('/discover')).finally(()=>setLoading(false));
  }, [id]);

  const isOwner = doubt?.postedBy?._id === user?._id;
  const alreadyApplied = doubt?.applicants?.some(a=>(a.helper?._id||a.helper)===user?._id);

  const handleApply = async () => {
    setApplying(true); setError('');
    try { await doubtsAPI.apply(id, { message: applyMsg }); setSuccess('Application sent!'); setDoubt(p=>({...p, applicants:[...(p.applicants||[]),{helper:{_id:user._id,name:user.name,department:user.department,averageRating:user.averageRating},message:applyMsg}]})); }
    catch(err) { setError(err.response?.data?.message||'Failed'); }
    finally { setApplying(false); }
  };

  const handleSelect = async (helperId, scheduledFor) => {
    setSelectingId(helperId); setError('');
    try {
      const r = await doubtsAPI.selectHelper(id, helperId, scheduledFor ? { scheduledFor } : undefined);
      setSuccess(r.data.message || 'Helper selected!');
      setSessionData(r.data.session);
      setDoubt(p=>({...p,status:'in_progress',selectedHelper:{_id:helperId}}));
      setSchedulingFor(null); setScheduledTime('');
    }
    catch(err) {
      const msg = err.response?.data?.message || 'Failed';
      if (msg.toLowerCase().includes('offline')) setSchedulingFor(helperId);
      setError(msg);
    }
    finally { setSelectingId(null); }
  };

  const handleReport = async () => {
    setReporting(true);
    try { await doubtsAPI.report(id, { reason: reportReason, description: reportDesc }); setSuccess('Reported! Moderators will review it.'); setShowReport(false); }
    catch(err) { setError(err.response?.data?.message||'Failed'); }
    finally { setReporting(false); }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><Spinner size={40}/></div>;
  if (!doubt) return <Empty icon="❌" title="Doubt not found" />;
  const col = DEPT_C[doubt.department]||'var(--accent)';

  return (
    <div style={{ maxWidth:760, margin:'0 auto' }}>
      {sessionData && <SessionModal session={sessionData} onClose={()=>setSessionData(null)} />}
      <button onClick={()=>navigate(-1)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>← Back</button>

      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', gap:7, marginBottom:10, flexWrap:'wrap' }}>
              <Badge label={doubt.department} color={col} />
              {(doubt.tags||[]).map(t=><Badge key={t} label={t} color="var(--text-muted)"/>)}
              <StatusBadge status={doubt.status} />
            </div>
            <h1 style={{ fontSize:21, color:'var(--text)', marginBottom:8, lineHeight:1.35 }}>{doubt.title}</h1>
          </div>
          <CoinBadge amount={doubt.coinReward} size="lg" />
        </div>
        <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', marginBottom:14 }}>
          <p style={{ fontSize:15, color:'var(--text)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{doubt.description}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Avatar name={doubt.postedBy?.name} size={30}/>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{doubt.postedBy?.name}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)' }}>{doubt.postedBy?.department}</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, color:'var(--text-dim)' }}>{new Date(doubt.createdAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span>
            {!isOwner && doubt.status === 'open' && (
              <Btn size="sm" variant="ghost" onClick={()=>setShowReport(p=>!p)}>⚠️ Report</Btn>
            )}
          </div>
        </div>

        {showReport && (
          <div style={{ marginTop:14, padding:14, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10 }}>
            <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:10 }}>Report this doubt</p>
            <Select label="REASON" value={reportReason} onChange={e=>setReportReason(e.target.value)} options={REPORT_REASONS} />
            <div style={{ marginTop:8 }}>
              <Textarea value={reportDesc} onChange={e=>setReportDesc(e.target.value)} placeholder="Describe the issue (optional)..." rows={2} />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <Btn size="sm" variant="danger" onClick={handleReport} loading={reporting}>Submit Report</Btn>
              <Btn size="sm" variant="ghost" onClick={()=>setShowReport(false)}>Cancel</Btn>
            </div>
          </div>
        )}
      </Card>

      {error   && <div style={{ background:'var(--red-glow)', border:'1px solid #F75F5F44', borderRadius:10, padding:'10px 14px', marginBottom:12, color:'var(--red)', fontSize:13 }}>{error}</div>}
      {success && <div style={{ background:'var(--green-glow)', border:'1px solid #2DDBA644', borderRadius:10, padding:'10px 14px', marginBottom:12, color:'var(--green)', fontSize:13 }}>{success}</div>}

      {!isOwner && doubt.status === 'open' && (
        <Card style={{ marginBottom:18 }}>
          <h3 style={{ fontSize:15, marginBottom:12 }}>Apply to Help</h3>
          {alreadyApplied ? (
            <p style={{ color:'var(--text-muted)', fontSize:14 }}>✅ You've already applied. Waiting for the student to review.</p>
          ) : (
            <>
              <Textarea value={applyMsg} onChange={e=>setApplyMsg(e.target.value)} placeholder="Briefly introduce yourself... (optional)" rows={3} />
              <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
                <Btn onClick={handleApply} loading={applying}>📩 Apply Now</Btn>
              </div>
            </>
          )}
        </Card>
      )}

      {doubt.status === 'in_progress' && doubt.session && (
        <Btn onClick={()=>setSessionData({_id:doubt.session})} fullWidth style={{ marginBottom:18 }}>💬 Open Session</Btn>
      )}

      {isOwner && (doubt.applicants||[]).length > 0 && (
        <div>
          <h3 style={{ fontSize:16, marginBottom:14 }}>Applicants ({doubt.applicants.length})</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {doubt.applicants.map((a,i)=>{
              const h = a.helper||{};
              const sel = doubt.selectedHelper?._id===h._id||doubt.selectedHelper===h._id;
              const online = h.lastSeen && (Date.now() - new Date(h.lastSeen).getTime()) < 60000;
              return (
                <Card key={h._id||i} style={{ borderColor:sel?'#2DDBA644':'var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ position:'relative' }}>
                        <Avatar name={h.name} size={40}/>
                        <span title={online?'Online':'Offline'} style={{ position:'absolute', bottom:-1, right:-1, width:11, height:11, borderRadius:'50%', background: online?'var(--green)':'var(--text-dim)', border:'2px solid var(--surface)' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:2 }}>{h.name}</p>
                        <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{h.department} · {online ? <span style={{ color:'var(--green)' }}>Online</span> : 'Offline'}</p>
                        {h.averageRating>0 && <div style={{ display:'flex', gap:5, alignItems:'center' }}><Stars rating={h.averageRating}/><span style={{ fontSize:12, color:'var(--text-muted)' }}>{h.averageRating.toFixed(1)}</span></div>}
                        {a.message && <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:5, fontStyle:'italic' }}>"{a.message}"</p>}
                      </div>
                    </div>
                    {doubt.status==='open' && !sel ? (
                      <Btn size="sm" onClick={()=>online ? handleSelect(h._id) : setSchedulingFor(h._id)} loading={selectingId===h._id}>{online ? 'Select Helper' : 'Propose Time'}</Btn>
                    ) : sel ? (
                      <Badge label="✓ Selected" color="var(--green)"/>
                    ) : null}
                  </div>
                  {schedulingFor===h._id && (
                    <div style={{ marginTop:12, padding:12, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:180 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.05em', marginBottom:5 }}>PROPOSE A TIME</p>
                        <input type="datetime-local" value={scheduledTime} onChange={e=>setScheduledTime(e.target.value)} min={new Date(Date.now()+5*60000).toISOString().slice(0,16)} />
                      </div>
                      <Btn size="sm" onClick={()=>handleSelect(h._id, new Date(scheduledTime).toISOString())} disabled={!scheduledTime} loading={selectingId===h._id}>Send Proposal</Btn>
                      <Btn size="sm" variant="ghost" onClick={()=>{setSchedulingFor(null);setScheduledTime('');}}>Cancel</Btn>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {isOwner && (doubt.applicants||[]).length===0 && doubt.status==='open' && (
        <Empty icon="⏳" title="No applicants yet" subtitle="Your doubt has been posted. Helpers will apply soon." />
      )}
    </div>
  );
}

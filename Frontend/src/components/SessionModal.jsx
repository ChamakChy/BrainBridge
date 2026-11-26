import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { sessionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Btn, Avatar, Spinner, Stars } from './UI';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ── Live shared whiteboard ────────────────────────────────────────────────────
function Whiteboard({ socketRef, sessionId }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [color, setColor] = useState('#4F8EF7');
  const [size, setSize] = useState(3);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const drawLine = (from, to, c, w) => {
    const ctx = getCtx();
    if (!ctx || !from || !to) return;
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width; canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const onDraw = ({ stroke }) => drawLine(stroke.from, stroke.to, stroke.color, stroke.size);
    const onClear = () => { const ctx = getCtx(); if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); };
    socket.on('whiteboard_draw', onDraw);
    socket.on('whiteboard_clear', onClear);
    return () => { socket.off('whiteboard_draw', onDraw); socket.off('whiteboard_clear', onClear); };
  }, [socketRef.current]);

  const posFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const start = (e) => { drawing.current = true; last.current = posFromEvent(e); };
  const stop = () => { drawing.current = false; last.current = null; };
  const move = (e) => {
    if (!drawing.current) return;
    const pos = posFromEvent(e);
    drawLine(last.current, pos, color, size);
    socketRef.current?.emit('whiteboard_draw', { sessionId, stroke: { from: last.current, to: pos, color, size } });
    last.current = pos;
  };

  const clearBoard = () => {
    const ctx = getCtx();
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socketRef.current?.emit('whiteboard_clear', { sessionId });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 16px', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        {['#4F8EF7','#2DDBA6','#F75F5F','#F5B93E','#A78BFA','#ffffff'].map(c => (
          <button key={c} onClick={() => setColor(c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: color === c ? '2px solid var(--text)' : '1px solid var(--border)', cursor: 'pointer' }} />
        ))}
        <input type="range" min="1" max="12" value={size} onChange={e => setSize(Number(e.target.value))} style={{ width: 80 }} />
        <Btn size="sm" variant="ghost" onClick={clearBoard} style={{ marginLeft: 'auto' }}>Clear board</Btn>
      </div>
      <div style={{ flex: 1, borderRadius: 12, border: '1px solid var(--border)', background: '#0e1420', overflow: 'hidden', minHeight: 240 }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={start} onMouseUp={stop} onMouseLeave={stop} onMouseMove={move}
          onTouchStart={start} onTouchEnd={stop} onTouchMove={move}
        />
      </div>
    </div>
  );
}

export default function SessionModal({ session: init, onClose }) {
  const { user } = useAuth();
  const [session, setSession] = useState(init);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [confirmLeft, setConfirmLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [peerTyping, setPeerTyping] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingDone, setRatingDone] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [tab, setTab] = useState('chat');
  const [readyLoading, setReadyLoading] = useState(false);
  const [peerReady, setPeerReady] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // ── Live voice call state ───────────────────────────────────────────────────
  const [callStatus, setCallStatus] = useState('idle'); // idle | calling | incoming | connected
  const [muted, setMuted] = useState(false);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingCandidates = useRef([]);
  const incomingOfferRef = useRef(null);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);

  const isStudent = user?._id === (session?.student?._id || session?.student);
  const peer = isStudent ? session?.helper : session?.student;
  const isHelper = !isStudent;

  useEffect(() => {
    if (!session?.endsAt) return;
    const t = setInterval(() => setTimeLeft(Math.max(0, Math.floor((new Date(session.endsAt) - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [session?.endsAt]);

  useEffect(() => {
    if (!session?.confirmationDeadline || session.status !== 'pending_confirmation') return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(session.confirmationDeadline) - Date.now()) / 1000));
      setConfirmLeft(left);
      if (left === 0) { setCancelReason('confirmation_timeout'); setSession(p => ({ ...p, status: 'cancelled' })); }
    }, 1000);
    return () => clearInterval(t);
  }, [session?.confirmationDeadline, session?.status]);

  // ── WebRTC helpers ───────────────────────────────────────────────────────────
  const teardownCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    pendingCandidates.current = [];
    incomingOfferRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setCallStatus('idle');
    setMuted(false);
  };

  const createPeerConnection = (sessionId) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => { if (e.candidate) socketRef.current?.emit('webrtc_ice_candidate', { sessionId, candidate: e.candidate }); };
    pc.ontrack = (e) => {
      if (!remoteAudioRef.current) return;
      remoteAudioRef.current.srcObject = e.streams[0];
      // Some browsers need an explicit play() even with the autoPlay attribute set,
      // especially when the <audio> element existed before the track arrived.
      remoteAudioRef.current.play().catch(err => console.warn('Remote audio playback blocked:', err));
    };
    pc.oniceconnectionstatechange = () => console.log('[call] ICE state:', pc.iceConnectionState);
    pc.onconnectionstatechange = () => {
      console.log('[call] connection state:', pc.connectionState);
      if (pc.connectionState === 'failed') { teardownCall(); return; }
      if (pc.connectionState === 'disconnected') {
        // Give it a few seconds to self-recover (common on flaky local networks)
        // before actually tearing the call down.
        setTimeout(() => { if (pcRef.current === pc && pc.connectionState === 'disconnected') teardownCall(); }, 5000);
      }
    };
    return pc;
  };

  const startCall = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Voice calls need a secure context (localhost or HTTPS). If you\'re testing from another device on the network, use HTTPS or open it on localhost.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPeerConnection(session._id);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pcRef.current = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('webrtc_offer', { sessionId: session._id, offer });
      setCallStatus('calling');
    } catch (err) { console.error('[call] startCall failed:', err); alert(`Couldn't start the call: ${err.message || err.name}`); }
  };

  const acceptCall = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Voice calls need a secure context (localhost or HTTPS). If you\'re testing from another device on the network, use HTTPS or open it on localhost.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPeerConnection(session._id);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pcRef.current = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
      for (const c of pendingCandidates.current) await pc.addIceCandidate(new RTCIceCandidate(c));
      pendingCandidates.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('webrtc_answer', { sessionId: session._id, answer });
      setCallStatus('connected');
    } catch (err) { console.error('[call] acceptCall failed:', err); alert(`Couldn't accept the call: ${err.message || err.name}`); teardownCall(); }
  };

  const declineCall = () => {
    socketRef.current?.emit('call_end', { sessionId: session._id });
    teardownCall();
  };

  const endCall = () => {
    socketRef.current?.emit('call_end', { sessionId: session._id });
    teardownCall();
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()?.[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  };

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (!token || !session?._id) return;
    const socket = io('/', { transports: ['websocket','polling'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('authenticate', { token }));
    socket.on('authenticated', () => {
      socket.emit('join_session', { sessionId: session._id });
      // Fix 2 — keep this client's presence heartbeat fresh while the modal is open
      socket.heartbeatTimer = setInterval(() => socket.emit('heartbeat'), 20000);
    });
    socket.on('session_joined', ({ session: s, messages: msgs }) => { setSession(s); setMessages(msgs || []); setLoading(false); });
    socket.on('new_message', msg => { setMessages(p => [...p, msg]); setPeerTyping(false); });
    socket.on('user_typing', ({ userId, isTyping }) => { if (userId !== user?._id) setPeerTyping(isTyping); });
    socket.on('session_completed', () => { setSession(p => ({ ...p, status: 'completed' })); setShowRating(true); });
    socket.on('session_expired', () => setSession(p => ({ ...p, status: 'expired' })));
    socket.on('session_activated', ({ startedAt, endsAt }) => setSession(p => ({ ...p, status: 'active', startedAt, endsAt })));
    socket.on('peer_ready', () => setPeerReady(true));
    socket.on('session_schedule_accepted', () => sessionsAPI.getById(session._id).then(r => setSession(r.data.session)).catch(() => {}));
    socket.on('session_cancelled', ({ reason }) => { setCancelReason(reason || ''); setSession(p => ({ ...p, status: 'cancelled' })); });

    // ── Voice call signaling ───────────────────────────────────────────────────
    socket.on('webrtc_offer', ({ offer }) => {
      incomingOfferRef.current = offer;
      setCallStatus(prev => (prev === 'idle' ? 'incoming' : prev));
    });
    socket.on('webrtc_answer', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        // Bug fix: candidates that arrived before the answer were queued but
        // never applied on the caller's side — only the callee flushed its queue.
        for (const c of pendingCandidates.current) { try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.warn('[call] addIceCandidate failed:', e); } }
        pendingCandidates.current = [];
        setCallStatus('connected');
      }
    });
    socket.on('webrtc_ice_candidate', async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) { try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { console.warn('[call] addIceCandidate failed:', e); } }
      else pendingCandidates.current.push(candidate);
    });
    socket.on('call_end', () => teardownCall());

    sessionsAPI.getById(session._id).then(r => { setSession(r.data.session); setMessages(r.data.session.messages || []); setLoading(false); }).catch(() => setLoading(false));
    return () => { clearInterval(socket.heartbeatTimer); teardownCall(); socket.disconnect(); };
  }, [session?._id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, peerTyping]);

  const send = () => {
    if (!input.trim()) return;
    socketRef.current?.emit('send_message', { sessionId: session._id, content: input.trim() });
    setInput('');
  };

  const handleTyping = val => {
    setInput(val);
    socketRef.current?.emit('typing', { sessionId: session._id, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current?.emit('typing', { sessionId: session._id, isTyping: false }), 1500);
  };

  const complete = async () => {
    try { await sessionsAPI.complete(session._id); teardownCall(); setShowRating(true); } catch {}
  };

  const submitRating = async () => {
    setRatingLoading(true);
    try { await sessionsAPI.rate(session._id, { score: myRating, comment }); setRatingDone(true); } catch {}
    finally { setRatingLoading(false); }
  };

  const markReady = async () => {
    setReadyLoading(true);
    try {
      const r = await sessionsAPI.ready(session._id);
      setSession(r.data.session);
    } catch (err) {
      if (err.response?.data?.message?.includes('expired')) { setCancelReason('confirmation_timeout'); setSession(p => ({ ...p, status: 'cancelled' })); }
    } finally { setReadyLoading(false); }
  };

  const acceptSchedule = async () => {
    setScheduleLoading(true);
    try { const r = await sessionsAPI.acceptSchedule(session._id); setSession(r.data.session); } catch {}
    finally { setScheduleLoading(false); }
  };

  const declineSchedule = async () => {
    setScheduleLoading(true);
    try { await sessionsAPI.declineSchedule(session._id); setCancelReason('schedule_declined'); setSession(p => ({ ...p, status: 'cancelled' })); } catch {}
    finally { setScheduleLoading(false); }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const r = await sessionsAPI.upload(session._id, file);
      socketRef.current?.emit('send_message', { sessionId: session._id, content: r.data.url, type: r.data.type });
    } catch {}
    finally { setUploading(false); }
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2,'0');
  const secs = String(timeLeft % 60).padStart(2,'0');
  const cMins = String(Math.floor(confirmLeft / 60)).padStart(2,'0');
  const cSecs = String(confirmLeft % 60).padStart(2,'0');
  const warn = timeLeft < 300 && timeLeft > 0;
  const ended = session?.status === 'completed' || session?.status === 'expired';

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Spinner size={40} /><p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    </div>
  );

  const shell = (content, width = 460) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: width, animation: 'fadeUp 0.2s ease' }}>
        {content}
      </div>
    </div>
  );

  // ── Cancelled / auto-fallback screen ────────────────────────────────────────
  if (session?.status === 'cancelled') {
    const reasonText = {
      confirmation_timeout: "The 3-minute confirmation window expired before both of you confirmed readiness. No penalty was incurred — the doubt has been reopened for matching.",
      schedule_declined: 'The helper declined the proposed time slot. The doubt has been reopened for matching.',
    }[cancelReason] || 'This match was cancelled. The doubt has been reopened for matching.';
    return shell(
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>⏱️</div>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Match cancelled</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{reasonText}</p>
        <Btn onClick={onClose} fullWidth>Close</Btn>
      </div>
    );
  }

  // ── Scheduled (helper offline at select-time) ───────────────────────────────
  if (session?.status === 'scheduled') {
    return shell(
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>📅</div>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Session proposed</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 6 }}>{peer?.name} was offline, so a time slot was proposed instead of starting the timer right away.</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 20 }}>{session.scheduledFor ? new Date(session.scheduledFor).toLocaleString() : '—'}</p>
        {isHelper ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={declineSchedule} loading={scheduleLoading} fullWidth>Decline</Btn>
            <Btn onClick={acceptSchedule} loading={scheduleLoading} fullWidth>Accept</Btn>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Waiting for {peer?.name} to accept...</p>
        )}
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginTop: 14 }}>Close</button>
      </div>
    );
  }

  // ── Pending confirmation handshake ───────────────────────────────────────────
  if (session?.status === 'pending_confirmation') {
    const myReady = isStudent ? session.studentReady : session.helperReady;
    const otherReady = isStudent ? session.helperReady : session.studentReady;
    return shell(
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🤝</div>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Match found with {peer?.name}!</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Confirm you're ready — the 1-hour timer only starts once you both do.</p>
        <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 800, color: confirmLeft < 30 ? 'var(--red)' : 'var(--gold)', marginBottom: 18 }}>{cMins}:{cSecs}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
          <div><Avatar name={user?.name} size={40} /><p style={{ fontSize: 12, marginTop: 6, color: myReady ? 'var(--green)' : 'var(--text-muted)' }}>{myReady ? '✓ Ready' : 'You'}</p></div>
          <div><Avatar name={peer?.name} size={40} /><p style={{ fontSize: 12, marginTop: 6, color: otherReady ? 'var(--green)' : 'var(--text-muted)' }}>{otherReady ? '✓ Ready' : (peerReady ? '✓ Ready' : peer?.name)}</p></div>
        </div>
        {myReady ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Waiting for {peer?.name} to confirm...</p>
        ) : (
          <Btn onClick={markReady} loading={readyLoading} fullWidth>I'm Ready</Btn>
        )}
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginTop: 14 }}>Close</button>
      </div>
    );
  }

  if (showRating) return shell(
    ratingDone ? (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Thank you!</p>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>You earned +5 coins for rating.</p>
        <Btn onClick={onClose} fullWidth>Close</Btn>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ fontSize: 18 }}>Rate your session</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>How was your experience with <strong>{peer?.name}</strong>?</p>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <Stars rating={myRating} interactive onRate={setMyRating} max={5} />
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Leave a comment (optional)..." rows={3} style={{ resize: 'none' }} />
        <Btn onClick={submitRating} disabled={myRating === 0} loading={ratingLoading} fullWidth>Submit (+5 ₵ bonus)</Btn>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>Skip for now</button>
      </div>
    ), 420
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 640, height: '85vh', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.2s ease' }}>
        <audio ref={remoteAudioRef} autoPlay />

        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={peer?.name} size={36} />
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{peer?.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session?.doubt?.department} session</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: warn ? 'var(--red-glow)' : 'var(--green-glow)', border: `1px solid ${warn ? '#F75F5F44' : '#2DDBA644'}`, borderRadius: 10, padding: '4px 12px' }}>
              {!ended && <div style={{ width: 7, height: 7, borderRadius: '50%', background: warn ? 'var(--red)' : 'var(--green)', animation: 'pulse 1.5s infinite' }} />}
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: warn ? 'var(--red)' : ended ? 'var(--text-muted)' : 'var(--green)' }}>{ended ? 'Ended' : `${mins}:${secs}`}</span>
            </div>
            {isStudent && session?.status === 'active' && <Btn size="sm" variant="success" onClick={complete}>✓ Complete</Btn>}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* Live voice call bar */}
        {!ended && (
          <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: callStatus !== 'idle' ? 'var(--accent-glow)' : 'none' }}>
            {callStatus === 'idle' && <Btn size="sm" variant="ghost" onClick={startCall}>🎙️ Start voice call</Btn>}
            {callStatus === 'calling' && (
              <>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📞 Calling {peer?.name}...</span>
                <Btn size="sm" variant="ghost" onClick={endCall} style={{ marginLeft: 'auto' }}>Cancel</Btn>
              </>
            )}
            {callStatus === 'incoming' && (
              <>
                <span style={{ fontSize: 13, fontWeight: 600 }}>📞 {peer?.name} is calling...</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <Btn size="sm" variant="ghost" onClick={declineCall}>Decline</Btn>
                  <Btn size="sm" variant="success" onClick={acceptCall}>Accept</Btn>
                </div>
              </>
            )}
            {callStatus === 'connected' && (
              <>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Voice call connected</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <Btn size="sm" variant="ghost" onClick={toggleMute}>{muted ? '🔇 Unmute' : '🎤 Mute'}</Btn>
                  <Btn size="sm" variant="danger" onClick={endCall}>End call</Btn>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px 0' }}>
          {[{ k: 'chat', l: '💬 Chat' }, { k: 'whiteboard', l: '🖊️ Whiteboard' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding: '8px 14px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: tab === t.k ? 'var(--bg)' : 'none',
              color: tab === t.k ? 'var(--text)' : 'var(--text-muted)',
            }}>{t.l}</button>
          ))}
        </div>

        {tab === 'whiteboard' ? (
          <Whiteboard socketRef={socketRef} sessionId={session._id} />
        ) : (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}><p style={{ fontSize: 28, marginBottom: 8 }}>👋</p><p>Session started! Say hello.</p></div>}
              {messages.map((msg, i) => {
                const mine = (msg.sender?._id || msg.sender) === user?._id;
                return (
                  <div key={msg._id || i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '76%', padding: msg.type === 'image' ? 6 : '10px 14px', lineHeight: 1.55, borderRadius: mine ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: mine ? 'linear-gradient(135deg,#4F8EF7,#6A5AF7)' : 'var(--bg)', border: `1px solid ${mine ? 'transparent' : 'var(--border)'}`, fontSize: 14, color: '#fff' }}>
                      {msg.type === 'image' ? (
                        <a href={msg.content} target="_blank" rel="noreferrer"><img src={msg.content} alt="shared" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, display: 'block' }} /></a>
                      ) : msg.type === 'file' ? (
                        <a href={msg.content} target="_blank" rel="noreferrer" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>📎 <span style={{ textDecoration: 'underline' }}>Download file</span></a>
                      ) : msg.content}
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right', padding: msg.type === 'image' ? '0 6px' : 0 }}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })}
              {peerTyping && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Avatar name={peer?.name} size={22} />
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `pulse 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input ref={fileInputRef} type="file" onChange={handleFilePick} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" />
              <button title="Share a file or image" onClick={() => fileInputRef.current?.click()} disabled={ended || uploading} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>{uploading ? <Spinner size={16} /> : '📎'}</button>
              <input value={input} onChange={e => handleTyping(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={ended ? 'Session ended' : 'Type a message... (Enter to send)'} disabled={ended} style={{ flex: 1, borderRadius: 12 }} />
              <Btn onClick={send} disabled={!input.trim() || ended}>Send</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

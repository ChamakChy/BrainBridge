const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');

const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('authenticate', async ({ token }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id).select('name department institution role');
        if (!user) return socket.emit('error', { message: 'Auth failed' });
        socket.userId = user._id.toString();
        socket.user = user;
        onlineUsers.set(socket.userId, socket.id);
        socket.join(`user_${socket.userId}`);
        socket.join(`inst_${user.institution}`);
        socket.emit('authenticated', { userId: socket.userId, role: user.role, onlineCount: onlineUsers.size });
      } catch { socket.emit('error', { message: 'Invalid token' }); }
    });

    socket.on('join_session', async ({ sessionId }) => {
      if (!socket.userId) return socket.emit('error', { message: 'Not authenticated' });
      try {
        const session = await Session.findById(sessionId).populate('student','name department').populate('helper','name department');
        if (!session) return socket.emit('error', { message: 'Session not found' });
        const isParticipant = [session.student._id.toString(), session.helper._id.toString()].includes(socket.userId);
        const isStaff = socket.user?.role === 'admin' || socket.user?.role === 'moderator';
        if (!isParticipant && !isStaff) return socket.emit('error', { message: 'Not a participant' });
        socket.join(session.roomId);
        socket.emit('session_joined', { session: { _id: session._id, roomId: session.roomId, student: session.student, helper: session.helper, startedAt: session.startedAt, endsAt: session.endsAt, status: session.status }, messages: session.messages.slice(-100) });
        socket.to(session.roomId).emit('peer_joined', { userId: socket.userId, name: socket.user.name });
      } catch { socket.emit('error', { message: 'Failed to join session' }); }
    });

    socket.on('send_message', async ({ sessionId, content, type = 'text' }) => {
      if (!socket.userId) return;
      if (!content?.trim() || content.length > 2000) return socket.emit('error', { message: 'Invalid message' });
      try {
        const session = await Session.findById(sessionId);
        if (!session || session.status !== 'active') return socket.emit('error', { message: 'Session not active' });
        if (new Date() > session.endsAt) {
          session.status = 'expired'; await session.save();
          io.to(session.roomId).emit('session_expired', { sessionId: session._id }); return;
        }
        session.messages.push({ sender: socket.userId, content: content.trim(), type, sentAt: new Date() });
        await session.save();
        const msg = session.messages[session.messages.length - 1];
        io.to(session.roomId).emit('new_message', { _id: msg._id, sender: { _id: socket.userId, name: socket.user.name }, content: msg.content, type: msg.type, sentAt: msg.sentAt });
      } catch { socket.emit('error', { message: 'Failed to send' }); }
    });

    socket.on('typing', ({ sessionId, isTyping }) => {
      if (socket.userId) socket.to(`session_${sessionId}`).emit('user_typing', { userId: socket.userId, name: socket.user?.name, isTyping });
    });

    // Fix 2 — Heartbeat Filter: refresh lastSeen while the client is actively connected,
    // so presence stays accurate even between HTTP calls.
    socket.on('heartbeat', async () => {
      if (!socket.userId) return;
      try { await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() }); } catch {}
    });

    // ── Shared whiteboard (relay-only, no persistence) ──────────────────────────
    socket.on('whiteboard_draw', ({ sessionId, stroke }) => {
      if (!socket.userId || !sessionId || !stroke) return;
      socket.to(`session_${sessionId}`).emit('whiteboard_draw', { stroke, userId: socket.userId });
    });

    socket.on('whiteboard_clear', ({ sessionId }) => {
      if (!socket.userId || !sessionId) return;
      socket.to(`session_${sessionId}`).emit('whiteboard_clear', { userId: socket.userId });
    });

    // ── Live voice call signaling (WebRTC) — server only relays, never touches media ──
    socket.on('webrtc_offer', ({ sessionId, offer }) => {
      if (!socket.userId || !sessionId) return;
      socket.to(`session_${sessionId}`).emit('webrtc_offer', { offer, userId: socket.userId });
    });
    socket.on('webrtc_answer', ({ sessionId, answer }) => {
      if (!socket.userId || !sessionId) return;
      socket.to(`session_${sessionId}`).emit('webrtc_answer', { answer, userId: socket.userId });
    });
    socket.on('webrtc_ice_candidate', ({ sessionId, candidate }) => {
      if (!socket.userId || !sessionId) return;
      socket.to(`session_${sessionId}`).emit('webrtc_ice_candidate', { candidate, userId: socket.userId });
    });
    socket.on('call_end', ({ sessionId }) => {
      if (!socket.userId || !sessionId) return;
      socket.to(`session_${sessionId}`).emit('call_end', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      if (socket.userId) onlineUsers.delete(socket.userId);
    });
  });
};

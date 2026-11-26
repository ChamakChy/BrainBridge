const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/doubts',    require('./routes/doubts'));
const sessionsRouter = require('./routes/sessions');
app.use('/api/sessions',  sessionsRouter);

app.get('/api/health', (req, res) => res.json({ success: true, message: '🧠 BrainBridge API running' }));

require('./socket/chatSocket')(io);

// Fix 1 — Auto-Fallback safety net: sweep for pending_confirmation sessions whose
// 3-minute window lapsed with nobody polling, so matches never linger indefinitely.
setInterval(() => { sessionsRouter.sweepExpiredSessions(io).catch(e => console.error('Sweep error:', e.message)); }, 30 * 1000);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/brainbridge')
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => console.log(`🚀 BrainBridge server running on port ${PORT}`));
  })
  .catch((err) => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

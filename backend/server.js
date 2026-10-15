import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import gatepassRoutes from './routes/gatepasses.js';
import hostellerRoutes from './routes/hostellers.js';
import securityRoutes from './routes/security.js';
import { authenticate } from './middleware/auth.js';
import GatePass from './models/GatePass.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'hostel-gatepass-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/gatepasses', gatepassRoutes);
app.use('/api/hostellers', hostellerRoutes);
app.use('/api/security', securityRoutes);

app.get('/api/profile', authenticate, (req, res) => res.json({ user: req.user }));

app.get('/api/dashboard', authenticate, async (req, res, next) => {
  try {
    const filter = req.user.role === 'hosteller' ? { hosteller: req.user._id } : {};
    const passes = await GatePass.find(filter);
    const counts = { total: passes.length, pending: 0, approved: 0, outside: 0, completed: 0, rejected: 0 };
    for (const p of passes) {
      if (p.status === 'PENDING') counts.pending++;
      if (p.status === 'APPROVED') counts.approved++;
      if (p.status === 'OUT') counts.outside++;
      if (p.status === 'COMPLETED') counts.completed++;
      if (p.status === 'REJECTED') counts.rejected++;
    }
    res.json({ role: req.user.role, counts });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format.' });
  if (err.code === 11000) return res.status(409).json({ message: 'Username or student ID already exists.' });
  res.status(500).json({ message: 'Internal server error.' });
});

const port = Number(process.env.PORT || 5000);
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_gatepass');
  console.log('MongoDB connected');
  app.listen(port, () => console.log(`API listening at http://localhost:${port}`));
} catch (err) {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
}

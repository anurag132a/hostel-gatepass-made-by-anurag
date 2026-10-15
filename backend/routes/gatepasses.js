import { Router } from 'express';
import crypto from 'node:crypto';
import GatePass from '../models/GatePass.js';
import { authenticate, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
const staff = ['principal', 'hod', 'warden', 'security'];

router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'hosteller' ? { hosteller: req.user._id } : {};
    const passes = await GatePass.find(filter).populate('hosteller', 'name username studentId roomNo department').sort({ createdAt: -1 });
    res.json({ gatepasses: passes });
  } catch (err) { next(err); }
});

router.post('/', allowRoles('hosteller'), async (req, res, next) => {
  try {
    const { reason, destination, outTime, expectedReturn } = req.body;
    if (!String(reason || '').trim() || !String(destination || '').trim() || !outTime || !expectedReturn) {
      return res.status(400).json({ message: 'Reason, destination, exit time and expected return are required.' });
    }
    const out = new Date(outTime), back = new Date(expectedReturn);
    if (Number.isNaN(+out) || Number.isNaN(+back) || back <= out) {
      return res.status(400).json({ message: 'Expected return must be after exit time.' });
    }
    const gatepass = await GatePass.create({
      hosteller: req.user._id, reason: reason.trim(), destination: destination.trim(),
      outTime: out, expectedReturn: back
    });
    res.status(201).json({ message: 'Request sent to Principal, HOD and Warden.', gatepass });
  } catch (err) { next(err); }
});

router.post('/:id/decision', allowRoles('principal', 'hod', 'warden'), async (req, res, next) => {
  try {
    const { decision } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ message: 'Decision must be APPROVED or REJECTED.' });
    const gp = await GatePass.findById(req.params.id);
    if (!gp) return res.status(404).json({ message: 'Gate pass not found.' });
    if (gp.status !== 'PENDING') return res.status(409).json({ message: 'This request is no longer pending.' });
    const role = req.user.role;
    if (gp.approvals[role] !== 'PENDING') return res.status(409).json({ message: 'You have already decided on this request.' });
    gp.approvals[role] = decision;
    if (Object.values(gp.approvals).includes('REJECTED')) {
      gp.status = 'REJECTED';
      gp.exitCode = null; gp.entryCode = null;
    } else if (Object.values(gp.approvals).every(v => v === 'APPROVED')) {
      gp.status = 'APPROVED';
      gp.exitCode = gp.exitCode || `OUT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      gp.entryCode = gp.entryCode || `IN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
    await gp.save();
    res.json({ message: `Request ${decision.toLowerCase()}.`, gatepass: gp });
  } catch (err) { next(err); }
});

export default router;

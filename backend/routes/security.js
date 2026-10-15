import { Router } from 'express';
import GatePass from '../models/GatePass.js';
import { authenticate, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, allowRoles('security'));

router.post('/verify', async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ message: 'Enter an exit or entry code.' });
    const gp = await GatePass.findOne({ $or: [{ exitCode: code }, { entryCode: code }] }).populate('hosteller', 'name studentId roomNo');
    if (!gp) return res.status(404).json({ message: 'Invalid code.' });
    if (gp.status === 'APPROVED' && gp.exitCode === code) {
      gp.actualExit = new Date(); gp.status = 'OUT'; await gp.save();
      return res.json({ message: 'Exit recorded successfully.', action: 'EXIT_RECORDED', gatepass: gp });
    }
    if (gp.status === 'OUT' && gp.entryCode === code) {
      gp.actualEntry = new Date(); gp.status = 'COMPLETED'; await gp.save();
      return res.json({ message: 'Entry recorded successfully.', action: 'ENTRY_RECORDED', gatepass: gp });
    }
    return res.status(409).json({ message: 'Code is not valid for the current gate-pass state.' });
  } catch (err) { next(err); }
});

export default router;

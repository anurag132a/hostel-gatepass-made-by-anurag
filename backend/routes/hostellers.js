import { Router } from 'express';
import User from '../models/User.js';
import GatePass from '../models/GatePass.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { publicUser } from '../utils/sanitize.js';

const router = Router();
router.use(authenticate, allowRoles('principal', 'hod', 'warden', 'security'));

router.get('/', async (_req, res, next) => {
  try {
    const users = await User.find({ role: 'hosteller' }).select('-passwordHash').sort({ name: 1 });
    res.json({ hostellers: users });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'hosteller' }).select('-passwordHash');
    if (!student) return res.status(404).json({ message: 'Hosteller not found.' });
    const gatepasses = await GatePass.find({ hosteller: student._id }).sort({ createdAt: -1 });
    res.json({ hosteller: publicUser(student), gatepasses });
  } catch (err) { next(err); }
});

export default router;

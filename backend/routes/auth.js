import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { publicUser } from '../utils/sanitize.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

export default router;

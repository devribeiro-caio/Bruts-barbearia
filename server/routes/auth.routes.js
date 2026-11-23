import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { authenticate, clearSessionCookie, setSessionCookie } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/authRateLimit.js';
import { asyncHandler, HttpError } from '../utils/errors.js';
import { loginSchema, parseOrThrow, registerSchema } from '../utils/validation.js';

const router = Router();

function serializeUser(user) {
  return { id: String(user._id ?? user.id), name: user.name, email: user.email, role: user.role };
}

router.post('/register', authRateLimit, asyncHandler(async (req, res) => {
  const input = parseOrThrow(registerSchema, req.body);
  const email = input.email.toLowerCase();
  if (await User.exists({ email })) throw new HttpError(409, 'Já existe uma conta com este e-mail.');

  let user;
  try {
    user = await User.create({
      name: input.name,
      email,
      whatsappPhone: input.whatsappPhone.replace(/\D/g, ''),
      whatsappOptIn: input.whatsappOptIn,
      whatsappOptInAt: input.whatsappOptIn ? new Date() : null,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: 'customer',
    });
  } catch (error) {
    if (error?.code === 11000) throw new HttpError(409, 'Já existe uma conta com este e-mail.');
    throw error;
  }

  setSessionCookie(res, user);
  res.status(201).json({ user: serializeUser(user) });
}));

router.post('/login', authRateLimit, asyncHandler(async (req, res) => {
  const input = parseOrThrow(loginSchema, req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  const isValid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!isValid) throw new HttpError(401, 'E-mail ou senha inválidos.');

  setSessionCookie(res, user);
  res.json({ user: serializeUser(user) });
}));

router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;

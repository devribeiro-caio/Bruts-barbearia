import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/errors.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d', issuer: 'brutus-cortes' });
  res.cookie(env.cookieName, token, cookieOptions);
}

export function clearSessionCookie(res) {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.cookieName];
  if (!token) throw new HttpError(401, 'Entre na sua conta para continuar.');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { issuer: 'brutus-cortes' });
  } catch {
    throw new HttpError(401, 'Sua sessão expirou. Entre novamente.');
  }

  const user = await User.findById(payload.sub).select('name email role').lean();
  if (!user) throw new HttpError(401, 'Sua sessão não é válida. Entre novamente.');
  req.user = { ...user, id: String(user._id) };
  next();
});

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Acesso exclusivo do administrador.'));
  return next();
}

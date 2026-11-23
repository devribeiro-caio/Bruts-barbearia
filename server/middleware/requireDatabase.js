import { isDatabaseReady } from '../config/database.js';
import { HttpError } from '../utils/errors.js';

export function requireDatabase(_req, _res, next) {
  if (!isDatabaseReady()) return next(new HttpError(503, 'Banco de dados ainda não configurado. Consulte o README para conectar o MongoDB Atlas.'));
  return next();
}

import { esEntornoLocal } from './entorno.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: !esEntornoLocal(),
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: REFRESH_COOKIE_MAX_AGE_MS
});

export const getClearRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: !esEntornoLocal(),
  sameSite: 'strict',
  path: '/api/auth'
});

import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import config from '../config';

const CSRF_COOKIE_NAME = 'x-csrf-token';

const {
  generateCsrfToken,
  doubleCsrfProtection,
  invalidCsrfTokenError,
} = doubleCsrf({
  getSecret: () => config.csrfSecret,
  getSessionIdentifier: (req: Request) =>
    (req.user as { id?: string })?.id || req.ip || 'anonymous',
  cookieName: CSRF_COOKIE_NAME,
  cookieOptions: {
    httpOnly: false,       // Must be readable by JS on the frontend
    sameSite: config.node_env === 'production' ? 'none' : 'lax',
    secure: config.node_env === 'production',
    path: '/',
  },
  size: 64,
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string | undefined,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  skipCsrfProtection: (req: Request) => {
    // Skip CSRF for webhook endpoints (called by third-party services)
    const path = req.path;
    return (
      path.includes('/stripe/webhook') ||
      path.includes('/sslcommerz/ipn')
    );
  },
});

/**
 * Generate and return a CSRF token.
 * The token is also automatically set as a cookie by generateCsrfToken.
 */
export { generateCsrfToken };

/**
 * Express middleware that protects state-changing routes against CSRF attacks.
 * Uses the Double Submit Cookie pattern.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  doubleCsrfProtection(req, res, (err?: unknown) => {
    if (err) {
      return next(invalidCsrfTokenError);
    }
    next();
  });
}

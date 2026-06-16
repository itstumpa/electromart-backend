import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';

import config from './app/config';
import './app/config/passport';
import { swaggerSpec } from './app/config/swagger';
import { csrfProtection, generateCsrfToken } from './app/middlewares/csrf';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import { globalLimiter } from './app/middlewares/rateLimiter';
import { requestLogger } from './app/middlewares/requestLogger';
import { slowQueryLogger } from './app/middlewares/slowQueryLogger';
import router from './app/routers';
import { initSocket } from './socket/socket';

const app: Application = express();

// Collect allowed origins for both CORS and CSP
const allowedOrigins = Array.from(
  new Set(
    [config.client_url, config.frontend_url, process.env.LOCAL_FRONTEND_URL].filter((origin): origin is string => Boolean(origin))
  )
);

// ── Security Headers (Helmet + CSP) ────────────────────────────────────
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", 'https://js.stripe.com', 'https://cdn.jsdelivr.net'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://*.stripe.com', ...allowedOrigins],
  connectSrc: ["'self'", 'https://api.stripe.com', 'https://*.stripe.com', ...allowedOrigins],
  frameSrc: ["'self'", 'https://js.stripe.com'],
  objectSrc: ["'none'"],
  ...(config.node_env === 'production' && { upgradeInsecureRequests: [] }),
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── HTTP Parameter Pollution Protection ─────────────────────────────────
app.use(
  hpp({
    whitelist: [
      'category',
      'brand',
      'tags',
      'id',
      'status',
      'sortBy',
      'sortOrder',
      'page',
      'limit',
      'price',
      'rating',
      'search',
      'slug',
    ],
  })
);
// Near the top, after creating app
if (config.node_env === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

app.use(
  cors({
    origin: allowedOrigins.length > 1 ? allowedOrigins : allowedOrigins[0],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    maxAge: 600,
  })
);

app.use(cookieParser());

// ── Stripe Webhook ──────────────────────────────────────────────────────
app.use('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }));

// ── Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Compression ────────────────────────────────────────────────────────
app.use(compression());

// ── Logging ────────────────────────────────────────────────────────────
app.use(requestLogger);
app.use(slowQueryLogger);

// ── Auth ───────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Rate Limiting ──────────────────────────────────────────────────────
app.use(globalLimiter);

// ── CSRF Protection ────────────────────────────────────────────────────
app.use('/api/v1', csrfProtection);
app.get('/api/v1/auth/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// ── HTTP + Socket ──────────────────────────────────────────────────────
const httpServer = http.createServer(app);
initSocket(httpServer);

// ── Main Routes ────────────────────────────────────────────────────────
app.use('/api/v1', router);

app.get('/', (_req: Request, res: Response) => {
  res.send({
    message: 'Server Is Running..',
    environment: config.node_env,
    uptime: process.uptime().toFixed(2) + ' second',
    timeStamp: new Date().toISOString(),
  });
});

// ── Swagger ────────────────────────────────────────────────────────────
if (config.node_env !== 'production') {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Electromart API Docs',
      swaggerOptions: { persistAuthorization: true },
    })
  );
}

// ── Health Check ───────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    service: 'Electromart-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    requestId: req.requestId,
  });
});

// ── Error Handling ─────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

export default app;

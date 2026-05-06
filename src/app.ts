import express, { Application, Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import hpp from "hpp";
import http from "http";
import swaggerUi from "swagger-ui-express";

import router from "./app/routers";
import "./app/config/passport";
import config from "./app/config";
import notFound from "./app/middlewares/notFound";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { initSocket } from "./socket/socket";
import { swaggerSpec } from "./app/config/swagger";
import { globalLimiter } from "./app/middlewares/rateLimiter";
import { requestLogger } from "./app/middlewares/requestLogger";
import { slowQueryLogger } from "./app/middlewares/slowQueryLogger";

const app: Application = express();

// ── Security ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(hpp());

app.use(
  cors({
    origin: config.client_url,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Stripe Webhook ──────────────────────────────────────────────────────
app.use(
  "/api/v1/payments/stripe/webhook",
  express.raw({ type: "application/json" })
);

// ── Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Compression ────────────────────────────────────────────────────────
app.use(compression());

// ── Logging ────────────────────────────────────────────────────────────
app.use(requestLogger);
app.use(slowQueryLogger);

// ── Auth ───────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Rate Limiting ──────────────────────────────────────────────────────
app.use(globalLimiter);

// ── HTTP + Socket ──────────────────────────────────────────────────────
const httpServer = http.createServer(app);
initSocket(httpServer);

// ── Main Routes ────────────────────────────────────────────────────────
app.use("/api/v1", router);

app.get("/", (_req: Request, res: Response) => {
  res.send({
    message: "Server Is Running..",
    environment: config.node_env,
    uptime: process.uptime().toFixed(2) + " second",
    timeStamp: new Date().toISOString(),
  });
});

// ── Swagger ────────────────────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "ElectroMart API Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);

// ── Health Check ───────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    service: "electromart-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    requestId: req.requestId,
  });
});

// ── Error Handling ─────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

export default app;
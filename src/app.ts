import express, { Application, Request, Response } from "express";
import cors from "cors";
import router from "./app/routers";
import passport from "passport";
import "./app/config/passport";
import config from "./app/config/index";
import notFound from "./app/middlewares/notFound";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
// import { rateLimiter,  } from "./app/middlewares/rateLimiter";
import compression from "compression";
import http from "http";
import { initSocket } from "./socket/socket";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./app/config/swagger";
import { globalLimiter } from "./app/middlewares/rateLimiter";


const app: Application = express();

// middlewares
app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

// Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Gzip compression
app.use(compression());
// Redis Rate limit 
app.use(globalLimiter);

const httpServer = http.createServer(app);
initSocket(httpServer);

// MAIN ROUTE
app.use("/api/v1", router);

app.get("/", (_req: Request, res: Response) => {
  res.send({
    message: "Server Is Running..",
    environment: config.node_env,
    uptime: process.uptime().toFixed(2) + " second",
    timeStamp: new Date().toISOString(),
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "ElectroMart API Docs",
    customCss: ".swagger-ui .topbar { background-color: #1a1a2e; }",
    swaggerOptions: {
      persistAuthorization: true, // keeps JWT saved on page refresh
    },
  })
);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
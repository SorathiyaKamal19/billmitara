import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRoutes } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  const allowedOrigins = new Set([
    env.clientOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  const isLanDevOrigin =
    env.nodeEnv !== "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+):5173$/.test(
      origin,
    );
  if (allowedOrigins.has(origin) || isLanDevOrigin) return callback(null, true);
  return callback(new Error(`CORS blocked origin: ${origin}`));
}

export function createApp() {
  const app = express();

  // Add this line for Render
  app.set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://billmitara.com",
        "https://www.billmitara.com",
        "https://billmitara.vercel.app",
        "https://www.billmitara.bond",
        "https://billmitara.bond",
      ],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
    }),
    apiRoutes,
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

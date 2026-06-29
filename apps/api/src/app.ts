import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import { analyzeRoutes } from "./routes/analyze.js";
import { connectStore, disconnectStore } from "./store/redis.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
    },
  });

  // Connect to Redis on startup
  await connectStore();

  app.addHook("onClose", async () => {
    await disconnectStore();
  });

  // Health check
  app.get("/health", async () => ({ status: "ok" }));

  // Routes
  await app.register(analyzeRoutes);

  return app;
}

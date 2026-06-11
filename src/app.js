import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env, logStartupDiagnostics } from "./config/env.js";
import { disconnectMongo } from "./config/database.js";
import { initializeRepositories } from "./config/repositories.js";
import { logger } from "./utils/logger.js";
import { correlationIdMiddleware } from "./middlewares/correlationId.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { createApiRouter } from "./routes/index.js";
import { createContainer } from "./container.js";
import { createSocketServer } from "./socket/index.js";
import { attachSocketIo } from "./config/socket.js";

/** Comma-separated allowlist, optional `[...]` wrapper, or "*" (dev). */
function parseAllowedCorsOrigins(corsOrigin) {
  let raw = corsOrigin.trim();
  if (raw.startsWith("[") && raw.endsWith("]")) {
    raw = raw.slice(1, -1).trim();
  }
  if (raw === "*") return null;
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function createCorsMiddleware(corsOrigin) {
  const allowedOrigins = parseAllowedCorsOrigins(corsOrigin);

  if (allowedOrigins === null) {
    console.log("Allowed CORS origins: * (all)");
    return cors({ origin: true });
  }

  console.log("Allowed CORS origins:", allowedOrigins);

  return cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  });
}

export function createApp() {
  const container = createContainer();
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
    }),
  );
  app.use(helmet());
  app.use(createCorsMiddleware(env.corsOrigin));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", createApiRouter(container));

  app.use((req, res) => {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  });

  app.use(errorHandler);

  return { app, container };
}

export async function startServer() {
  logStartupDiagnostics(logger);
  await initializeRepositories();

  const { app, container } = createApp();
  const server = http.createServer(app);
  const io = createSocketServer(server, {
    authService: container.services.auth,
    userService: container.services.user,
    userRepo: container.repos.user,
    chatService: container.services.chat,
  });
  attachSocketIo(app, io);
  container.registerEventHandlers(io);

  server.listen(env.port, () => {
    logger.info(
      {
        port: env.port,
        health: `http://localhost:${env.port}/api/health`,
        mongoConfigured: Boolean(env.mongodbUri),
      },
      "TaskGo API listening",
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, "Shutting down");
    try {
      await disconnectMongo();
    } catch (err) {
      logger.error({ err }, "MongoDB disconnect error during shutdown");
    }
    server.close(() => {
      io.close(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => {
    shutdown("SIGTERM").catch((err) => {
      logger.error({ err }, "Shutdown failed");
      process.exit(1);
    });
  });
  process.on("SIGINT", () => {
    shutdown("SIGINT").catch((err) => {
      logger.error({ err }, "Shutdown failed");
      process.exit(1);
    });
  });

  return { app, server, io, container };
}

if (process.argv[1] && process.argv[1].endsWith("app.js")) {
  startServer().catch((err) => {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  });
}

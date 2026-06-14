import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().port().default(4000),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  REPOSITORY_DRIVER: Joi.string().valid("inMemory", "mongo").default("inMemory"),
  CORS_ORIGIN: Joi.string().default("*"),
  PAYOS_MOCK_TIMEOUT_MS: Joi.number().integer().min(0).default(5000),
  PAYOS_MOCK_FAIL_RATE: Joi.number().min(0).max(1).default(0.1),
  PAYOS_MOCK_FORCE_TIMEOUT: Joi.boolean().truthy("true").falsy("false").default(false),
  PAYOS_MOCK_FORCE_FAIL: Joi.boolean().truthy("true").falsy("false").default(false),
  IDEMPOTENCY_TTL_MS: Joi.number().integer().positive().default(86400000),
  NEARBY_TASKER_RADIUS_KM: Joi.number().positive().default(20),
  /** MongoDB connection string (required when REPOSITORY_DRIVER=mongo). */
  MONGODB_URI: Joi.string().allow("").optional(),
  /** Connect to MongoDB when the API process starts (requires MONGODB_URI). */
  MONGODB_CONNECT_ON_STARTUP: Joi.boolean().truthy("true").falsy("false").default(true),
  MONGODB_MAX_RETRY_ATTEMPTS: Joi.number().integer().min(1).max(20).default(5),
  MONGODB_RETRY_DELAY_MS: Joi.number().integer().min(100).default(2000),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  MONGODB_APP_NAME: Joi.string().default("TaskGo-API"),
  PAYOS_CLIENT_ID: Joi.string().allow("").optional(),
  PAYOS_API_KEY: Joi.string().allow("").optional(),
  PAYOS_CHECKSUM_KEY: Joi.string().allow("").optional(),
  PAYOS_RETURN_URL: Joi.string().uri().allow("").optional(),
  PAYOS_CANCEL_URL: Joi.string().uri().allow("").optional(),
}).unknown(true);

/**
 * Validate and build the frozen env config (fail-fast).
 * @param {NodeJS.ProcessEnv} source
 */
export function createEnvConfig(source) {
  const { value, error } = schema.validate(source, { abortEarly: false });

  if (error) {
    const messages = error.details.map((d) => d.message).join("; ");
    throw new Error(`Environment validation failed: ${messages}`);
  }

  const isProd = value.NODE_ENV === "production";
  const repositoryDriver = value.REPOSITORY_DRIVER;
  const mongodbUri = (value.MONGODB_URI ?? "").trim() || null;
  const corsOrigin = value.CORS_ORIGIN;

  if (isProd && value.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }

  if (isProd && corsOrigin.trim() === "*") {
    throw new Error('CORS_ORIGIN cannot be "*" in production — set an explicit allowlist');
  }

  if (repositoryDriver === "mongo" && !mongodbUri) {
    throw new Error("MONGODB_URI is required when REPOSITORY_DRIVER=mongo");
  }

  const payosClientId = (value.PAYOS_CLIENT_ID ?? "").trim() || null;
  const payosApiKey = (value.PAYOS_API_KEY ?? "").trim() || null;
  const payosChecksumKey = (value.PAYOS_CHECKSUM_KEY ?? "").trim() || null;
  const payosConfigured = Boolean(payosClientId && payosApiKey && payosChecksumKey);
  const payosReturnUrl =
    (value.PAYOS_RETURN_URL ?? "").trim() || "taskgo://payment/return";
  const payosCancelUrl =
    (value.PAYOS_CANCEL_URL ?? "").trim() || "taskgo://payment/cancel";

  return Object.freeze({
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    jwtSecret: value.JWT_SECRET,
    jwtExpiresIn: value.JWT_EXPIRES_IN,
    repositoryDriver,
    corsOrigin,
    payosMockTimeoutMs: value.PAYOS_MOCK_TIMEOUT_MS,
    payosMockFailRate: value.PAYOS_MOCK_FAIL_RATE,
    payosMockForceTimeout: value.PAYOS_MOCK_FORCE_TIMEOUT,
    payosMockForceFail: value.PAYOS_MOCK_FORCE_FAIL,
    idempotencyTtlMs: value.IDEMPOTENCY_TTL_MS,
    nearbyTaskerRadiusKm: value.NEARBY_TASKER_RADIUS_KM,
    mongodbUri,
    mongoConnectOnStartup: value.MONGODB_CONNECT_ON_STARTUP,
    mongoMaxRetryAttempts: value.MONGODB_MAX_RETRY_ATTEMPTS,
    mongoRetryDelayMs: value.MONGODB_RETRY_DELAY_MS,
    mongoServerSelectionTimeoutMs: value.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    mongoOptions: Object.freeze({
      appName: value.MONGODB_APP_NAME,
    }),
    payosClientId,
    payosApiKey,
    payosChecksumKey,
    payosConfigured,
    payosReturnUrl,
    payosCancelUrl,
  });
}

export const env = createEnvConfig(process.env);

/**
 * Safe startup diagnostics (no secrets). Call once during process boot.
 * @param {import('pino').Logger} log
 */
export function logStartupDiagnostics(log) {
  const mongoEnabled = env.repositoryDriver === "mongo";
  const corsMode = env.corsOrigin.trim() === "*" ? "wildcard" : "allowlist";

  log.info(
    {
      nodeEnv: env.nodeEnv,
      repositoryDriver: env.repositoryDriver,
      mongoEnabled,
      mongoConfigured: Boolean(env.mongodbUri),
      corsMode,
      payosConfigured: env.payosConfigured,
    },
    "Startup configuration",
  );
}
